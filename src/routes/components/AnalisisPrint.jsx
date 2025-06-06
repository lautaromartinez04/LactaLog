import React, { useState, useEffect } from 'react';
import Logo from '../../media/Logo1.png';
import Icono from '../../media/Icono.png';
import '../../styles/AnalisisPrint.css';

// Usamos la variable de entorno de Vite
const API_URL = import.meta.env.VITE_API_URL;

const AnalisisPrint = ({ analisis, userName, clientName }) => {
  // Estado para el nombre del usuario que modificó (se obtiene vía fetch)
  const [modUserName, setModUserName] = useState('______________');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (analisis.USUARIOID_MODIFICACION && token) {
      fetch(`${API_URL}/usuarios/${analisis.USUARIOID_MODIFICACION}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.NOMBRE) {
            setModUserName(data.NOMBRE);
          } else {
            setModUserName('______________');
          }
        })
        .catch(err => {
          console.error("Error fetching mod user name:", err);
          setModUserName('______________');
        });
    }
  }, [analisis.USUARIOID_MODIFICACION]);

  // Estado para los datos del transporte (solo lectura)
  const [transporteData, setTransporteData] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (analisis.TRANSPORTEID && token) {
      fetch(`${API_URL}/transporte/${analisis.TRANSPORTEID}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          setTransporteData(data);
        })
        .catch(err => {
          console.error("Error fetching transporte data:", err);
          setTransporteData(null);
        });
    }
  }, [analisis.TRANSPORTEID]);

  // Formateo de fechas
  const fechaHoraAnalisis = analisis.FECHAHORAANALISIS
    ? new Date(analisis.FECHAHORAANALISIS).toLocaleString()
    : '______________';
  const fechaHoraModif = analisis.FECHAHORAMODIFICACION
    ? new Date(analisis.FECHAHORAMODIFICACION).toLocaleString()
    : '______________';

  // Campos centrales del análisis con rangos normales
  const centralFields = [
    { label: 'Porcentaje de Materia Grasa', value: analisis.MG_PORCENTUAL, normal: '3.3-4.0%', unit: '%' },
    { label: 'Gramos de Materia Grasa por litro', value: analisis.MG_KG, normal: '33-40 gr/l', unit: 'gr/l' },
    { label: 'Porcentaje de Proteína', value: analisis.PROT_PORCENTUAL, normal: '3.0-3.5%', unit: '%' },
    { label: 'Gramos de Proteína por litro', value: analisis.PROT_KG, normal: '30-35 gr/l', unit: 'gr/l' },
    { label: 'Porcentaje de Lactosa', value: analisis.LACT_PORCENTUAL, normal: '4.8-5.2%', unit: '%' },
    { label: 'Gramos de Lactosa por litro', value: analisis.LACT_KG, normal: '48-52 gr/l', unit: 'gr/l' },
    { label: 'Porcentaje de Sólidos No Grasos', value: analisis.SNG_PORCENTUAL, normal: '8.5-9.5%', unit: '%' },
    { label: 'Gramos de Sólidos No Grasos por litro', value: analisis.SNG_KG, normal: '85-95 gr/l', unit: 'gr/l' },
    { label: 'Porcentaje de Sólidos Totales', value: analisis.ST_PORCENTUAL, normal: '12-13%', unit: '%' },
    { label: 'Gramos de Sólidos Totales por litro', value: analisis.ST_KG, normal: '120-130 gr/l', unit: 'gr/l' },
    { label: 'UREA', value: analisis.UREA, normal: '10-16 mg/dL', unit: 'mg/dL' },
    // Nuevos campos:
    { label: 'unidades formadoras de colonias (UFC)', value: analisis.UFC, normal: '50000-250000 UFC/ml', unit: 'UFC/ml' },
    { label: 'Celulas somáticas', value: analisis.CS, normal: '200-400 celulas/ml', unit: 'celulas/ml' },
    { label: 'Agua', value: analisis.AGUA ? 'Sí' : 'No', normal: 'No', unit: '' },
    { label: 'Antibiótico', value: analisis.ANTIBIOTICO ? 'Sí' : 'No', normal: 'No', unit: '' },
  ];
  

  // Campos del transporte (mismo formato, sin rangos)
  const transporteFields = [];
  if (transporteData) {
    transporteFields.push({ label: 'Litros de Leche', value: transporteData.LITROS, unit: 'Litros' });
    transporteFields.push({ label: 'Temperatura', value: transporteData.TEMPERATURA, unit: '°C' });
    transporteFields.push({ label: 'Prueba de Alcohol', value: transporteData.PALCOHOL ? 'Positiva' : 'Negativa' });
    transporteFields.push({
      label: 'Fecha del Transporte',
      value: new Date(transporteData.FECHAHORAANALTRANSPORTE || transporteData.FECHAHORATRANSPORTE).toLocaleString()
    });
  }

  return (
    <div className="print-container">
      { /* Logos */}
      
      {/* Encabezado */}
      <div className="print-header">
      <div className="print-logos">
        <img className="print-logo" src={Logo} alt="" />
        <img className="print-icono" src={Icono} alt="" />
      </div>
        <h2 className="print-title">DETALLES DEL ANALISIS</h2>
        <div className="print-encabezado">
          <span>Camionero: <strong>{userName || '______________'}</strong></span>
          <span>Proveedor: <strong>{clientName || '______________'}</strong></span>
          <span>Fecha y Hora: <strong>{fechaHoraAnalisis}</strong></span>
        </div>
      </div>
      <hr className="separator" />

      {/* Sección de Transporte */}
      <div className="print-transport">
        <h3>Datos del Transporte</h3>
        <div className="transport-fields">
          {transporteFields.map((field, index) => (
            <div className="print-line-item transport-item" key={index}>
              <div className="line-main">
                <span className="print-label">{field.label}</span>
                <span className="print-dotted-line"></span>
                <span className="print-value">
                  {field.value !== null && field.value !== undefined ? field.value : '___'}
                  {field.unit && <span className="print-unit"> {field.unit}</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <hr className="separator" />
      
      {/* Campos centrales del análisis */}
      <div className="print-content">
        {centralFields.map((field, index) => (
          <React.Fragment key={index}>
            <div className="print-line-item">
              <div className="line-main">
                <span className="print-label">{field.label}</span>
                <span className="print-dotted-line"></span>
                <span className="print-value">
                  {field.value !== null && field.value !== undefined ? field.value : '___'}
                  {field.unit && <span className="print-unit"> {field.unit}</span>}
                </span>
              </div>
              <div className="normal-range">(Normal: {field.normal})</div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <hr className="separator" />
      
      {/* Sección de modificación */}
      <div className="print-modification">
        <div className="mod-row mod-row-top">
          <div className="mod-item">
            <span className="mod-label">Usuario Modificación:</span>
            <span className="mod-value">{modUserName}</span>
          </div>
          <div className="mod-item">
            <span className="mod-label">Versión:</span>
            <span className="mod-value">
              {analisis.VERSION !== null && analisis.VERSION !== undefined ? analisis.VERSION : '___'}
            </span>
          </div>
        </div>
        <div className="mod-row mod-row-bottom">
          <span className="mod-label">Fecha y Hora modificación:</span>
          <span className="mod-value">{fechaHoraModif}</span>
        </div>
      </div>
      
      {/* Pie de página: Firmas */}
      <div className="print-footer">
        <div className="firma-col">
          <p className='mb-5'>Firma</p>
          <p>_____________________</p>
        </div>
      </div>
      <div>
        <p className="text-center footer-print-text">© 2025 Powered by Don Emilio SRL DEV. Todos los derechos reservados. Documento Legítimo</p>
      </div>
    </div>
  );
};

export default AnalisisPrint;
