import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/login.css';
import logo from '../media/Logo1.png';
import icono from '../media/Icono.png';

// Usamos la variable de entorno de Vite
const API_URL = import.meta.env.VITE_API_URL;

export const LoginScreen = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Pre-cargar las credenciales del localStorage si están guardadas
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
      // Obtener el token de autenticación
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
          client_id: 'string', // Ajusta según corresponda
          client_secret: 'string',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Error de autenticación');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Obtener la lista de usuarios para verificar el rol y obtener el id
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

      // Buscar el usuario que coincide con el email ingresado
      const user = users.find((u) => u.EMAIL === username);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar el rol del usuario (por ejemplo, se niega acceso si ROLUSUARIO es 4)
      if (user.ROLUSUARIO === 4) {
        Swal.fire({
          title: "Acceso Denegado",
          icon: "error",
          timer: 2000,
          showConfirmButton: false
        });
        return;
      }

      // Guardar el token en localStorage
      localStorage.setItem('token', accessToken);
      // Guardar el id del usuario logueado en "userIDLogin"
      localStorage.setItem('userIDLogin', user.USUARIOID);
      //guardar el rol del usuario logueado en "userRolLogin"
      localStorage.setItem('rol', user.ROLUSUARIO);

      // Si se selecciona "Recordar usuario", guardar usuario y contraseña
      if (rememberMe) {
        localStorage.setItem('username', username);
        localStorage.setItem('password', password);
      } else {
        localStorage.removeItem('username');
        localStorage.removeItem('password');
      }

      // Autenticar al usuario y redirigir
      setIsAuthenticated(true);
      navigate('/');
    } catch (error) {
      Swal.fire({
        title: error.message,
        icon: "error",
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  return (
    <div>
      

      <form onSubmit={handleLogin} className="login-form">
      <div className='d-flex justify-content-center align-items-center'>
        <img src={logo} className="img-login" alt="" />
        <img src={icono} className="img-login" alt="" />
      </div>
        <div>
          <label htmlFor="username" className='login-label'>Usuario</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className='login-input'
          />
        </div>
        <div>
          <label htmlFor="password" className='login-label'>Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className='login-input'
          />
        </div>
        <div className='d-flex align-items-center mb-2'>
          <label htmlFor="rememberMe" className="login-label w-100">
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
        <button type="submit" className="btn btn-block btn-login">Iniciar sesión</button>
      </form>
    </div>
  );
};
