import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/login.css';
import logo from '../media/Logo1.png';
import icono from '../media/Icono.png';

const API_URL = import.meta.env.VITE_API_URL;

export const LoginScreen = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [hasConnection, setHasConnection] = useState(true);
  const [showPassword, setShowPassword] = useState(false); // Nuevo estado para mostrar/ocultar la contraseña
  const navigate = useNavigate();

  // Verificar conexión con la API
  useEffect(() => {
    fetch(`${API_URL}/ping`)
      .then(res => res.json())
      .then(data => {
        if (
          (data.ping && data.ping === "pong") ||
          (data.detail && data.detail === "Error de prueba")
        ) {
          setHasConnection(true);
        } else {
          setHasConnection(false);
        }
      })
      .catch(err => {
        setHasConnection(false);
      });
  }, []);

  // Pre-cargar credenciales si están guardadas
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');
    if (storedUsername && storedPassword) {
      setUsername(storedUsername);
      setPassword(storedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const tokenResponse = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username,
          password,
          scope: '',
          client_id: 'string',
          client_secret: 'string',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Error de autenticación');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const usersResponse = await fetch(`${API_URL}/usuarios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!usersResponse.ok) {
        throw new Error('Error al obtener los usuarios');
      }

      const users = await usersResponse.json();
      const user = users.find((u) => u.EMAIL === username);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (user.ROLUSUARIO === 4) {
        Swal.fire({
          title: "Acceso Denegado",
          icon: "error",
          timer: 2000,
          showConfirmButton: false
        });
        return;
      }

      localStorage.setItem('token', accessToken);
      localStorage.setItem('userIDLogin', user.USUARIOID);
      localStorage.setItem('rol', user.ROLUSUARIO);
      if (user.ROLUSUARIO === 2) {
        localStorage.setItem('clienteId', user.CLIENTEID);
      }

      if (rememberMe) {
        localStorage.setItem('username', username);
        localStorage.setItem('password', password);
      } else {
        localStorage.removeItem('username');
        localStorage.removeItem('password');
      }

      setIsAuthenticated(true);
      navigate('/');
    } catch (error) {
      let errorMsg = 'Error de autenticación: Usuario o contraseña incorrectos';
      Swal.fire({
        title: errorMsg,
        icon: "error",
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Si no hay conexión, se muestra un mensaje
  if (!hasConnection) {
    return (
      <div className="container">
        <div className="row vh-md-100 d-flex align-items-center">
          <div className="col-md-6 text-center">
            <img
              src={icono}
              className="img-fluid"
              style={{ filter: 'grayscale(100%)' }}
              alt="Logo"
            />
          </div>
          <div className="col-md-6 text-center mb-5 mb-md-0">
            <h1>En este momento la aplicacion web no funciona.</h1>
            <h2>Comuniquese con un administrador.</h2>
            <h4 style={{ color: "#eaa416" }}>Gracias.</h4>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container d-flex justify-content-center align-items-center my-5 my-md-0">
      <div className="row justify-content-center w-100 my-5 my-md-0">
        <div className="col-12 col-md-6">
          <form onSubmit={handleLogin} className="login-form">
            <div className="d-flex justify-content-center align-items-center mb-4">
              <img src={logo} className="img-login" alt="" />
              <img src={icono} className="img-login" alt="" />
            </div>
            <div className="mb-3">
              <label htmlFor="username" className="login-label">Usuario</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="login-input form-control"
              />
            </div>
            <div className="mb-3 position-relative">
              <label htmlFor="password" className="login-label">Contraseña</label>
              <div className="d-flex">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input form-control"
                />
                  <i className={showPassword ? "fas fa-eye position-absolute color-eye-danger" : "fas fa-eye-slash position-absolute color-eye"} 
                  style={{ right:0, padding: '10px', cursor: 'pointer'}}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPassword(!showPassword);
                  }}></i>
              </div>

            </div>
            <div className="d-flex align-items-center mb-3">
              <label htmlFor="rememberMe" className="login-label flex-grow-1">
                Recordar usuario
              </label>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="login-input-checkbox"
              />
            </div>
            <button type="submit" className="btn btn-block btn-login w-100">
              <i className="fas fa-sign-in mr-2"></i>
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
