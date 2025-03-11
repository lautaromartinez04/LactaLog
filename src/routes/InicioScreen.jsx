import React, { useState, useEffect } from 'react';
import { getToken, fetchWithToken, removeTokenOnUnload } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import "../styles/inicio.css";

const API_URL = import.meta.env.VITE_API_URL;

export const InicioScreen = () => {
  const token = getToken();
  const navigate = useNavigate();
  const [dataUsers, setDataUsers] = useState([]);
  const [dataClientes, setDataClientes] = useState([]);
  const [dataTransporte, setDataTransporte] = useState([]);
  const [dataAnalisis, setDataAnalisis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedUserName, setLoggedUserName] = useState('');

  // Estados para indicadores
  const [camionerosCount, setCamionerosCount] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [anomaliesTransporte, setAnomaliesTransporte] = useState([]);
  const [openTransports, setOpenTransports] = useState([]);
  const [anomaliesAnalisis, setAnomaliesAnalisis] = useState([]);
  const [openAnalyses, setOpenAnalyses] = useState([]);

  const [dailyDates, setDailyDates] = useState([]);
  const [dailyVolumeByClient, setDailyVolumeByClient] = useState({});

  // Obtenemos rol y, en caso de cliente, su CLIENTEID
  const userRole = Number(localStorage.getItem('rol'));
  const clienteId = userRole === 2 ? Number(localStorage.getItem('clienteId')) : null;

  useEffect(() => {
    removeTokenOnUnload();
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [usersRes, clientesRes, transporteRes, analisisRes] = await Promise.all([
          fetchWithToken(`${API_URL}/usuarios/`, { method: 'GET' }),
          fetchWithToken(`${API_URL}/clientes/`, { method: 'GET' }),
          fetchWithToken(`${API_URL}/transporte/`, { method: 'GET' }),
          fetchWithToken(`${API_URL}/analisis/`, { method: 'GET' })
        ]);
        if (!usersRes.ok) throw new Error("Error al obtener usuarios");
        if (!clientesRes.ok) throw new Error("Error al obtener clientes");
        if (!transporteRes.ok) throw new Error("Error al obtener transportes");
        if (!analisisRes.ok) throw new Error("Error al obtener análisis");

        const usersData = await usersRes.json();
        const clientesData = await clientesRes.json();
        const transporteData = await transporteRes.json();
        const analisisData = await analisisRes.json();

        setDataUsers(usersData);
        setDataClientes(clientesData);
        setDataTransporte(transporteData);
        setDataAnalisis(analisisData);

        const loggedEmail = localStorage.getItem('username');
        const loggedUser = usersData.find(u => u.EMAIL === loggedEmail);
        if (loggedUser) {
          setLoggedUserName(loggedUser.NOMBRE);
        }

        const camioneros = usersData.filter(u => u.ROLUSUARIO === 4);
        setCamionerosCount(camioneros.length);
        setTotalClientes(clientesData.length);

        // Procesamos transportes
        const sortedTransports = [...transporteData].sort(
          (a, b) => new Date(b.FECHAHORATRANSPORTE) - new Date(a.FECHAHORATRANSPORTE)
        );
        const last30Transports = sortedTransports.slice(0, 30);
        const sortedLast30 = [...last30Transports].sort(
          (a, b) => new Date(a.FECHAHORATRANSPORTE) - new Date(b.FECHAHORATRANSPORTE)
        );

        const dateSet = new Set();
        sortedLast30.forEach(t => {
          const d = new Date(t.FECHAHORATRANSPORTE);
          dateSet.add(d.toISOString().split('T')[0]);
        });
        const sortedDates = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));
        setDailyDates(sortedDates);

        const dailyVolumes = {};
        clientesData.forEach(client => {
          dailyVolumes[client.CLIENTEID] = new Array(sortedDates.length).fill(0);
        });
        sortedLast30.forEach(t => {
          const d = new Date(t.FECHAHORATRANSPORTE);
          const dateStr = d.toISOString().split('T')[0];
          const index = sortedDates.indexOf(dateStr);
          if (index !== -1) {
            dailyVolumes[t.CLIENTEID][index] += Number(t.LITROS);
          }
        });
        setDailyVolumeByClient(dailyVolumes);

        // Para transportes
        const transportAnomalies = transporteData.filter(t =>
          t.ANOMALIA === true && (t.ANOMALIA_VERIFICADA === false || t.ANOMALIA_VERIFICADA === null)
        );
        const transportsOpen = transporteData.filter(t => t.CERRADO === null || t.CERRADO === false);

        // Para análisis
        const analysisAnomalies = analisisData.filter(a =>
          a.ANOMALIA === true && (a.ANOMALIA_VERIFICADA === false || a.ANOMALIA_VERIFICADA === null)
        );
        const analysesOpen = analisisData.filter(a => a.CERRADO === null || a.CERRADO === false);

        // Si el usuario es cliente, filtramos por CLIENTEID usando el transporte asociado
        if (userRole === 2 && clienteId) {
          const anomaliesTransporteFiltered = transportAnomalies.filter(t => Number(t.CLIENTEID) === clienteId);
          const openTransportsFiltered = transportsOpen.filter(t => Number(t.CLIENTEID) === clienteId);
          const anomaliesAnalisisFiltered = analysisAnomalies.filter(a => {
            const transporte = transporteData.find(t => t.TRANSPORTEID === a.TRANSPORTEID);
            return transporte && Number(transporte.CLIENTEID) === clienteId;
          });
          const openAnalysesFiltered = analysesOpen.filter(a => {
            const transporte = transporteData.find(t => t.TRANSPORTEID === a.TRANSPORTEID);
            return transporte && Number(transporte.CLIENTEID) === clienteId;
          });
          setAnomaliesTransporte(anomaliesTransporteFiltered);
          setOpenTransports(openTransportsFiltered);
          setAnomaliesAnalisis(anomaliesAnalisisFiltered);
          setOpenAnalyses(openAnalysesFiltered);
        } else {
          setAnomaliesTransporte(transportAnomalies);
          setOpenTransports(transportsOpen);
          setAnomaliesAnalisis(analysisAnomalies);
          setOpenAnalyses(analysesOpen);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchAllData();
  }, [token]);

  // Función para redirigir a la pantalla de análisis o transporte cuando se hace click en el dashboard
  const handleClickAnomalies = (type) => {
    if (type === 'analisis') {
      navigate('/analisis');
    } else if (type === 'transportes') {
      navigate('/transporte');
    }
  };

  // Función para manejar la configuración de notificaciones
  const handleNotificaciones = () => {
    const loggedEmail = localStorage.getItem('username');
    const loggedUser = dataUsers.find(u => u.EMAIL === loggedEmail) || {};
    Swal.fire({
      title: 'Notificaciones',
      html: `
          <div class="custom-toggle-notif">
            <label class="notif-switch">
              <input type="checkbox" id="WD_EMAIL" ${loggedUser.WD_EMAIL ? 'checked' : ''}>
              <span class="notif-slider"></span>
            </label>
            <span>Notificar por Mail</span>
          </div>
          <div class="custom-toggle-notif" style="margin-top:15px;">
            <label class="notif-switch">
              <input type="checkbox" id="WD_WHATSAPP" ${loggedUser.WD_WHATSAPP ? 'checked' : ''}>
              <span class="notif-slider"></span>
            </label>
            <span>Notificar por WhatsApp</span>
          </div>
          `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        const wdEmail = Swal.getPopup().querySelector('#WD_EMAIL').checked;
        const wdWhatsapp = Swal.getPopup().querySelector('#WD_WHATSAPP').checked;
        return { WD_EMAIL: wdEmail, WD_WHATSAPP: wdWhatsapp };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = localStorage.getItem('userIDLogin');
        // Armamos el payload completo usando los datos actuales del usuario
        const payload = {
          NOMBRE: loggedUser.NOMBRE,
          EMAIL: loggedUser.EMAIL,
          TELEFONO: loggedUser.TELEFONO,
          ROLUSUARIO: loggedUser.ROLUSUARIO,
          EXTERNO: loggedUser.EXTERNO,
          CLIENTEID: loggedUser.CLIENTEID,
          WD_EMAIL: result.value.WD_EMAIL,
          WD_WHATSAPP: result.value.WD_WHATSAPP,
          USUARIOID: loggedUser.USUARIOID
        };
        return fetchWithToken(`${API_URL}/usuarios/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
          .then(response => {
            if (!response.ok) {
              throw new Error("Error al actualizar las notificaciones");
            }
            return response.json();
          })
          .then(updatedUser => {
            Swal.fire('Éxito', 'Preferencias actualizadas', 'success');
            // Actualizamos el estado para reflejar los cambios
            setDataUsers(prev =>
              prev.map(u => u.USUARIOID === updatedUser.USUARIOID ? updatedUser : u)
            );
          })
          .catch(err => {
            console.error(err);
            Swal.fire('Error', 'No se pudo actualizar las notificaciones', 'error');
          });
      }
    });
  };


  // Definir estilos de fondo con gradient para las cards
  const transportBgStyle = {
    background: `linear-gradient(180deg, ${anomaliesTransporte.length > 0 ? '#dc3545' : '#28a745'}, ${openTransports.length > 0 ? '#dc3545' : '#28a745'})`
  };
  const analysisBgStyle = {
    background: `linear-gradient(180deg, ${anomaliesAnalisis.length > 0 ? '#dc3545' : '#28a745'}, ${openAnalyses.length > 0 ? '#dc3545' : '#28a745'})`
  };

  if (loading) {
    return (
      <div className="container text-center mt-5 p-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-2 mb-2 p-5 bg-light shadow text-center Dashboard border">
      <h1 className="mb-5 titulo-font">Bienvenido {loggedUserName}.</h1>

      {/* Dashboard: Si el usuario es cliente (rol 2) se muestran solo 2 cards, sino 3 */}
      {userRole === 2 ? (
        <div className="row mb-4" data-aos="flip-up">
          {/* Card: Transportes */}
          <div className="col-md-6">
            <div className="dashboard-card shadow p-3 mb-3 text-white rounded text-center"
              onClick={() => handleClickAnomalies('transportes')}
              style={{ cursor: 'pointer', ...transportBgStyle }}>
              <h2>{anomaliesTransporte.length}</h2>
              <p>Anomalias en Transportes</p>
              <hr style={{ margin: '10px 0', borderColor: 'white' }} />
              <h2>{openTransports.length}</h2>
              <p>Transportes Abiertos</p>
            </div>
          </div>
          {/* Card: Análisis */}
          <div className="col-md-6">
            <div className="dashboard-card shadow p-3 mb-3 text-white rounded text-center"
              onClick={() => handleClickAnomalies('analisis')}
              style={{ cursor: 'pointer', ...analysisBgStyle }}>
              <h2>{anomaliesAnalisis.length}</h2>
              <p>Anomalias en Análisis</p>
              <hr style={{ margin: '10px 0', borderColor: 'white' }} />
              <h2>{openAnalyses.length}</h2>
              <p>Análisis Abiertos</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="row mb-4" data-aos="flip-up">
          {/* Card 1: Clientes y Camioneros */}
          <div className="col-md-4">
            <div className="dashboard-card shadow p-3 mb-3 bg-info text-white rounded text-center">
              <h2>{totalClientes}</h2>
              <p>Clientes</p>
              <hr style={{ margin: '10px 0', borderColor: 'white' }} />
              <h2>{camionerosCount}</h2>
              <p>Camioneros</p>
            </div>
          </div>
          {/* Card 2: Transportes */}
          <div className="col-md-4">
            <div className="dashboard-card shadow p-3 mb-3 text-white rounded text-center"
              onClick={() => handleClickAnomalies('transportes')}
              style={{ cursor: 'pointer', ...transportBgStyle }}>
              <h2>{anomaliesTransporte.length}</h2>
              <p>Anomalias en Transportes</p>
              <hr style={{ margin: '10px 0', borderColor: 'white' }} />
              <h2>{openTransports.length}</h2>
              <p>Transportes Abiertos</p>
            </div>
          </div>
          {/* Card 3: Análisis */}
          <div className="col-md-4">
            <div className="dashboard-card shadow p-3 mb-3 text-white rounded text-center"
              onClick={() => handleClickAnomalies('analisis')}
              style={{ cursor: 'pointer', ...analysisBgStyle }}>
              <h2>{anomaliesAnalisis.length}</h2>
              <p>Anomalias en Análisis</p>
              <hr style={{ margin: '10px 0', borderColor: 'white' }} />
              <h2>{openAnalyses.length}</h2>
              <p>Análisis Abiertos</p>
            </div>
          </div>
        </div>
      )}

      {/* Botón de Notificaciones */}
      <div className="mt-4">
        <button className="btn btn-LL-I" onClick={handleNotificaciones}>
          Notificaciones
        </button>
      </div>
    </div>
  );
};

export default InicioScreen;
