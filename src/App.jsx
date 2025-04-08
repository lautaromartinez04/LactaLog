import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NavBar } from './routes/components/NavBar';
import { Footer } from './routes/components/Footer';
import { LoginScreen } from './routes/LoginScreen';
import { InicioScreen } from './routes/InicioScreen';
import { UsuariosScreen } from './routes/UsuariosScreen';
import { AnalisisScreen } from './routes/AnalisisScreen';
import { TransporteScreen } from './routes/TransporteScreen';
import { ClientesScreen } from './routes/ClientesScreen';
import { ReportesScreen } from './routes/ReportesScreen';

export const App = () => {
  // Estado para saber si el usuario está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Comprobar si hay un token en localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    // Eliminar el token de localStorage y actualizar el estado
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <>
      <div className="App">
        <NavBar handleLogout={handleLogout} isAuthenticated={isAuthenticated} />
        <div style={{ minHeight: '63.9vh'}} >
          <Routes>
            <Route path="/" element={isAuthenticated ? <InicioScreen /> : <Navigate to="/login" />} />
            <Route path="/Inicio" element={isAuthenticated ? <InicioScreen /> : <Navigate to="/login" />} />
            <Route path="/Usuarios" element={isAuthenticated ? <UsuariosScreen /> : <Navigate to="/login" />} />
            <Route path="/Analisis" element={isAuthenticated ? <AnalisisScreen /> : <Navigate to="/login" />} />
            <Route path="/Transporte" element={isAuthenticated ? <TransporteScreen /> : <Navigate to="/login" />} />
            <Route path="/Proveedores" element={isAuthenticated ? <ClientesScreen /> : <Navigate to="/login" />} />
            <Route path='/Reportes' element={isAuthenticated ? <ReportesScreen /> : <Navigate to="/Login" />} />
            <Route
              path="/login"
              element={!isAuthenticated ? <LoginScreen setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />}
            />
            <Route path="/*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <Footer />
      </div>

    </>
  );
};
