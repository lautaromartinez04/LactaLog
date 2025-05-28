import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalisisEdit from './components/AnalisisEdit';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import "../styles/transporte.css";

// Importamos las funciones de autenticación
import { getToken, fetchWithToken, removeTokenOnUnload, removeTokenOnPage } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL;

export const TransporteScreen = () => {
  const [data, setData] = useState([]);
  const [allClients, setAllClients] = useState([]); // Para el select de clientes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Diccionario para mapear IDs de usuario a nombres (para creador y modificador)
  const [users, setUsers] = useState({});
  // Estado para el análisis relacionado seleccionado (para abrir el editor)
  const [selectedAnalisis, setSelectedAnalisis] = useState(null);
  // Estado para el filtro seleccionado:
  // Valores posibles: "" (Todos), "open", "closed", "anomalous", "anomalousNotVerified", "decomisado"
  const [filterType, setFilterType] = useState("");

  const navigate = useNavigate();
  const token = getToken(); // Obtiene el token o redirige al login

  // Obtenemos el rol y, en caso de cliente, su CLIENTEID
  const userRole = Number(localStorage.getItem('rol'));
  const clienteId = userRole === 2 ? Number(localStorage.getItem('clienteId')) : null;

  // Remover token al salir de la página
  useEffect(() => {
    removeTokenOnUnload();
    removeTokenOnPage();
  }, []);

  // Función para refrescar la lista de transportes (para actualizar la tabla sin recargar)
  const refreshTransportes = async () => {
    try {
      const response = await fetchWithToken(`${API_URL}/transporte/`, { method: 'GET' });
      if (!response.ok) {
        throw new Error('Error al obtener los transportes');
      }
      const result = await response.json();
      // Ordenar los transportes: el más reciente (según FECHAHORATRANSPORTE) primero
      result.sort((a, b) => new Date(b.FECHAHORATRANSPORTE) - new Date(a.FECHAHORATRANSPORTE));
      setData(result);
    } catch (err) {
      console.error(err);
    }
  };

  // Función para actualizar (guardar) el análisis relacionado (sin crear análisis)
  const handleSaveAnalisis = async (analysisID, payload) => {
    try {
      const response = await fetchWithToken(`${API_URL}/analisis/${analysisID}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Error al actualizar el análisis");
      }
      setSelectedAnalisis(null);
      Swal.fire({
        title: "Análisis actualizado correctamente",
        icon: "success",
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error al actualizar el análisis",
        icon: "error",
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  // Obtener la lista de transportes y cargar nombres de usuarios
  useEffect(() => {
    const fetchTransportes = async () => {
      try {
        const response = await fetchWithToken(`${API_URL}/transporte/`, {
          method: 'GET'
        });
        if (!response.ok) {
          throw new Error('Error al obtener los transportes');
        }
        const result = await response.json();
        // Ordenar los transportes: el más reciente (según FECHAHORATRANSPORTE) primero
        result.sort((a, b) => new Date(b.FECHAHORATRANSPORTE) - new Date(a.FECHAHORATRANSPORTE));
        setData(result);
        setLoading(false);

        // Obtener IDs únicos de usuarios (creador y modificador)
        const uniqueUserIds = [
          ...new Set(
            result.flatMap(item => [item.USUARIOID_TRANSPORTE, item.USUARIOID_MODIFICACION])
              .filter(id => id !== 0)
          )
        ];
        uniqueUserIds.forEach(id => {
          fetchWithToken(`${API_URL}/usuarios/${id}`)
            .then(res => res.json())
            .then(userData => {
              setUsers(prev => ({ ...prev, [id]: userData.NOMBRE }));
            })
            .catch(err => console.error('Error al obtener usuario', id, err));
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchTransportes();
  }, [token]);

  // Obtener la lista de clientes para el select
  useEffect(() => {
    fetchWithToken(`${API_URL}/clientes/`)
      .then(res => res.json())
      .then(clientList => {
        setAllClients(clientList);
      })
      .catch(err => console.error('Error al obtener clientes', err));
  }, [token]);

  const handleShowAnomaliaDescripcion = (transporte) => {
    let info = transporte.ANOMALIA_OBSERVACION.replace(/\. \nL/g, '.<br> • L');
    info = info.replace(/\a:/g, 'as:<br> • ');
    info = info.replace(/Anomalías:/g, '<span class="text-danger" style="font-weight: bold; display: block; text-align: center !important; width: 100%;">Anomalías</span>');
    info = info.replace(/\. \n\. \n/g, '.<br>');
    info = info.replace(/Verificacion del usuario:/g, '<span class="text-info" style="font-weight: bold; display: block; text-align: center !important; width: 100%; margin-top: 10px;">Verificación</span>  • ');
    Swal.fire({
      title: 'Descripción de la verificación',
      html: `<div style="text-align: left;">${info} </div>`,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      customClass: {
        confirmButton: 'btn btn-guardar'
      }
    });
  };

  // Función para agregar transporte (solo para usuarios que no sean clientes)
  const handleAddTransporteButtonClick = () => {
    Swal.fire({
      title: "Nuevo Transporte",
      html: `
        <label style="display:block; text-align:center;">Cliente:</label>
        <select id="CLIENTEID" class="swal2-input transporte-select" style="text-align:left;">
          ${allClients.map(client => `<option value="${client.CLIENTEID}">${client.NOMBRE}</option>`).join('')}
        </select>
        <label style="display:block; text-align:center;" class="mt-3">Fecha y Hora:</label>
        <input type="datetime-local" id="FECHAHORATRANSPORTE" class="swal2-input transporte-datetime m-0" placeholder="Fecha y hora">
        <input type="number" id="LITROS" class="swal2-input transporte-number" placeholder="Litros de leche">
        <div class="prueba-alcohol-container">
          <p class="prueba-label">Prueba de alcohol:</p>
          <div class="transporte-switch-container">
            <span class="negative-label">Negativa</span>
            <label class="transporte-switch m-0">
              <input type="checkbox" id="PALCOHOL" />
              <span class="transporte-slider transporte-round"></span>
            </label>
            <span class="positive-label">Positiva</span>
          </div>
        </div>
        <input type="number" id="TEMPERATURA" class="swal2-input transporte-number" placeholder="Temperatura">
      `,
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      },
      preConfirm: () => {
        const CLIENTEID = Swal.getPopup().querySelector("#CLIENTEID").value;
        const FECHAHORATRANSPORTE = Swal.getPopup().querySelector("#FECHAHORATRANSPORTE").value;
        const LITROS = Swal.getPopup().querySelector("#LITROS").value;
        const PALCOHOL = Swal.getPopup().querySelector("#PALCOHOL").checked;
        const TEMPERATURA = Swal.getPopup().querySelector("#TEMPERATURA").value;
        if (!CLIENTEID || !FECHAHORATRANSPORTE || !LITROS || TEMPERATURA === "") {
          Swal.showValidationMessage("Todos los campos son obligatorios");
          return false;
        }
        handleNewTransporte(CLIENTEID, FECHAHORATRANSPORTE, LITROS, PALCOHOL, TEMPERATURA);
      }
    });
  };

  // Función para crear un nuevo transporte (no aplicable para clientes)
  const handleNewTransporte = async (CLIENTEID, FECHAHORATRANSPORTE, LITROS, PALCOHOL, TEMPERATURA) => {
    try {
      const fechaTransporte = new Date(FECHAHORATRANSPORTE);
      fechaTransporte.setHours(fechaTransporte.getHours() - 3);
      const isoFecha = fechaTransporte.toISOString();
      const newTransporte = {
        USUARIOID_TRANSPORTE: Number(localStorage.getItem('userIDLogin') || 0),
        CLIENTEID: Number(CLIENTEID),
        FECHAHORATRANSPORTE: isoFecha,
        LITROS: Number(LITROS),
        PALCOHOL,
        TEMPERATURA: Number(TEMPERATURA)
      };
      const response = await fetchWithToken(`${API_URL}/transporte`, {
        method: "POST",
        body: JSON.stringify(newTransporte)
      });
      if (response.ok) {
        await refreshTransportes();
        Swal.fire({
          title: "Transporte agregado correctamente",
          icon: "success",
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        throw new Error("Error al agregar el transporte");
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        title: "Error al agregar el transporte",
        icon: "error",
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const handleDeleteTransporte = async (transporte) => {
    try {
      const result1 = await Swal.fire({
        title: "¿Estás seguro?",
        text: "¿Realmente deseas eliminar este transporte?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        customClass: {
          confirmButton: 'btn btn-guardar',
          cancelButton: 'btn btn-cancelar'
        }
      });
      if (!result1.isConfirmed) return;

      const result2 = await Swal.fire({
        title: "Confirmar eliminación",
        text: "Esta acción no será reversible",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar definitivamente",
        cancelButtonText: "Cancelar",
        customClass: {
          confirmButton: 'btn btn-guardar',
          cancelButton: 'btn btn-cancelar'
        }
      });
      if (!result2.isConfirmed) return;

      const response = await fetchWithToken(`${API_URL}/transporte/${transporte.TRANSPORTEID}`, {
        method: "DELETE"
      });
      if (response.ok) {
        await refreshTransportes();
        Swal.fire({
          title: "Transporte eliminado correctamente",
          icon: "success",
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        throw new Error("Error al eliminar el transporte");
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        title: "Error al eliminar el transporte",
        icon: "error",
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  // Función para editar transporte (solo para usuarios que no sean clientes)
  const handleEditTransporte = (transporte) => {
    if (transporte.CERRADO) {
      Swal.fire("Acción no permitida", "El transporte está cerrado y no puede editarse", "warning");
      return;
    }
    Swal.fire({
      title: "Editar Transporte",
      html: `
        <div style="text-align: left; margin-bottom: 10px;">
          <strong>Fecha Transporte:</strong> ${new Date(transporte.FECHAHORATRANSPORTE).toLocaleString()}
        </div>
        <div style="text-align: left; margin-bottom: 10px;">
          <strong>Fecha Modificación:</strong> ${new Date(transporte.FECHAHORAMODIFICACION).toLocaleString()}
        </div>
        <div style="text-align: left; margin-bottom: 10px;">
          <strong>Camionero:</strong> ${users[transporte.USUARIOID_TRANSPORTE] || transporte.USUARIOID_TRANSPORTE}
        </div>
        <div style="text-align: left; margin-bottom: 10px;">
          <strong>Modificador:</strong> ${users[transporte.USUARIOID_MODIFICACION] || transporte.USUARIOID_MODIFICACION}
        </div>
        <label style="display:block; text-align:center;">Cliente:</label>
        <select id="CLIENTEID" class="swal2-input transporte-select" style="text-align:left;">
          ${allClients.map(client => `<option value="${client.CLIENTEID}" ${client.CLIENTEID === transporte.CLIENTEID ? 'selected' : ''}>${client.NOMBRE}</option>`).join('')}
        </select>
        <input type="number" id="LITROS" class="swal2-input transporte-number" placeholder="Litros de leche" value="${transporte.LITROS}">
        <div class="prueba-alcohol-container">
          <p class="prueba-label">Prueba de alcohol:</p>
          <div class="transporte-switch-container">
            <span class="negative-label">Negativa</span>
            <label class="transporte-switch">
              <input type="checkbox" id="PALCOHOL" ${transporte.PALCOHOL ? 'checked' : ''}/>
              <span class="transporte-slider transporte-round"></span>
            </label>
            <span class="positive-label">Positiva</span>
          </div>
        </div>
        <input type="number" id="TEMPERATURA" class="swal2-input transporte-number" placeholder="Temperatura" value="${transporte.TEMPERATURA}">
      `,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      },
      preConfirm: () => {
        const CLIENTEID = Swal.getPopup().querySelector("#CLIENTEID").value;
        const LITROS = Swal.getPopup().querySelector("#LITROS").value;
        const PALCOHOL = Swal.getPopup().querySelector("#PALCOHOL").checked;
        const TEMPERATURA = Swal.getPopup().querySelector("#TEMPERATURA").value;
        if (!CLIENTEID || !LITROS || TEMPERATURA === "") {
          Swal.showValidationMessage("Los campos editables son obligatorios");
          return false;
        }
        handleUpdateTransporte(
          transporte.TRANSPORTEID,
          transporte,
          CLIENTEID,
          LITROS,
          PALCOHOL,
          TEMPERATURA
        );
      }
    });
  };

  // Función para actualizar transporte: se envía el objeto completo actualizado, sin crear análisis
  const handleUpdateTransporte = async (originalTransportId, originalTransporte, CLIENTEID, LITROS, PALCOHOL, TEMPERATURA) => {
    try {
      const token = getToken();
      const updatedTransporte = {
        ...originalTransporte,
        CLIENTEID: Number(CLIENTEID),
        LITROS: Number(LITROS),
        PALCOHOL,
        TEMPERATURA: Number(TEMPERATURA),
        FECHAHORAMODIFICACION: new Date().toISOString(),
        USUARIOID_MODIFICACION: Number(localStorage.getItem('userIDLogin') || 0),
        VERSION: Number(originalTransporte.VERSION) + 1
      };
      const response = await fetchWithToken(`${API_URL}/transporte/${originalTransportId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTransporte)
      });
      if (response.ok) {
        setData(prevData =>
          prevData.map(item =>
            item.TRANSPORTEID === originalTransportId ? updatedTransporte : item
          )
        );
        Swal.fire({
          icon: 'success',
          title: 'Transporte actualizado correctamente',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        throw new Error('Error al actualizar el transporte');
      }
    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar el transporte',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const handleDecomisarTransporte = async (transporte) => {
    try {
      // Primera confirmación
      const result1 = await Swal.fire({
        title: "¿Estás seguro?",
        text: "¿Realmente deseas decomisar este transporte?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, decomisar",
        cancelButtonText: "Cancelar",
        customClass: {
          confirmButton: 'btn btn-guardar',
          cancelButton: 'btn btn-cancelar'
        }
      });
      if (!result1.isConfirmed) return;

      // Segunda confirmación
      const result2 = await Swal.fire({
        title: "Confirmar decomiso",
        text: "Esta acción no será reversible",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, decomisar definitivamente",
        cancelButtonText: "Cancelar",
        customClass: {
          confirmButton: 'btn btn-guardar',
          cancelButton: 'btn btn-cancelar'
        }
      });
      if (!result2.isConfirmed) return;

      // Solicitar la descripción (motivo) del decomiso
      const result3 = await Swal.fire({
        title: "Motivo del decomiso",
        text: "Ingrese una descripción para el decomiso:",
        input: "text",
        inputPlaceholder: "Descripción...",
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
        customClass: {
          confirmButton: 'btn btn-guardar',
          cancelButton: 'btn btn-cancelar'
        },
        inputValidator: (value) => {
          if (!value) {
            return "La descripción es obligatoria!";
          }
        }
      });
      if (!result3.isConfirmed) return;

      // Realizar la petición PATCH para decomisar el transporte
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/transporte/${transporte.TRANSPORTEID}/decomiso`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          DECOMISO_OBSERVACION: result3.value
        })
      });

      if (!response.ok) {
        throw new Error("Error al decomisar el transporte");
      }
      Swal.fire({
        icon: "success",
        title: "Transporte decomisado correctamente",
        showConfirmButton: false,
        timer: 1500
      });
      refreshTransportes();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error al decomisar el transporte",
        showConfirmButton: false,
        timer: 1500
      });
    }
  };


  // Función para ver el análisis relacionado a un transporte
  const handleViewAnalisis = async (transporte) => {
    try {
      const response = await fetchWithToken(`${API_URL}/analisis/`, {
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error("Error al obtener los análisis");
      }
      const analyses = await response.json();
      const relatedAnalysis = analyses.find(a => a.TRANSPORTEID === transporte.TRANSPORTEID);
      if (relatedAnalysis) {
        // Navega a la pantalla de análisis y pasa el ID del análisis relacionado
        navigate('/analisis', { state: { analysisId: relatedAnalysis.ANALISISID } });
      } else {
        Swal.fire({
          title: "No hay análisis relacionados",
          icon: "info",
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error al obtener los análisis",
        icon: "error",
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  // Función para obtener el nombre del cliente desde el transporte relacionado al análisis
  const getClientNameFromAnalisis = (analisis) => {
    const transporte = data.find(t => t.TRANSPORTEID === analisis.TRANSPORTEID);
    if (transporte) {
      const client = allClients.find(c => c.CLIENTEID === transporte.CLIENTEID);
      return client ? client.NOMBRE : "Cliente no encontrado";
    }
    return "Transporte no encontrado";
  };

  // Función para obtener el nombre del usuario (del análisis)
  const getUserName = (analisis) => {
    return users[analisis.USUARIOID_TRANSPORTE] || analisis.USUARIOID_TRANSPORTE;
  };

  // NUEVAS FUNCIONES PARA OPERAR CIERRE, REAPERTURA Y VERIFICACIÓN DE ANOMALÍAS EN TRANSPORTES
  const isAdmin = userRole === 1;

  const handleCloseTransporte = async (transporte) => {
    Swal.fire({
      title: 'Aviso',
      text: 'Una vez cerrado el transporte no podrá ser editado',
      icon: 'warning',
      confirmButtonText: 'Continuar',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      }
    }).then((firstResult) => {
      if (firstResult.isConfirmed) {
        Swal.fire({
          title: '¿Está seguro?',
          text: '¿Está seguro que quiere cerrar el transporte?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí',
          cancelButtonText: 'No',
          customClass: {
            confirmButton: 'btn btn-guardar',
            cancelButton: 'btn btn-cancelar'
          }
        }).then(async (secondResult) => {
          if (secondResult.isConfirmed) {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${API_URL}/transporte/${transporte.TRANSPORTEID}/cerrar`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              if (!response.ok) {
                throw new Error("Error al cerrar el transporte");
              }
              Swal.fire({
                title: 'Transporte cerrado correctamente',
                icon: 'success',
                showConfirmButton: false,
                timer: 1500
              });
              refreshTransportes();
            } catch (error) {
              console.error(error);
              Swal.fire({
                title: 'Error al cerrar el transporte',
                icon: 'error',
                showConfirmButton: false,
                timer: 1500
              });
            }
          }
        });
      }
    });
  };

  const handleReopenTransporte = async (transporte) => {
    if (!isAdmin) {
      Swal.fire("Acción no permitida", "Solo un administrador puede reabrir el transporte", "warning");
      return;
    }
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea reabrir el transporte?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/transporte/${transporte.TRANSPORTEID}/reabrir`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            throw new Error("Error al reabrir el transporte");
          }
          Swal.fire({
            title: 'Transporte reaberto correctamente',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500
          });
          refreshTransportes();
        } catch (error) {
          console.error(error);
          Swal.fire({
            title: 'Error al reabrir el transporte',
            icon: 'error',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    });
  };

  const handleVerifyAnomaliaTransporte = (transporte) => {
    let info = transporte.ANOMALIA_OBSERVACION.replace(/\. \nE/g, '.<br> • E');
    info = info.replace(/\a:/g, 'as:<br> • ');
    info = info.replace(/Anomalías:/g, '<span class="text-danger" style="font-weight: bold; display: block; text-align: center !important; width: 100%;">Anomalías</span>');
    info = info.replace(/\. \n\. \n/g, ':<br>');
    info = info.replace(/Verificacion del usuario:/g, '<span class="text-info" style="font-weight: bold; display: block; text-align: center !important; width: 100%; margin-top: 10px;">Verificacion</span>  • ');
    Swal.fire({
      title: 'Verificar Anomalía',
      html: `<div style="text-align: left;">${info || 'Sin descripción'} </div>
      \n <span class="text-info" style="font-weight: bold; display: block; text-align: center !important; width: 100%; margin-top: 10px;">Ingrese una descripción para verificar la anomalía</span>`,
      input: 'text',
      inputPlaceholder: 'Descripción...',
      showCancelButton: true,
      confirmButtonText: 'Verificar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'La descripción es requerida!';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const url = `${API_URL}/transporte/${transporte.TRANSPORTEID}/verificar_anomalia`;
          const response = await fetch(url, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ANOMALIA_OBSERVACION: result.value
            })
          });
          if (!response.ok) {
            throw new Error("Error al verificar la anomalía");
          }
          Swal.fire({
            title: 'Anomalía verificada correctamente',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500
          });
          refreshTransportes();
        } catch (error) {
          console.error(error);
          Swal.fire({
            title: 'Error al verificar la anomalía',
            icon: 'error',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    });
  };

  if (selectedAnalisis) {
    return (
      <AnalisisEdit
        analisis={selectedAnalisis}
        onSave={handleSaveAnalisis}
        onCancel={() => setSelectedAnalisis(null)}
        userName={getUserName(selectedAnalisis)}
        clientName={getClientNameFromAnalisis(selectedAnalisis)}
      />
    );
  }

  if (loading) {
    return (
      <div className="container text-center text-warning mt-5 p-5 w-100 d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container text-center mt-5 p-5 bg-light bold">
        <h1>Error al cargar los transportes</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Filtrar transportes según búsqueda, ID, filtro y CLIENTEID si el usuario es cliente
  const filteredData = data.filter(item => {
    const client = allClients.find(c => c.CLIENTEID === item.CLIENTEID);
    const clientNameText = client ? client.NOMBRE : '';
    const modUserName = users[item.USUARIOID_MODIFICACION] || '';
    // Nombre del camionero (creador)
    const camionero = users[item.USUARIOID_TRANSPORTE] || item.USUARIOID_TRANSPORTE;
    const term = searchTerm.toLowerCase();
    const matchesGeneral =
      clientNameText.toLowerCase().includes(term) ||
      item.FECHAHORATRANSPORTE.toLowerCase().includes(term) ||
      modUserName.toLowerCase().includes(term) ||
      camionero.toString().toLowerCase().includes(term) ||
      item.LITROS.toString().includes(term);

    let matchesFilter = true;
    switch (filterType) {
      case "open":
        matchesFilter = !item.CERRADO;
        break;
      case "closed":
        matchesFilter = item.CERRADO;
        break;
      case "anomalous":
        matchesFilter = item.ANOMALIA;
        break;
      case "anomalousNotVerified":
        matchesFilter = item.ANOMALIA && !item.ANOMALIA_VERIFICADA;
        break;
      case "decomisado":
        matchesFilter = item.DECOMISO === true;
        break;
      default:
        matchesFilter = true;
    }

    // Si el usuario es cliente, filtrar por CLIENTEID
    if (userRole === 2) {
      if (Number(item.CLIENTEID) !== clienteId) return false;
    }

    return matchesGeneral && matchesFilter;
  });

  return (
    <div className="text-center m-2 p-2 rounded shadow transporte-container border">
      <h1 className="mb-4">Transporte</h1>
      {/* Grupo de botones para filtrar */}
      <div className="btn-group mb-3 d-none d-md-block">
        <button
          className={`btn btn-LL-A ${filterType === "" ? "active" : ""}`}
          onClick={() => setFilterType("")}
        >
          Todos
        </button>
        <button
          className={`btn btn-LL-A ${filterType === "open" ? "active" : ""}`}
          onClick={() => setFilterType("open")}
        >
          Abiertos
        </button>
        <button
          className={`btn btn-LL-A ${filterType === "closed" ? "active" : ""}`}
          onClick={() => setFilterType("closed")}
        >
          Cerrados
        </button>
        <button
          className={`btn btn-LL-A ${filterType === "anomalous" ? "active" : ""}`}
          onClick={() => setFilterType("anomalous")}
        >
          Anómalos
        </button>
        <button
          className={`btn btn-LL-A ${filterType === "anomalousNotVerified" ? "active" : ""}`}
          onClick={() => setFilterType("anomalousNotVerified")}
        >
          No verificados
        </button>
        <button
          className={`btn btn-LL-A ${filterType === "decomiso" ? "active" : ""}`}
          onClick={() => setFilterType("decomisado")}
        >
          Decomisados
        </button>
      </div>

      {/* Grupo de botones para filtrar (vertical) */}
      <div className="btn-group-vertical mb-3 d-md-none d-block">
        <button
          className={`btn btn-LL-A mb-2 ${filterType === "" ? "active" : ""}`}
          onClick={() => setFilterType("")}
        >
          Todos
        </button>
        <button
          className={`btn btn-LL-A mb-2 ${filterType === "open" ? "active" : ""}`}
          onClick={() => setFilterType("open")}
        >
          Abiertos
        </button>
        <button
          className={`btn btn-LL-A mb-2 ${filterType === "closed" ? "active" : ""}`}
          onClick={() => setFilterType("closed")}
        >
          Cerrados
        </button>
        <button
          className={`btn btn-LL-A mb-2 ${filterType === "anomalous" ? "active" : ""}`}
          onClick={() => setFilterType("anomalous")}
        >
          Anómalos
        </button>
        <button
          className={`btn btn-LL-A mb-2 ${filterType === "anomalousNotVerified" ? "active" : ""}`}
          onClick={() => setFilterType("anomalousNotVerified")}
        >
          No verificados
        </button>
        <button
          className={`btn btn-LL-A mb-2 ${filterType === "decomiso" ? "active" : ""}`}
          onClick={() => setFilterType("decomisado")}
        >
          Decomisados
        </button>
      </div>


      {/* Buscador y, si no es cliente, botón para agregar transporte */}
      <div className="d-flex align-items-center justify-content-center mb-3">
        <input
          type="text"
          className="form-control transporte-search me-2"
          placeholder="Buscar por cliente, fecha, usuario o litros"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {userRole !== 2 && (
          <button className="btn btn-outline-success transporte-add-btn ml-2" onClick={handleAddTransporteButtonClick}>
            <i className="fas fa-plus"></i>
          </button>
        )}
      </div>

      {/* Tabla responsive */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered transporte-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Fecha Transporte</th>
              <th>Camionero</th>
              <th>Modificacion</th>
              <th>Litros</th>
              <th>Estado</th>
              <th>Anomalia</th>
              <th>Verificaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="">
            {filteredData.length > 0 ? (
              filteredData.map((transporte) => (
                <tr key={transporte.TRANSPORTEID}>
                  <td>
                    {allClients.find(c => c.CLIENTEID === transporte.CLIENTEID)?.NOMBRE || transporte.CLIENTEID}
                  </td>
                  <td>{new Date(transporte.FECHAHORATRANSPORTE).toLocaleString()}</td>
                  <td>{users[transporte.USUARIOID_TRANSPORTE] || transporte.USUARIOID_TRANSPORTE}</td>
                  <td>{new Date(transporte.FECHAHORAMODIFICACION).toLocaleString()} <br/><span style={{ fontStyle: 'italic', color: 'gray' }}>por</span> {users[transporte.USUARIOID_MODIFICACION] || transporte.USUARIOID_MODIFICACION}</td>
                  <td>{transporte.LITROS}<span style={{ fontStyle: 'italic', fontSize: '0.8em', color: 'gray' }}>Lt</span></td>
                  <td>
                    {transporte.CERRADO ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>Cerrado</span>
                    ) : (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>Abierto</span>
                    )}
                  </td>
                  {/* Columna de anomalias */}
                  <td>
                    {transporte.ANOMALIA ? (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>SI</span>
                    ) : (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>NO</span>
                    )}
                  </td>
                  {/* Columna de verificaciones */}
                  <td className='flex-fill'>
                    {transporte.ANOMALIA ? (
                      transporte.ANOMALIA_VERIFICADA ? (
                        <div
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          onClick={() => handleShowAnomaliaDescripcion(transporte)}
                        >
                          <span style={{ color: 'green', fontWeight: 'bold' }}>Anomalía Verificada</span>
                          <i className="fas fa-info-circle" style={{ marginLeft: "5px", color: "#FFC107" }}></i>
                        </div>
                      ) : (
                        userRole !== 2 ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <button
                              className="btn btn-outline-warning btn-sm mb-2"
                              style={{ cursor: "pointer", fontWeight: "bolder" }}
                              onClick={() => handleVerifyAnomaliaTransporte(transporte)}
                            >
                              Verificar Anomalía
                            </button>
                            <i
                              className="fas fa-info-circle"
                              onClick={() => handleShowAnomaliaDescripcion(transporte)}
                              style={{ marginLeft: "5px", color: "#FFC107", cursor: "pointer" }}
                            ></i>
                          </div>
                        ) : (
                          <>
                            <div className='d-flex justify-content-center align-items-center'>
                              <span className='text-warning text-center' style={{ fontWeight: "bold" }}>En espera</span>
                              <i
                                className="fas fa-info-circle"
                                onClick={() => handleShowAnomaliaDescripcion(transporte)}
                                style={{ marginLeft: "5px", color: "#FFC107", cursor: "pointer" }}
                              ></i>
                            </div>

                          </>
                        )
                      )
                    ) : (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>Sin anomalías</span>
                    )}
                    {transporte.DECOMISO ? (
                      <div style={{ display: "flex", alignItems: "center", cursor: "pointer", justifyContent:"center" }}
                        onClick={() => Swal.fire({ title: 'Motivo del decomiso', text: "• " + transporte.DECOMISO_OBSERVACION, icon: 'info', confirmButtonText: 'Aceptar', customClass: { confirmButton: 'btn btn-guardar' } })}>
                        <span className='text-center' style={{ color: 'red', fontWeight: 'bold'}}>Decomisado</span>
                        <i className="fas fa-info-circle" style={{ marginLeft: "5px", color: "#FFC107" }}></i>
                      </div>
                    ) : (
                      null
                    )}
                  </td>
                  {/* Columna de acciones */}
                  <td className="acciones">
                    <div>
                      {userRole === 2 ? (
                        <button
                          className="btn btn-outline-primary btn-sm m-1"
                          title="Ver análisis"
                          onClick={() => handleViewAnalisis(transporte)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      ) : (
                        <>
                          {transporte.CERRADO ? (
                            isAdmin ? (
                              <button
                                className="btn btn-outline-success btn-sm m-1"
                                title="Reabrir transporte"
                                onClick={() => handleReopenTransporte(transporte)}
                              >
                                <i className="fas fa-lock-open"></i>
                              </button>
                            ) : (
                              <button
                                className="btn btn-outline-danger btn-sm m-1"
                                title="Transporte cerrado"
                                disabled
                              >
                                <i className="fas fa-lock"></i>
                              </button>
                            )
                          ) : (
                            <>
                              <button
                                className="btn btn-outline-info btn-sm m-1"
                                title="Editar transporte"
                                onClick={() => handleEditTransporte(transporte)}
                              >
                                <i className="fas fa-pencil-alt"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm m-1"
                                title="Cerrar transporte"
                                onClick={() => handleCloseTransporte(transporte)}
                              >
                                <i className="fas fa-lock"></i>
                              </button>
                            </>
                          )}
                          <button
                            className="btn btn-outline-primary btn-sm m-1"
                            title="Ver análisis"
                            onClick={() => handleViewAnalisis(transporte)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {isAdmin && transporte.DECOMISO !== true && (
                            <>
                              <button
                                className="btn btn-outline-warning btn-sm m-1"
                                title="Decomisar transporte"
                                onClick={() => handleDecomisarTransporte(transporte)}
                              >
                                <i className="fas fa-exclamation-triangle"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm m-1"
                                title="Eliminar transporte"
                                onClick={() => handleDeleteTransporte(transporte)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9">No se encontraron resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransporteScreen;
