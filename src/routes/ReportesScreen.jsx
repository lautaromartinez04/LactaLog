import { height } from '@fortawesome/free-solid-svg-icons/fa0';
import React, { useState, useEffect } from 'react';
import { getToken, fetchWithToken, removeTokenOnUnload, removeTokenOnPage } from '../utils/auth';
import { use } from 'react';

export const ReportesScreen = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  useEffect(() => {
    removeTokenOnUnload();
    removeTokenOnPage();
  }, []);

  return (
    <div className="w-100" >
      {!iframeLoaded && (
        <div className="loading-container d-flex flex-column justify-content-center align-items-center h-100" style={{ padding: '20px', textAlign: 'center', height: "50vh"}}>
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden"></span>
          </div>
          <h1>Cargando Reporte</h1>
        </div>
      )}
      <iframe 
        title="Lactalog" 
        width="100%" 
        height="1700" 
        src="https://app.powerbi.com/view?r=eyJrIjoiZDRhOGFlNmMtZTkxYy00ZjY1LThhZDgtYjI1Nzk3MjhhMzg2IiwidCI6IjczYTljMDkyLWVkYzgtNGM1Ny04YjE0LTdiZGU4ODY0MDQ3NCJ9" 
        frameBorder="0" 
        allowFullScreen 
        onLoad={handleIframeLoad}
        style={{ display: iframeLoaded ? 'block' : 'none' }}
      ></iframe>
    </div>
  );
};
