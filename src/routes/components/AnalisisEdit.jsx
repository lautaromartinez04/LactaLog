import React, { useState, useEffect } from 'react';
import AnalisisPrint from './AnalisisPrint'; // Ajusta la ruta según tu estructura
import Swal from 'sweetalert2';
import '../../styles/AnalisisEdit.css'; // Aquí estarán las clases .no-print y .only-print

const API_URL = import.meta.env.VITE_API_URL;

export const AnalisisEdit = ({
  analisis,
  onSave,
  updateAnalisis,
  refreshAnalisisList,
  onCancel,
  userName,
  clientName
}) => {
  // Estado local para el análisis actual que se mostrará
  const [currentAnalisis, setCurrentAnalisis] = useState(analisis);
  // Modo edición local: false = vista de detalles, true = formulario de edición
  const [isEditing, setIsEditing] = useState(false);

  // Cuando la prop analisis cambie, actualizamos el estado local
  useEffect(() => {
    setCurrentAnalisis(analisis);
  }, [analisis]);

  // Nuevo useEffect: al montar el componente se vuelve a hacer fetch del análisis
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (analisis.ANALISISID && token) {
      fetch(`${API_URL}/analisis/${analisis.ANALISISID}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          setCurrentAnalisis(data);
        })
        .catch(err => console.error("Error fetching análisis:", err));
    }
  }, [analisis.ANALISISID]);

  // Estado para los campos editables del análisis
  const [formData, setFormData] = useState({
    MG_PORCENTUAL: currentAnalisis.MG_PORCENTUAL,
    MG_KG: currentAnalisis.MG_KG,
    PROT_PORCENTUAL: currentAnalisis.PROT_PORCENTUAL,
    PROT_KG: currentAnalisis.PROT_KG,
    LACT_PORCENTUAL: currentAnalisis.LACT_PORCENTUAL,
    LACT_KG: currentAnalisis.LACT_KG,
    SNG_PORCENTUAL: currentAnalisis.SNG_PORCENTUAL,
    SNG_KG: currentAnalisis.SNG_KG,
    ST_PORCENTUAL: currentAnalisis.ST_PORCENTUAL,
    ST_KG: currentAnalisis.ST_KG,
    UREA: currentAnalisis.UREA,
    UFC: currentAnalisis.UFC,
    CS: currentAnalisis.CS,
    AGUA: currentAnalisis.AGUA,
    ANTIBIOTICO: currentAnalisis.ANTIBIOTICO
  });

  // Actualiza formData cuando currentAnalisis cambia
  useEffect(() => {
    setFormData({
      MG_PORCENTUAL: currentAnalisis.MG_PORCENTUAL,
      MG_KG: currentAnalisis.MG_KG,
      PROT_PORCENTUAL: currentAnalisis.PROT_PORCENTUAL,
      PROT_KG: currentAnalisis.PROT_KG,
      LACT_PORCENTUAL: currentAnalisis.LACT_PORCENTUAL,
      LACT_KG: currentAnalisis.LACT_KG,
      SNG_PORCENTUAL: currentAnalisis.SNG_PORCENTUAL,
      SNG_KG: currentAnalisis.SNG_KG,
      ST_PORCENTUAL: currentAnalisis.ST_PORCENTUAL,
      ST_KG: currentAnalisis.ST_KG,
      UREA: currentAnalisis.UREA,
      UFC: currentAnalisis.UFC,
      CS: currentAnalisis.CS,
      AGUA: currentAnalisis.AGUA,
      ANTIBIOTICO: currentAnalisis.ANTIBIOTICO
    });
  }, [currentAnalisis]);

  // Estado para el nombre del usuario de modificación
  const [modUserName, setModUserName] = useState('______________');
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (currentAnalisis.USUARIOID_MODIFICACION && token) {
      fetch(`${API_URL}/usuarios/${currentAnalisis.USUARIOID_MODIFICACION}`, {
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
  }, [currentAnalisis.USUARIOID_MODIFICACION]);

  // Estado para los datos del transporte (solo lectura)
  const [transporteData, setTransporteData] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (currentAnalisis.TRANSPORTEID && token) {
      fetch(`${API_URL}/transporte/${currentAnalisis.TRANSPORTEID}`, {
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
  }, [currentAnalisis.TRANSPORTEID]);

  useEffect(() => {
    if (transporteData) {
      const litros = Number(transporteData.LITROS) || 0;
      setFormData(prev => ({
        ...prev,
        MG_KG: (litros * prev.MG_PORCENTUAL) / 100,
        PROT_KG: (litros * prev.PROT_PORCENTUAL) / 100,
        LACT_KG: (litros * prev.LACT_PORCENTUAL) / 100,
        SNG_KG: (litros * prev.SNG_PORCENTUAL) / 100,
        ST_KG: (litros * prev.ST_PORCENTUAL) / 100,
      }));
    }
  }, [transporteData]);

  // Maneja los cambios de los inputs
  const handleChange = (e) => {
    const { name, value: rawValue } = e.target;

    // ↳ 1.1) Limitar la parte decimal a 0–2 dígitos
    const regex = /^(\d*)([.,]\d{0,2})?/;
    const match = rawValue.match(regex);
    const raw = match ? match[0] : '';

    // ↳ 1.2) Normalizar coma → punto y parsear
    const normalized = raw.replace(',', '.');
    const num = parseFloat(normalized) || 0;

    // ↳ 1.3) Preparo el update: siempre actualizo el campo crudo
    const update = { [name]: raw };

    // ↳ 1.4) Si cambiaron los %… recalculo y **redondeo a 2 decimales** el KG
    if (name.endsWith('_PORCENTUAL') && transporteData) {
      const litros = Number(transporteData.LITROS) || 0;
      const base = name.split('_')[0]; // "MG", "PROT", …
      const kilosRaw = (litros * num) / 100;
      update[`${base}_KG`] = parseFloat(kilosRaw.toFixed(2));
    }

    setFormData(prev => ({ ...prev, ...update }));
  };

  // Al enviar el formulario se guarda la edición y se vuelve a la vista de detalles
  // 2) Y en handleSubmit, parsea y redondea también a 2 decimales antes de enviar:
  const handleSubmit = (e) => {
    e.preventDefault();

    const parseAndRound = (field) => {
      // convierto a string, normalizo coma → punto, parseo y fijo 2 decimales
      const str = String(formData[field]).replace(',', '.');
      const n = parseFloat(str) || 0;
      return parseFloat(n.toFixed(2));
    };

    const payload = {
      MG_PORCENTUAL: parseAndRound('MG_PORCENTUAL'),
      MG_KG: parseAndRound('MG_KG'),
      PROT_PORCENTUAL: parseAndRound('PROT_PORCENTUAL'),
      PROT_KG: parseAndRound('PROT_KG'),
      LACT_PORCENTUAL: parseAndRound('LACT_PORCENTUAL'),
      LACT_KG: parseAndRound('LACT_KG'),
      SNG_PORCENTUAL: parseAndRound('SNG_PORCENTUAL'),
      SNG_KG: parseAndRound('SNG_KG'),
      ST_PORCENTUAL: parseAndRound('ST_PORCENTUAL'),
      ST_KG: parseAndRound('ST_KG'),
      UREA: parseAndRound('UREA'),
      UFC: parseAndRound('UFC'),
      CS: parseAndRound('CS'),
      AGUA: formData.AGUA,
      ANTIBIOTICO: formData.ANTIBIOTICO,
      VERSION: currentAnalisis.VERSION + 1
    };

    onSave(currentAnalisis.ANALISISID, payload);
    setCurrentAnalisis(prev => ({ ...prev, ...payload }));
    setIsEditing(false);
  };


  // Acción para imprimir
  const handlePrint = () => {
    window.print();
  };

  // Campos para la vista de detalles
  const fields = [
    { label: 'Porcentaje de Materia Grasa', value: currentAnalisis.MG_PORCENTUAL, unit: '%' },
    { label: 'Gramos de Materia Grasa por litro', value: currentAnalisis.MG_KG, unit: 'g/L' },
    { label: 'Porcentaje de Proteína', value: currentAnalisis.PROT_PORCENTUAL, unit: '%' },
    { label: 'Gramos de Proteína por litro', value: currentAnalisis.PROT_KG, unit: 'g/L' },
    { label: 'Porcentaje de Lactosa', value: currentAnalisis.LACT_PORCENTUAL, unit: '%' },
    { label: 'Gramos de Lactosa por litro', value: currentAnalisis.LACT_KG, unit: 'g/L' },
    { label: 'Porcentaje de Sólidos No Grasos', value: currentAnalisis.SNG_PORCENTUAL, unit: '%' },
    { label: 'Gramos de Sólidos No Grasos por litro', value: currentAnalisis.SNG_KG, unit: 'g/L' },
    { label: 'Porcentaje de Sólidos Totales', value: currentAnalisis.ST_PORCENTUAL, unit: '%' },
    { label: 'Gramos de Sólidos Totales por litro', value: currentAnalisis.ST_KG, unit: 'g/L' },
    { label: 'UREA', value: currentAnalisis.UREA, unit: 'mg/L' },
    { label: 'Unidades formadoras de col (UFC)', value: currentAnalisis.UFC, unit: 'UFC/L' },
    { label: 'Celulas Somáticas', value: currentAnalisis.CS, unit: 'CS/L' },
    { label: 'Agua', value: currentAnalisis.AGUA, unit: '' },
    { label: 'Antibiotico', value: currentAnalisis.ANTIBIOTICO, unit: '' }
  ];

  // Función para agrupar en filas de 3 columnas
  const chunkArray = (array, size) => {
    let result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const fieldRows = chunkArray(fields, 3);

  const userRole = Number(localStorage.getItem('rol'));
  const isManager = userRole === 1;

  // Función para cerrar el análisis y actualizar el estado local
  const handleCloseAnalisis = () => {
    Swal.fire({
      title: 'Una vez cerrado el análisis no podrá volver a editarlo',
      icon: 'warning',
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      }
    }).then((firstResult) => {
      if (firstResult.isConfirmed) {
        Swal.fire({
          title: '¿Está seguro?',
          text: '¿Está seguro que quiere cerrar el análisis?',
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
              const response = await fetch(`${API_URL}/analisis/${currentAnalisis.ANALISISID}/cerrar`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              if (!response.ok) {
                throw new Error("Error al cerrar el análisis");
              }
              // Obtener el análisis actualizado
              const resUpdated = await fetch(`${API_URL}/analisis/${currentAnalisis.ANALISISID}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (!resUpdated.ok) {
                throw new Error("Error al obtener análisis actualizado");
              }
              const updatedAnalysis = await resUpdated.json();
              // Actualizamos tanto el estado local como el del padre
              setCurrentAnalisis(updatedAnalysis);
              updateAnalisis(updatedAnalysis);
              Swal.fire({
                title: 'Análisis cerrado correctamente',
                icon: 'success',
                showConfirmButton: false,
                timer: 1500
              });
            } catch (error) {
              console.error(error);
              Swal.fire({
                title: 'Error al cerrar el análisis',
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

  // Función para reabrir el análisis y actualizar el estado local
  const handleReopenAnalisis = () => {
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea reabrir el análisis?',
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
          const response = await fetch(`${API_URL}/analisis/${currentAnalisis.ANALISISID}/reabrir`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            throw new Error("Error al reabrir el análisis");
          }
          const resUpdated = await fetch(`${API_URL}/analisis/${currentAnalisis.ANALISISID}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!resUpdated.ok) {
            throw new Error("Error al obtener análisis actualizado");
          }
          const updatedAnalysis = await resUpdated.json();
          setCurrentAnalisis(updatedAnalysis);
          updateAnalisis(updatedAnalysis);
          Swal.fire({
            icon: 'success',
            title: 'Análisis reabierto correctamente',
            showConfirmButton: false,
            timer: 1500
          });
        } catch (error) {
          console.error(error);
          Swal.fire({
            icon: 'error',
            title: 'Error al reabrir el análisis',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    });
  };

  // Reglas de validación para resaltar inputs fuera de rango
  const validationRules = {
    MG_PORCENTUAL: { min: 3.3, max: 5.5, unit: '%' },
    //MG_KG: { min: 33, max: 40, unit: 'grs' },
    PROT_PORCENTUAL: { min: 3.3, max: 3.5, unit: '%' },
    //PROT_KG: { min: 33, max: 35, unit: 'grs' },
    LACT_PORCENTUAL: { min: 4.8, max: 5.2, unit: '%' },
    //LACT_KG: { min: 48, max: 52, unit: 'grs' },
    SNG_PORCENTUAL: { min: 8.6, max: 9.5, unit: '%' },
    //SNG_KG: { min: 86, max: 95, unit: 'grs' },
    ST_PORCENTUAL: { min: 11.9, max: 13.5, unit: '%' },
    //ST_KG: { min: 119, max: 135, unit: 'grs' },
    UREA: { min: 10, max: 16, unit: 'mg/L' },
    UFC: { min: 50000, max: 250000, unit: 'mg/L' },
    CS: { min: 200, max: 400, unit: 'mg/L' },
  };

  const getInputClass = (fieldName) => {
    if (validationRules[fieldName]) {
      const value = Number(formData[fieldName]);
      if (isNaN(value)) return '';
      const { min, max } = validationRules[fieldName];
      return (value < min || value > max) ? 'input-error' : 'input-valid';
    }
    return '';
  };

  const getReferenceText = (fieldName) => {
    if (validationRules[fieldName]) {
      const { min, max, unit } = validationRules[fieldName];
      return `Valores de referencia entre ${min}${unit} y ${max}${unit}`;
    }
    return '';
  };

  return (
    <div className='mb-5'>
      {/* Vista de detalles (NO se imprime) */}
      {!isEditing && (
        <div className="no-print container mt-5 mb-5">
          {/* Botón "Volver" posicionado en la parte superior izquierda */}
          <div className="row">
            <div className="d-flex flex-column flex-lg-row justify-content-center justify-content-lg-between align-items-center w-100">
              <h2 className="mt-3 mb-0">Detalles del Análisis</h2>
              <button className="btn btn-LL-I d-flex align-items-center mt-3 mt-lg-0" onClick={onCancel}>
                <i className="fas fa-arrow-left mr-2"></i> Volver
              </button>
            </div>
          </div>

          <div className="container mt-5">
            <div className="row">
              <div className="col-12 col-md-4">
                <p><strong>Camionero:</strong> {userName}</p>
              </div>
              <div className="col-12 col-md-4">
                <p><strong>Cliente:</strong> {clientName}</p>
              </div>
              <div className="col-12 col-md-4">
                <p>
                  <strong>Fecha y Hora del Análisis:</strong>{' '}
                  {new Date(currentAnalisis.FECHAHORAANALISIS).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <hr />
          <div className="container">
            <h4>Datos del Transporte</h4>
            {transporteData ? (
              <>
                <div className="row mt-4">
                  <div className="col-12 col-md-6">
                    <p>
                      <strong>Litros de Leche: </strong>
                      <span className="dotted-line"></span>
                      {transporteData.LITROS}
                      <span> Litros</span>
                    </p>
                  </div>
                  <div className="col-12 col-md-6">
                    <p>
                      <strong>Temperatura: </strong>
                      <span className="dotted-line"></span>
                      {transporteData.TEMPERATURA}
                      <span> °C</span>
                    </p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12 col-md-6">
                    <p>
                      <strong>Prueba de Alcohol: </strong>
                      <span className="dotted-line"></span>
                      {transporteData.PALCOHOL ? 'Positiva' : 'Negativa'}
                    </p>
                  </div>
                  <div className="col-12 col-md-6">
                    <p>
                      <strong>Fecha del Transporte: </strong>
                      <span className="dotted-line"></span>
                      {new Date(
                        transporteData.FECHAHORAANALTRANSPORTE || transporteData.FECHAHORATRANSPORTE
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p>Cargando datos del transporte...</p>
            )}
          </div>
          <hr />
          <div className="container">
            {fieldRows.map((row, rowIndex) => (
              <div className="row" key={rowIndex}>
                {row.map((field, colIndex) => (
                  <div className="col-12 col-md-4" key={colIndex}>
                    <p>
                      <strong>{field.label}: </strong>
                      <span className="dotted-line"></span>
                      {(field.label.toLowerCase() === 'agua' || field.label.toLowerCase() === 'antibiotico')
                        ? (field.value ? 'Sí' : 'No')
                        : field.value
                      }
                      {field.unit && <span className="unit"> {field.unit}</span>}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <hr />
          <div className="container">
            <div className="row">
              <div className="col-12 col-md-6">
                <p><strong>Usuario Modificación: </strong> {modUserName}</p>
              </div>
              <div className="col-12 col-md-6">
                <p><strong>Versión:</strong> {currentAnalisis.VERSION}</p>
              </div>
            </div>
            <div className="row">
              <div className="col-12">
                <p>
                  <strong>Fecha y Hora modificación:</strong>{' '}
                  {new Date(currentAnalisis.FECHAHORAMODIFICACION).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          {/* Grupo de botones inferior (sin el botón "Volver") */}
          <div className="d-flex flex-column flex-md-row justify-content-between w-100 mt-4">
            <button className="btn btn-outline-secondary mb-2 mb-md-0" onClick={handlePrint}>
              <i className="fas fa-print"></i> Imprimir
            </button>
            {userRole !== 2 && (
              <>
                <button
                  className={`btn btn-outline-info mb-2 mb-md-0 ${currentAnalisis.CERRADO ? 'disabled' : ''}`}
                  onClick={() => {
                    if (currentAnalisis.CERRADO) {
                      Swal.fire({
                        icon: 'warning',
                        title: 'Acción no permitida',
                        text: 'Debe reabrir el análisis para poder editarlo, comuníquese con un administrador.',
                        confirmButtonText: 'Aceptar',
                        customClass: {
                          confirmButton: 'btn btn-guardar'
                        }
                      });
                    } else {
                      setIsEditing(true);
                    }
                  }}
                >
                  <i className="fas fa-edit"></i> Editar
                </button>
                {currentAnalisis.CERRADO ? (
                  isManager ? (
                    <button
                      className="btn btn-outline-success mb-2 mb-md-0"
                      onClick={handleReopenAnalisis}
                      title="Reabrir Análisis"
                    >
                      <i className="fas fa-lock-open"></i> Reabrir Análisis
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-success disabled mb-2 mb-md-0"
                      title="Solicite a un administrador para reabrir el análisis"
                      onClick={() => {
                        if (currentAnalisis.CERRADO) {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Acción no permitida',
                            text: 'Comuníquese con un administrador para reabrir el análisis.',
                            confirmButtonText: 'Aceptar',
                            customClass: {
                              confirmButton: 'btn btn-guardar'
                            }
                          });
                        } else {
                          setIsEditing(true);
                        }
                      }}
                    >
                      <i className="fas fa-lock-open"></i> Reabrir Análisis
                    </button>
                  )
                ) : (
                  <button
                    className="btn btn-outline-danger mb-2 mb-md-0"
                    onClick={handleCloseAnalisis}
                    title="Cerrar Análisis"
                  >
                    <i className="fas fa-lock"></i> Cerrar Análisis
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Vista de edición: formulario para editar; al guardar o cancelar se regresa a la vista de detalles */}
      {isEditing && (
        <div className="no-print container mt-5">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-12 col-md-4 form-group">
                <label>Porcentaje de Materia Grasa (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('MG_PORCENTUAL')}`}
                  name="MG_PORCENTUAL"
                  value={formData.MG_PORCENTUAL}
                  onChange={handleChange}
                />
                <small className="reference-text">{getReferenceText('MG_PORCENTUAL')}</small>
              </div>
              <div className="col-12 col-md-4 form-group">
                <label>Gramos de Materia Grasa por litro (g/L)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('MG_KG')}`}
                  name="MG_KG"
                  value={formData.MG_KG}
                  readOnly
                />
                <small className="reference-text">{getReferenceText('MG_KG')}</small>
              </div>
              <div className="col-12 col-md-4 form-group">
                <label>Porcentaje de Proteína (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('PROT_PORCENTUAL')}`}
                  name="PROT_PORCENTUAL"
                  value={formData.PROT_PORCENTUAL}
                  onChange={handleChange}
                />
                <small className="reference-text">{getReferenceText('PROT_PORCENTUAL')}</small>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-md-4 form-group">
                <label>Gramos de Proteína por litro (g/L)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('PROT_KG')}`}
                  name="PROT_KG"
                  value={formData.PROT_KG}
                  readOnly
                />
                <small className="reference-text">{getReferenceText('PROT_KG')}</small>
              </div>
              <div className="col-12 col-md-4 form-group">
                <label>Porcentaje de Lactosa (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('LACT_PORCENTUAL')}`}
                  name="LACT_PORCENTUAL"
                  value={formData.LACT_PORCENTUAL}
                  onChange={handleChange}
                />
                <small className="reference-text">{getReferenceText('LACT_PORCENTUAL')}</small>
              </div>
              <div className="col-12 col-md-4 form-group">
                <label>Gramos de Lactosa por litro (g/L)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('LACT_KG')}`}
                  name="LACT_KG"
                  value={formData.LACT_KG}
                  readOnly
                />
                <small className="reference-text">{getReferenceText('LACT_KG')}</small>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-md-4 form-group">
                <label>Porcentaje de Sólidos No Grasos (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('SNG_PORCENTUAL')}`}
                  name="SNG_PORCENTUAL"
                  value={formData.SNG_PORCENTUAL}
                  onChange={handleChange}
                />
                <small className="reference-text">{getReferenceText('SNG_PORCENTUAL')}</small>
              </div>
              <div className="col-12 col-md-4 form-group">
                <label>Gramos de Sólidos No Grasos por litro (g/L)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('SNG_KG')}`}
                  name="SNG_KG"
                  value={formData.SNG_KG}
                  readOnly
                />
                <small className="reference-text">{getReferenceText('SNG_KG')}</small>
              </div>
              <div className="col-12 col-md-4 form-group">
                <label>Porcentaje de Sólidos Totales (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('ST_PORCENTUAL')}`}
                  name="ST_PORCENTUAL"
                  value={formData.ST_PORCENTUAL}
                  onChange={handleChange}
                />
                <small className="reference-text">{getReferenceText('ST_PORCENTUAL')}</small>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-md-4 form-group">
                <label>Gramos de Sólidos Totales por litro (g/L)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('ST_KG')}`}
                  name="ST_KG"
                  value={formData.ST_KG}
                  readOnly
                />
                <small className="reference-text">{getReferenceText('ST_KG')}</small>
              </div>
              <div className="col-12 col-md-4 form-group">
                <label>UREA (mg/L)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('UREA')}`}
                  name="UREA"
                  value={formData.UREA}
                  onChange={handleChange}
                />
                <small className="reference-text">{getReferenceText('UREA')}</small>
              </div>
              <div className="col-12 col-md-4 form-group">
                <label>Unidades Formadoras de Colonias (UFC)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('UFC')}`}
                  name="UFC"
                  value={formData.UFC}
                  onChange={handleChange}
                />
                <small className="reference-text">{getReferenceText('UFC')}</small>
              </div>
              <div className="col-12 col-md-4 form-group">
                <label>Celulas Somáticas</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-control ${getInputClass('CS')}`}
                  name="CS"
                  value={formData.CS}
                  onChange={handleChange}
                />
                <small className="reference-text">{getReferenceText('CS')}</small>
              </div>
              <div className="col-12 col-md-4 form-group d-flex align-items-center justify-content-center">
                <label className='mb-1'>Agua</label>
                <label className="notif-switch ml-2">
                  <input
                    type="checkbox"
                    name="AGUA"
                    checked={formData.AGUA}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, AGUA: e.target.checked }))
                    }
                  />
                  <span className="notif-slider"></span>
                </label>
              </div>
              <div className="col-12 col-md-4 form-group d-flex align-items-center justify-content-center">
                <label className='mb-1'>Antibiótico</label>
                <label className="notif-switch ml-2">
                  <input
                    type="checkbox"
                    name="ANTIBIOTICO"
                    checked={formData.ANTIBIOTICO}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, ANTIBIOTICO: e.target.checked }))
                    }
                  />
                  <span className="notif-slider"></span>
                </label>
              </div>
            </div>
            <div className="mt-3 d-flex flex-column flex-md-row justify-content-between">
              <button type="submit" className="btn btn-outline-primary mb-2 mb-md-0">
                <i className="fas fa-save mr-2"></i>Guardar
              </button>
              <button
                type="button"
                className="btn btn-outline-danger mb-2 mb-md-0"
                onClick={() => setIsEditing(false)}
              >
                <i className="fas fa-arrow-left mr-2"></i>Cancelar Edición
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vista de impresión (visible solo al imprimir) */}
      <div className="only-print">
        <AnalisisPrint
          analisis={currentAnalisis}
          userName={userName}
          clientName={clientName}
        />
      </div>
    </div>
  );
};

export default AnalisisEdit;
