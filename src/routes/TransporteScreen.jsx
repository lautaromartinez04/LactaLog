import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalisisEdit from './components/AnalisisEdit';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import "../styles/transporte.css";

// Importamos las funciones de autenticación
import { getToken, renewToken, fetchWithToken, removeTokenOnUnload } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL;

export const TransporteScreen = () => {
  const [data, setData] = useState([]);
  const [allClients, setAllClients] = useState([]); // Para el select de clientes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [idSearch, setIdSearch] = useState(''); // Estado para búsqueda por ID
  // Diccionario para mapear IDs de usuario a nombres (para creador y modificador)
  const [users, setUsers] = useState({});
  // Estado para el análisis relacionado seleccionado (para abrir el editor)
  const [selectedAnalisis, setSelectedAnalisis] = useState(null);
  // Estado para el filtro seleccionado:
  // Valores posibles: "" (Todos), "open", "closed", "anomalous", "anomalousNotVerified"
  const [filterType, setFilterType] = useState("");

  const navigate = useNavigate();
  const token = getToken(); // Obtiene el token o redirige al login

  // Remover token al salir de la página
  useEffect(() => {
    removeTokenOnUnload();
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
      // En este caso, cerramos el editor tras guardar (puedes modificarlo si prefieres otra acción)
      setSelectedAnalisis(null);
      Swal.fire("Éxito", "Análisis actualizado correctamente", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo actualizar el análisis", "error");
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
    Swal.fire({
      title: 'Descripción de la anomalía',
      text: transporte.ANOMALIA_OBSERVACION || 'Sin descripción',
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
  };

  // Función para agregar transporte (con ventana modal)
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
            <label class="transporte-switch">
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

  // Función para crear un nuevo transporte (sin crear análisis asociado)
  const handleNewTransporte = async (CLIENTEID, FECHAHORATRANSPORTE, LITROS, PALCOHOL, TEMPERATURA) => {
    try {
      const isoFecha = new Date(FECHAHORATRANSPORTE).toISOString();
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
        // Refrescamos toda la lista
        await refreshTransportes();
        Swal.fire("Éxito", "Transporte agregado correctamente", "success");
      } else {
        throw new Error("Error al agregar el transporte");
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire("Error", "No se pudo agregar el transporte", "error");
    }
  };

  // Función para editar transporte (sin crear análisis)
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
        Swal.fire('Éxito', 'Transporte actualizado correctamente', 'success');
      } else {
        throw new Error('Error al actualizar el transporte');
      }
    } catch (err) {
      console.error('Error:', err);
      Swal.fire('Error', 'No se pudo actualizar el transporte', 'error');
    }
  };

  // Función para ver el análisis relacionado a un transporte
  const handleViewAnalisis = async (transporte) => {
    try {
      const response = await fetchWithToken(`${API_URL}/analisis/`, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error("Error al obtener los análisis");
      }
      const analyses = await response.json();
      const relatedAnalysis = analyses.find(a => a.TRANSPORTEID === transporte.TRANSPORTEID);
      if (relatedAnalysis) {
        setSelectedAnalisis(relatedAnalysis);
      } else {
        Swal.fire("No se encontró análisis relacionado", "", "warning");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo obtener el análisis", "error");
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
  const userRole = Number(localStorage.getItem('rol'));
  const isAdmin = userRole === 1;

  const handleCloseTransporte = async (transporte) => {
    Swal.fire({
      title: 'Aviso',
      text: 'Una vez cerrado el transporte no podrá ser editado',
      icon: 'warning',
      confirmButtonText: 'Ok'
    }).then((firstResult) => {
      if (firstResult.isConfirmed) {
        Swal.fire({
          title: '¿Está seguro?',
          text: '¿Está seguro que quiere cerrar el transporte?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí',
          cancelButtonText: 'No'
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
              Swal.fire("Éxito", "Transporte cerrado correctamente", "success");
              refreshTransportes();
            } catch (error) {
              console.error(error);
              Swal.fire("Error", "No se pudo cerrar el transporte", "error");
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
      cancelButtonText: 'No'
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
          Swal.fire("Éxito", "Transporte reabierto correctamente", "success");
          refreshTransportes();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "No se pudo reabrir el transporte", "error");
        }
      }
    });
  };

  const handleVerifyAnomaliaTransporte = (transporte) => {
    Swal.fire({
      title: 'Verificar Anomalía',
      text: `${transporte.ANOMALIA_OBSERVACION || 'Sin descripción'}
      \n Ingrese una descripción para verificar la anomalía:`,
      input: 'text',
      inputPlaceholder: 'Descripción...',
      showCancelButton: true,
      confirmButtonText: 'Verificar',
      cancelButtonText: 'Cancelar',
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
          Swal.fire("Éxito", "Anomalía verificada correctamente", "success");
          refreshTransportes();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "No se pudo verificar la anomalía", "error");
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
      <div className="container text-center mt-5 p-5 w-100 d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container text-center mt-5 p-5 bg-light rounded shadow">
        <p>Error: {error}</p>
      </div>
    );
  }

  // Filtrar transportes según término de búsqueda, ID y filtro seleccionado
  const filteredData = data.filter(item => {
    const client = allClients.find(c => c.CLIENTEID === item.CLIENTEID);
    const clientName = client ? client.NOMBRE : '';
    const modUserName = users[item.USUARIOID_MODIFICACION] || '';
    // Nombre del camionero (creador)
    const camionero = users[item.USUARIOID_TRANSPORTE] || item.USUARIOID_TRANSPORTE;
    const term = searchTerm.toLowerCase();
    const matchesGeneral =
      clientName.toLowerCase().includes(term) ||
      item.FECHAHORATRANSPORTE.toLowerCase().includes(term) ||
      modUserName.toLowerCase().includes(term) ||
      camionero.toString().toLowerCase().includes(term) ||
      item.LITROS.toString().includes(term);
    const matchesId = idSearch ? item.TRANSPORTEID.toString().includes(idSearch) : true;

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
      default:
        matchesFilter = true;
    }

    return matchesGeneral && matchesId && matchesFilter;
  });

  return (
    <div className="text-center m-2 p-5 rounded shadow transporte-container border">
      <h2 className="mb-4">Transporte</h2>
      
      {/* Grupo de botones para filtrar */}
      <div className="btn-group mb-3">
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
      </div>
      
      {/* Buscador y botón para agregar transporte */}
      <div className="d-flex align-items-center justify-content-center mb-3">
        <input
          type="text"
          className="form-control transporte-search me-2"
          placeholder="Buscar por cliente, fecha, usuario o litros"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="text"
          className="form-control w-auto me-2"
          placeholder="ID"
          value={idSearch}
          onChange={(e) => setIdSearch(e.target.value)}
        />
        <button className="btn btn-success transporte-add-btn" onClick={handleAddTransporteButtonClick}>
          <i className="fas fa-plus"></i>
        </button>
      </div>
      
      <table className="table table-striped table-bordered transporte-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Fecha Transporte</th>
            <th>Camionero</th>
            <th>Fecha Modificación</th>
            <th>Modificador</th>
            <th>Litros de Leche</th>
            <th>Estado</th>
            <th>Anomalía</th>
            <th>Anomalia Verificada</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((transporte) => (
              <tr key={transporte.TRANSPORTEID}>
                <td>
                  {allClients.find(c => c.CLIENTEID === transporte.CLIENTEID)
                    ? allClients.find(c => c.CLIENTEID === transporte.CLIENTEID).NOMBRE
                    : transporte.CLIENTEID}
                </td>
                <td>{new Date(transporte.FECHAHORATRANSPORTE).toLocaleString()}</td>
                <td>{users[transporte.USUARIOID_TRANSPORTE] || transporte.USUARIOID_TRANSPORTE}</td>
                <td>{new Date(transporte.FECHAHORAMODIFICACION).toLocaleString()}</td>
                <td>{users[transporte.USUARIOID_MODIFICACION] || transporte.USUARIOID_MODIFICACION}</td>
                <td>{transporte.LITROS}</td>
                <td>
                  {transporte.CERRADO ? (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>Cerrado</span>
                  ) : (
                    <span style={{ color: 'red', fontWeight: 'bold' }}>Abierto</span>
                  )}
                </td>
                <td>
                  {transporte.ANOMALIA ? (
                    <span style={{ color: 'red', fontWeight: 'bold' }}>Sí</span>
                  ) : (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>No</span>
                  )}
                </td>
                <td>
                  {transporte.ANOMALIA ? (
                    transporte.ANOMALIA_VERIFICADA ? (
                      <div
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        onClick={() => handleShowAnomaliaDescripcion(transporte)}
                      >
                        <span style={{ color: 'green', fontWeight: 'bold' }}>Verificada</span>
                        <i className="fas fa-info-circle" style={{ marginLeft: "5px", color: "#FFC107" }}></i>
                      </div>
                    ) : (
                      <>
                      <button
                        className="btn btn-warning btn-sm mr-2"
                        style={{ cursor: "pointer", fontWeight: "bolder" }}
                        onClick={() => handleVerifyAnomaliaTransporte(transporte)}
                      >
                        Verificar
                      </button>
                      <i className="fas fa-info-circle" onClick={() => handleShowAnomaliaDescripcion(transporte)} style={{ marginLeft: "5px", color: "#FFC107", cursor: "pointer" }}></i>
                      </>
                      
                    )
                  ) : (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>No requerida</span>
                  )}
                </td>
                <td className="d-flex justify-content-center">
                  {transporte.CERRADO ? (
                    isAdmin ? (
                      <button
                        className="btn btn-success btn-sm mr-2"
                        title="Reabrir transporte"
                        onClick={() => handleReopenTransporte(transporte)}
                      >
                        <i className="fas fa-lock-open"></i>
                      </button>
                    ) : (
                      <button
                        className="btn btn-danger btn-sm mr-2"
                        title="Transporte cerrado"
                        disabled
                      >
                        <i className="fas fa-lock"></i>
                      </button>
                    )
                  ) : (
                    <>
                      <button
                        className="btn btn-info btn-sm rounded-circle mr-2"
                        title="Editar transporte"
                        onClick={() => handleEditTransporte(transporte)}
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm mr-2"
                        title="Cerrar transporte"
                        onClick={() => handleCloseTransporte(transporte)}
                      >
                        <i className="fas fa-lock"></i>
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    title="Ver análisis"
                    onClick={() => handleViewAnalisis(transporte)}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10">No se encontraron resultados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransporteScreen;
