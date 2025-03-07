import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import "../styles/usuarios.css";
import { getToken, fetchWithToken, removeTokenOnUnload } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL;

export const UsuariosScreen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Si no hay token, getToken redirige al login.
    const token = getToken();

    const fetchData = async () => {
      try {
        const response = await fetchWithToken(`${API_URL}/usuarios/`, {
          method: 'GET'
        });
        if (!response.ok) {
          throw new Error('Error al obtener los datos');
        }
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    removeTokenOnUnload();
  }, []);

  if (loading) {
    return (
      <div className="container text-center mt-5 p-5 w-100 d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container text-center mt-5 p-5 bg-light rounded shadow'>
        <p>Error al cargar los datos: {error}</p>
      </div>
    );
  }

  // Filtrar únicamente usuarios con ROLUSUARIO 3 o 4 y aplicar el término de búsqueda
  const filteredData = data.filter(user =>
    (user.ROLUSUARIO === 3 || user.ROLUSUARIO === 4) &&
    (
      user.NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.EMAIL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.TELEFONO.includes(searchTerm)
    )
  );

  const handleNewUser = async (NOMBRE, EMAIL, TELEFONO, HSPASS, ROLUSUARIO, EXTERNO, CLIENTEID, USUARIOID) => {
    const newUser = {
      NOMBRE,
      EMAIL,
      TELEFONO,
      ROLUSUARIO,
      HSPASS,
      EXTERNO,
      CLIENTEID,
      USUARIOID
    };

    try {
      const response = await fetchWithToken(`${API_URL}/usuarios`, {
        method: "POST",
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const createdUser = await response.json();
        setData(prevData => [...prevData, createdUser]);
        Swal.fire("Éxito", "Usuario agregado correctamente", "success");
      } else {
        throw new Error("Error al agregar el usuario");
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire("Error", "No se pudo agregar el usuario", "error");
    }
  };

  const handleAddUserButtonClick = () => {
    Swal.fire({
      title: "Nuevo usuario",
      html: `
        <input type="text" id="NOMBRE" class="swal2-input" placeholder="Nombre">
        <input type="email" id="EMAIL" class="swal2-input" placeholder="Correo">
        <input type="text" id="TELEFONO" class="swal2-input" placeholder="Teléfono">
        <input type="password" id="HSPASS" class="swal2-input" placeholder="Contraseña">
      `,
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const NOMBRE = Swal.getPopup().querySelector("#NOMBRE").value;
        const EMAIL = Swal.getPopup().querySelector("#EMAIL").value;
        const TELEFONO = Swal.getPopup().querySelector("#TELEFONO").value;
        const HSPASS = Swal.getPopup().querySelector("#HSPASS").value;
        // Se asigna por defecto rol 3 para nuevos usuarios.
        const ROLUSUARIO = 4;
        const CLIENTEID = 0;
        const USUARIOID = 0;
        const EXTERNO = true;

        if (!NOMBRE || !EMAIL || !TELEFONO) {
          Swal.showValidationMessage("Todos los campos son obligatorios");
          return false;
        }

        handleNewUser(NOMBRE, EMAIL, TELEFONO, HSPASS, ROLUSUARIO, EXTERNO, CLIENTEID, USUARIOID);
      }
    });
  };

  const handleDeleteUser = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
  
      if (result.isConfirmed) {
        // Llamamos a fetchWithToken, pero forzamos los headers sin Content-Type
        const response = await fetchWithToken(`${API_URL}/usuarios/${id}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json'
            // No incluimos 'Content-Type'
          }
        });
  
        console.log("Response status:", response.status);
  
        if (response.ok) {
          setData(prevData => prevData.filter(user => user.USUARIOID !== id));
          Swal.fire('Eliminado!', 'El usuario ha sido eliminado.', 'success');
        } else {
          throw new Error('Error al eliminar el usuario');
        }
      }
    } catch (err) {
      console.error('Error al eliminar el usuario:', err);
      Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
    }
  };
  
  

  const handleEditUser = (user) => {
    Swal.fire({
      title: "Editar usuario",
      html: `
        <input type="text" id="NOMBRE" class="swal2-input" placeholder="Nombre" value="${user.NOMBRE}">
        <input type="email" id="EMAIL" class="swal2-input" placeholder="Correo" value="${user.EMAIL}">
        <input type="text" id="TELEFONO" class="swal2-input" placeholder="Teléfono" value="${user.TELEFONO}">
        <input type="password" id="HSPASS" class="swal2-input" placeholder="Contraseña" value="${user.HSPASS}">
      `,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const NOMBRE = Swal.getPopup().querySelector("#NOMBRE").value;
        const EMAIL = Swal.getPopup().querySelector("#EMAIL").value;
        const TELEFONO = Swal.getPopup().querySelector("#TELEFONO").value;
        const ROLUSUARIO = user.ROLUSUARIO;
        const CLIENTEID = user.CLIENTEID;
        const HSPASS = Swal.getPopup().querySelector("#HSPASS").value;
        const USUARIOID = user.USUARIOID;
        const EXTERNO = user.EXTERNO;

        if (!NOMBRE || !EMAIL || !TELEFONO || !HSPASS) {
          Swal.showValidationMessage("Todos los campos son obligatorios");
          return false;
        }

        handleUpdateUser(USUARIOID, NOMBRE, EMAIL, TELEFONO, ROLUSUARIO, EXTERNO, CLIENTEID, HSPASS);
      }
    });
  };

  const handleUpdateUser = async (USUARIOID, NOMBRE, EMAIL, TELEFONO, ROLUSUARIO, EXTERNO, CLIENTEID, HSPASS) => {
    const updatedUser = HSPASS === "undefined"
      ? {
          NOMBRE,
          EMAIL,
          TELEFONO,
          ROLUSUARIO,
          EXTERNO,
          CLIENTEID
        }
      : {
          NOMBRE,
          EMAIL,
          TELEFONO,
          ROLUSUARIO,
          EXTERNO,
          CLIENTEID,
          HSPASS
        };

    try {
      const response = await fetchWithToken(`${API_URL}/usuarios/${USUARIOID}`, {
        method: 'PUT',
        body: JSON.stringify(updatedUser)
      });

      if (response.ok) {
        setData(prevData =>
          prevData.map(user => (user.USUARIOID === USUARIOID ? { ...user, ...updatedUser } : user))
        );
        Swal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
      } else {
        throw new Error('Error al actualizar el usuario');
      }
    } catch (err) {
      console.error('Error:', err);
      Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
    }
  };

  return (
    <div className="container mt-2 mb-2 text-center p-5 bg-light rounded shadow">
      <h2 className="mb-4">Usuarios</h2>

      <div className="d-flex justify-content-center mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nombre, correo o teléfono"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-success ml-2" onClick={handleAddUserButtonClick}>
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((user) => (
              <tr key={user.USUARIOID}>
                <td>{user.NOMBRE}</td>
                <td>{user.EMAIL}</td>
                <td>{user.TELEFONO}</td>
                <td>{user.ROLUSUARIO === 3 ? 'Administrativo' : 'Camionero'}</td>
                <td className="d-flex justify-content-center">
                  <button
                    className="btn btn-warning btn-sm rounded-circle mr-2"
                    title="Editar usuario"
                    onClick={() => handleEditUser(user)}
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                  <button
                    className="btn btn-danger btn-sm rounded-circle"
                    title="Eliminar usuario"
                    onClick={() => handleDeleteUser(user.USUARIOID)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No se encontraron resultados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsuariosScreen;
