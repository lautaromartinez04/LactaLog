import React, { useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../../styles/navBar.css';
import logo from '../../media/Logo.png';
import icono from '../../media/Icono.png';

export const NavBar = ({ isAuthenticated, handleLogout }) => {
  const navigate = useNavigate();
  const userRole = Number(localStorage.getItem('rol'));

  // Función para cerrar el navbar en dispositivos móviles
  const closeNavbar = () => {
    const navCollapse = document.getElementById("navbarNav");
    if (navCollapse) {
      // Usamos el API de Bootstrap para ocultar el collapse con animación
      const bsCollapse = new window.bootstrap.Collapse(navCollapse, { toggle: false });
      bsCollapse.hide();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            navigate('/');
            break;
          case '2':
            e.preventDefault();
            navigate('/Analisis');
            break;
          case '3':
            e.preventDefault();
            navigate('/Transporte');
            break;
          case '4':
            e.preventDefault();
            navigate('/Reportes');
            break;
          case '5':
            e.preventDefault();
            navigate('/Usuarios');
            break;
          case '6':
            e.preventDefault();
            navigate('/Clientes');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img className="logo-Nav-Bar img-fluid" src={logo} alt="Logo" />
          <img className="logo-Nav-Bar img-fluid" src={icono} alt="Icono" />
        </Link>
        {isAuthenticated ? (
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        ) : null}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ml-auto">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <NavLink to="/" onClick={closeNavbar} className="nav-link">Inicio</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/Analisis" onClick={closeNavbar} className="nav-link">Analisis</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/Transporte" onClick={closeNavbar} className="nav-link">Transporte</NavLink>
                </li>
                {/* La opción "Reportes" se oculta en dispositivos móviles */}
                <li className="nav-item d-none d-md-block">
                  <NavLink to="/Reportes" onClick={closeNavbar} className="nav-link">Reportes</NavLink>
                </li>
                {userRole !== 2 && (
                  <>
                    <li className="nav-item">
                      <NavLink to="/Usuarios" onClick={closeNavbar} className="nav-link">Usuarios</NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink to="/Clientes" onClick={closeNavbar} className="nav-link">Clientes</NavLink>
                    </li>
                  </>
                )}
                <li className="nav-item">
                  <button
                    className="nav-link1 btn-outline-danger btn btn-sm btn-block text-white font-weight-bold btn-link"
                    onClick={() => { handleLogout(); closeNavbar(); }}
                  >
                    Cerrar sesión
                  </button>
                </li>
              </>
            ) : null}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
