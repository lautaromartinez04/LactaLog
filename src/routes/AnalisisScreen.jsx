import React, { useState, useEffect } from 'react';
import AnalisisEdit from './components/AnalisisEdit';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import "../styles/analisis.css";
import { useLocation } from 'react-router-dom';
import { getToken, fetchWithToken, removeTokenOnUnload, removeTokenOnPage } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL;

export const AnalisisScreen = () => {
  const [analisisList, setAnalisisList] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalisis, setSelectedAnalisis] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastViewedAnalisisId, setLastViewedAnalisisId] = useState(null);
  // Estado para el filtro seleccionado:
  // Valores posibles: "" (todos), "open", "closed", "anomalous", "anomalousNotVerified"
  const [filterType, setFilterType] = useState("");

  const token = getToken();
  const location = useLocation();

  // Obtener rol del usuario y, en caso de cliente (rol 2), su CLIENTEID
  const userRole = Number(localStorage.getItem('rol'));
  const clienteId = userRole === 2 ? Number(localStorage.getItem('clienteId')) : null;

  useEffect(() => {
    removeTokenOnUnload();
    removeTokenOnPage();
  }, []);

  useEffect(() => {
    if (location.state && location.state.analysisId) {
      const analysisToOpen = analisisList.find(a => a.ANALISISID === location.state.analysisId);
      if (analysisToOpen) {
        setSelectedAnalisis(analysisToOpen);
        setLastViewedAnalisisId(analysisToOpen.ANALISISID);
      }
    }
  }, [location.state, analisisList]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch análisis
        const resAnalisis = await fetchWithToken(`${API_URL}/analisis/`, { method: 'GET' });
        if (!resAnalisis.ok) throw new Error("Error al obtener análisis");
        const analyses = await resAnalisis.json();
        // Ordenar análisis: el más reciente primero
        analyses.sort((a, b) => new Date(b.FECHAHORAANALISIS) - new Date(a.FECHAHORAANALISIS));

        // Fetch transportes
        const resTransportes = await fetchWithToken(`${API_URL}/transporte/`, { method: 'GET' });
        if (!resTransportes.ok) throw new Error("Error al obtener transportes");
        const transportesData = await resTransportes.json();

        // Fetch clientes
        const resClients = await fetchWithToken(`${API_URL}/clientes/`, { method: 'GET' });
        if (!resClients.ok) throw new Error("Error al obtener clientes");
        const clientsData = await resClients.json();

        setAnalisisList(analyses);
        setTransportes(transportesData);
        setClients(clientsData);

        // Obtener nombres de usuarios para cada análisis (excluyendo 0)
        const userIds = [
          ...new Set(analyses.map(a => a.USUARIOID_ANALISIS).filter(id => id !== 0))
        ];
        userIds.forEach(async id => {
          try {
            const resUser = await fetchWithToken(`${API_URL}/usuarios/${id}`, { method: 'GET' });
            if (resUser.ok) {
              const userData = await resUser.json();
              setUsers(prev => ({ ...prev, [id]: userData.NOMBRE }));
            }
          } catch (err) {
            console.error("Error al obtener usuario", id, err);
          }
        });

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token]);

  // Filtrado de análisis según búsqueda, ID, filtro seleccionado y (si rol 2) CLIENTEID asociado
  const filteredAnalisis = analisisList.filter(analisis => {
    const user = users[analisis.USUARIOID_ANALISIS] || analisis.USUARIOID_ANALISIS;
    const client = (() => {
      const transporte = transportes.find(t => t.TRANSPORTEID === analisis.TRANSPORTEID);
      if (transporte) {
        const cl = clients.find(c => c.CLIENTEID === transporte.CLIENTEID);
        return cl ? cl.NOMBRE : "";
      }
      return "";
    })();
    const matchesGeneral = (
      user.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtro por estado (abierto, cerrado, etc.)
    let matchesFilter = true;
    switch (filterType) {
      case "open":
        matchesFilter = !analisis.CERRADO;
        break;
      case "closed":
        matchesFilter = analisis.CERRADO;
        break;
      case "anomalous":
        matchesFilter = analisis.ANOMALIA;
        break;
      case "anomalousNotVerified":
        matchesFilter = analisis.ANOMALIA && !analisis.ANOMALIA_VERIFICADA;
        break;
      default:
        matchesFilter = true;
    }

    // Si el usuario es cliente, se filtran solo los análisis relacionados a su CLIENTEID
    if (userRole === 2) {
      const transporte = transportes.find(t => t.TRANSPORTEID === analisis.TRANSPORTEID);
      if (!transporte || Number(transporte.CLIENTEID) !== clienteId) {
        return false;
      }
    }

    return matchesGeneral && matchesFilter;
  });

  const getClientNameFromAnalisis = (analisis) => {
    const transporte = transportes.find(t => t.TRANSPORTEID === analisis.TRANSPORTEID);
    if (transporte) {
      const client = clients.find(c => c.CLIENTEID === transporte.CLIENTEID);
      return client ? client.NOMBRE : "Cliente no encontrado";
    }
    return "Transporte no encontrado";
  };

  const getUserName = (analisis) => {
    return users[analisis.USUARIOID_ANALISIS] || analisis.USUARIOID_ANALISIS;
  };

  const handleViewClick = (analisis) => {
    setLastViewedAnalisisId(analisis.ANALISISID);
    setSelectedAnalisis(analisis);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleSaveAnalisis = async (analysisID, payload) => {
    try {
      const response = await fetchWithToken(`${API_URL}/analisis/${analysisID}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Error al actualizar el análisis");
      }
      // Actualiza la lista de análisis
      setAnalisisList(prev =>
        prev.map(item =>
          item.ANALISISID === analysisID ? { ...item, ...payload } : item
        )
      );
      // Actualiza el análisis seleccionado sin salir de la vista de detalles
      if (selectedAnalisis && selectedAnalisis.ANALISISID === analysisID) {
        setSelectedAnalisis({ ...selectedAnalisis, ...payload });
      }
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

  const handleCancelEdit = () => {
    setSelectedAnalisis(null);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleVerifyAnomalia = (analisis) => {
    let info = analisis.ANOMALIA_OBSERVACION.replace(/\. \nE/g, '.<br> • E');
    info = info.replace(/\a:/g, 'as:<br> • ');
    info = info.replace(/Anomalías:/g, '<span class="text-danger" style="font-weight: bold; display: block; text-align: center !important; width: 100%;">Anomalías</span>');
    info = info.replace(/\. \n\. \n/g, ':<br>');
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
          const response = await fetch(`${API_URL}/analisis/${analisis.ANALISISID}/verificar_anomalia`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              ANOMALIA_OBSERVACION: result.value
            })
          });
          if (!response.ok) {
            throw new Error("Error al verificar la anomalía");
          }
          Swal.fire({
            icon: 'success',
            title: 'Anomalía verificada',
            showConfirmButton: false,
            timer: 1500
          });
          refreshAnalisisList();
        } catch (error) {
          console.error(error);
          Swal.fire({
            icon: 'error',
            title: 'Error al verificar la anomalía',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    });
  };

  const handleShowAnomaliaDescripcion = (analisis) => {
    let info = analisis.ANOMALIA_OBSERVACION.replace(/\. \nE/g, '.<br> • E');
    info = info.replace(/\a:/g, 'as:<br> • ');
    info = info.replace(/Anomalías:/g, '<span class="text-danger" style="font-weight: bold; display: block; text-align: center !important; width: 100%;">Anomalías</span>');
    info = info.replace(/\. \n\. \n/g, '.<br>');
    info = info.replace(/Verificacion del usuario:/g, '<span class="text-info" style="font-weight: bold; display: block; text-align: center !important; width: 100%; margin-top: 10px;">Verificación</span>  • ');
    Swal.fire({
      title: 'Descripción de la verificación',
      html: `<div style="text-align: left;">${info} </div>`,
      icon: 'info',
      confirmButtonText: 'Aceptar',
      customClass: {
        confirmButton: 'btn btn-guardar'
      }
    });
  };

  const updateAnalisis = (updatedAnalysis) => {
    setAnalisisList(prev =>
      prev.map(item =>
        item.ANALISISID === updatedAnalysis.ANALISISID ? updatedAnalysis : item
      )
    );
    if (selectedAnalisis && selectedAnalisis.ANALISISID === updatedAnalysis.ANALISISID) {
      setSelectedAnalisis(updatedAnalysis);
    }
  };

  const refreshAnalisisList = async () => {
    try {
      const resAnalisis = await fetchWithToken(`${API_URL}/analisis/`, { method: 'GET' });
      if (!resAnalisis.ok) throw new Error("Error al obtener análisis");
      const analyses = await resAnalisis.json();
      analyses.sort((a, b) => new Date(b.FECHAHORAANALISIS) - new Date(a.FECHAHORAANALISIS));
      setAnalisisList(analyses);
    } catch (err) {
      console.error(err);
    }
  };

  const isManager = userRole === 1;

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
        <h1>Error al obtener análisis</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (selectedAnalisis) {
    return (
      <AnalisisEdit
        analisis={selectedAnalisis}
        onSave={handleSaveAnalisis}
        onCancel={handleCancelEdit}
        updateAnalisis={updateAnalisis}
        refreshAnalisisList={refreshAnalisisList}
        userName={getUserName(selectedAnalisis)}
        clientName={getClientNameFromAnalisis(selectedAnalisis)}
      />
    );
  }

  return (
    <div className="container mt-2 mb-2 text-center p-5 bg-light rounded shadow analisis-container">
      <h1 className="mb-4">Análisis</h1>

      {/* Grupo de botones para filtrar */}
      {/* Filtros en escritorio (horizontal) */}
      <div className="btn-group mb-3 d-none d-md-inline-flex">
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

      {/* Filtros en móvil (vertical) */}
      <div className="d-block d-md-none">
        <button
          className={`btn btn-LL-A w-100 mb-2 ${filterType === "" ? "active" : ""}`}
          onClick={() => setFilterType("")}
        >
          Todos
        </button>
        <button
          className={`btn btn-LL-A w-100 mb-2 ${filterType === "open" ? "active" : ""}`}
          onClick={() => setFilterType("open")}
        >
          Abiertos
        </button>
        <button
          className={`btn btn-LL-A w-100 mb-2 ${filterType === "closed" ? "active" : ""}`}
          onClick={() => setFilterType("closed")}
        >
          Cerrados
        </button>
        <button
          className={`btn btn-LL-A w-100 mb-2 ${filterType === "anomalous" ? "active" : ""}`}
          onClick={() => setFilterType("anomalous")}
        >
          Anómalos
        </button>
        <button
          className={`btn btn-LL-A w-100 ${filterType === "anomalousNotVerified" ? "active" : ""}`}
          onClick={() => setFilterType("anomalousNotVerified")}
        >
          No verificados
        </button>
      </div>

      {/* Buscador */}
      <div className="my-3 d-flex flex-column flex-md-row">
        <input
          type="text"
          className="form-control me-2"
          placeholder="Buscar por usuario o cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de análisis */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered analisis-table">
          <thead>
            <tr>
              <th>Camionero</th>
              <th>Cliente</th>
              <th>Fecha de Análisis</th>
              <th>Estado</th>
              <th>Anomalía</th>
              <th>Verificación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnalisis.length > 0 ? (
              filteredAnalisis.map((analisis) => (
                <tr
                  key={analisis.ANALISISID}
                  className={lastViewedAnalisisId === analisis.ANALISISID ? "fila selected-row" : "fila"}
                >
                  <td>{getUserName(analisis)}</td>
                  <td>{getClientNameFromAnalisis(analisis)}</td>
                  <td>{new Date(analisis.FECHAHORAANALISIS).toLocaleString()}</td>
                  <td>
                    {analisis.CERRADO ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>Cerrado</span>
                    ) : (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>Abierto</span>
                    )}
                  </td>
                  <td>
                    {analisis.ANOMALIA ? (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>Sí</span>
                    ) : (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>No</span>
                    )}
                  </td>
                  <td>
                    {analisis.ANOMALIA ? (
                      analisis.ANOMALIA_VERIFICADA ? (
                        <div
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          onClick={() => handleShowAnomaliaDescripcion(analisis)}
                        >
                          <span style={{ color: 'green', fontWeight: 'bold' }}>Verificada</span>
                          <i className="fas fa-info-circle" style={{ marginLeft: "5px", color: "rgb(255, 193, 7)" }}></i>
                        </div>
                      ) : (
                        <>
                          {userRole !== 2 ? (
                            <>
                              <button
                                style={{ fontWeight: 'bold' }}
                                className="btn btn-outline-warning btn-sm mr-2"
                                onClick={() => handleVerifyAnomalia(analisis)}
                              >
                                Verificar
                              </button>
                              <i className="fas fa-info-circle" onClick={() => handleShowAnomaliaDescripcion(analisis)} style={{ marginLeft: "5px", color: "rgb(255, 193, 7)", cursor: "pointer" }}></i>
                            </>
                          ) : (<>
                            <span className='text-warning' style={{ fontWeight: "bold" }}>En espera</span>
                            <i className="fas fa-info-circle" onClick={() => handleShowAnomaliaDescripcion(analisis)} style={{ marginLeft: "5px", color: "rgb(255, 193, 7)", cursor: "pointer" }}></i>
                          </>)}
                        </>
                      )
                    ) : (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>No requerida</span>
                    )}
                  </td>
                  <td>
                    {userRole === 2 ? (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleViewClick(analisis)}
                        title='Ver Analisis'
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleViewClick(analisis)}
                        title='Ver Analisis'
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No se encontraron análisis.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalisisScreen;
