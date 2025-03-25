// src/utils/auth.js

const API_URL = import.meta.env.VITE_API_URL;

// Obtiene el token; si no existe, redirige al login.
export const getToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    throw new Error("Token no encontrado, redirigiendo a login.");
  }
  return token;
};

// Renueva el token utilizando las credenciales almacenadas.
export const renewToken = async () => {
  const user = localStorage.getItem('username');
  const password = localStorage.getItem('password');
  try {
    const response = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password })
    });
    const result = await response.json();
    if (response.ok && result.token) {
      localStorage.setItem('token', result.token);
      return result.token;
    } else {
      throw new Error('No se pudo renovar el token');
    }
  } catch (err) {
    console.error('Error al renovar el token:', err);
    window.location.href = '/login';
    throw err;
  }
};

// Realiza un fetch usando el token, renovándolo si es necesario.
export const fetchWithToken = async (url, options = {}) => {
  let token = getToken();
  
  // Si el método es DELETE, no incluimos 'Content-Type'
  if (options.method && options.method.toUpperCase() === 'DELETE') {
    options.headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };
  } else {
    options.headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  let response = await fetch(url, options);
  if (response.status === 401) {
    token = await renewToken();
    options.headers['Authorization'] = `Bearer ${token}`;
    response = await fetch(url, options);
  }
  return response;
};


// Remueve el token al salir o recargar la página.
export const removeTokenOnUnload = () => {
  window.addEventListener('beforeunload', () => {
    localStorage.removeItem('token');
  });
};

export const removeTokenOnPage = () => {
  window.addEventListener('pagehide', () => {
    localStorage.removeItem('token');
  });
};
