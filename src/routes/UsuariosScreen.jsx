import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import "../styles/usuarios.css";
import { getToken, fetchWithToken, removeTokenOnUnload, removeTokenOnPage } from '../utils/auth';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export const UsuariosScreen = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]); // Lista de clientes para el select (si es rol 2)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const location = useLocation();
  const clientIdFilter = new URLSearchParams(location.search).get('clientId');
  const clientIdFilterNumber = clientIdFilter ? Number(clientIdFilter) : null;

  // Remover token al salir o recargar
  useEffect(() => {
    removeTokenOnUnload();
    removeTokenOnPage();
  }, []);

  // Cargar usuarios y clientes
  useEffect(() => {
    const token = getToken();
    const fetchData = async () => {
      try {
        const [usuariosRes, clientesRes] = await Promise.all([
          fetchWithToken(`${API_URL}/usuarios/`, { method: 'GET' }),
          fetchWithToken(`${API_URL}/clientes/`, { method: 'GET' })
        ]);
        if (!usuariosRes.ok) throw new Error('Error al obtener los usuarios');
        if (!clientesRes.ok) throw new Error('Error al obtener los clientes');
        const usuariosData = await usuariosRes.json();
        const clientesData = await clientesRes.json();
        // Excluir administradores (ROLUSUARIO === 1)
        const usuariosFiltrados = usuariosData.filter(u => u.ROLUSUARIO !== 1);
        setUsuarios(usuariosFiltrados);
        setClientes(clientesData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar usuarios según búsqueda
  const filteredUsuarios = usuarios.filter(user =>
    user.NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.EMAIL.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.TELEFONO && user.TELEFONO.includes(searchTerm))
  );

  // Handler para agregar un nuevo usuario
  const handleAddUser = async (newUser) => {
    try {
      const token = getToken();
      const response = await fetchWithToken(`${API_URL}/usuarios`, {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      if (response.ok) {
        const createdUser = await response.json();
        setUsuarios(prev => [...prev, createdUser]);
        Swal.fire({
          icon: 'success',
          title: 'Usuario agregado correctamente',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        throw new Error('Error al agregar el usuario');
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire("Error", "No se pudo agregar el usuario", "error");
    }
  };

  // Modal para agregar usuario
  const handleAddUserButtonClick = () => {
    Swal.fire({
      title: 'Nuevo Usuario',
      html: `
        <div style="display:flex; flex-wrap: wrap; justify-content: center;">
          <label for="NOMBRE" class="w-100">Nombre:</label>
          <input type="text" id="NOMBRE" class="swal2-input mt-0 mb-3">
        </div>
        <div style="display:flex; flex-wrap: wrap; justify-content: center;">
          <label for="EMAIL" class="w-100">Correo:</label>
          <input type="email" id="EMAIL" class="swal2-input mt-0 mb-3">
        </div>
        <!-- Dos campos para teléfono en línea -->
        <div style="display:flex; flex-wrap: wrap; justify-content: center;">
          <label for="TELEFONO" class="w-100">Tel&eacute;fono:</label>
          <div style="display:flex; justify-content: center; gap:5px;">
            <input type="text" id="AREA" class="swal2-input mt-0 mb-3 mx-0 w-25" placeholder="(sin 0)">
            <input type="text" id="NUMERO" class="swal2-input mt-0 mb-3 mx-0 w-50" placeholder="(sin 15)">
          </div>
        </div>
        <div style="display:flex; flex-wrap: wrap; justify-content: center;">
          <label for="HSPASS" class="w-100">Contraseña:</label>
          <input type="password" id="HSPASS" class="swal2-input mt-0 mb-3">
        </div>
        <select id="ROLUSUARIO" class="swal2-input">
          <option value="2">Cliente</option>
          <option value="3">Administrativo</option>
          <option value="4" selected>Camionero</option>
        </select>
        <!-- Contenedor centrado para los toggles de notificaciones -->
        <div style="display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:20px; margin-top:10px;">
          <div class="custom-toggle-notif">
            <label class="notif-switch">
              <input type="checkbox" id="WD_EMAIL"/>
              <span class="notif-slider"></span>
            </label>
            <span>Notificar por Mail</span>
          </div>
          <div class="custom-toggle-notif">
            <label class="notif-switch">
              <input type="checkbox" id="WD_WHATSAPP"/>
              <span class="notif-slider"></span>
            </label>
            <span>Notificar por WhatsApp</span>
          </div>
        </div>
        <!-- Select para relacionar con un cliente, solo si es rol Cliente -->
        <div id="clienteSelect" style="display:none; margin-top:10px;">
          <select id="CLIENTEID" class="swal2-input">
            ${clientes.map(c => `<option value="${c.CLIENTEID}">${c.NOMBRE}</option>`).join('')}
          </select>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const NOMBRE = Swal.getPopup().querySelector("#NOMBRE").value;
        const EMAIL = Swal.getPopup().querySelector("#EMAIL").value;
        const AREA = Swal.getPopup().querySelector("#AREA").value;
        const NUMERO = Swal.getPopup().querySelector("#NUMERO").value;
        const HSPASS = Swal.getPopup().querySelector("#HSPASS").value;
        const ROLUSUARIO = Number(Swal.getPopup().querySelector("#ROLUSUARIO").value);
        const WD_EMAIL = Swal.getPopup().querySelector("#WD_EMAIL").checked;
        const WD_WHATSAPP = Swal.getPopup().querySelector("#WD_WHATSAPP").checked;
        let CLIENTEID = null;
        if (ROLUSUARIO === 2) {
          CLIENTEID = Number(Swal.getPopup().querySelector("#CLIENTEID").value);
        }
        if (!NOMBRE || !EMAIL || !AREA || !NUMERO) {
          Swal.showValidationMessage("Todos los campos son obligatorios");
          return false;
        }
        // Validar email único
        const emailExists = usuarios.some(u =>
          u.EMAIL.toLowerCase() === EMAIL.toLowerCase()
        );
        if (emailExists) {
          Swal.showValidationMessage("Ese mail ya existe");
          return false;
        }
        const TELEFONO = `+549${AREA}${NUMERO}`;
        // Construir el objeto para el nuevo usuario
        const newUser = {
          NOMBRE,
          EMAIL,
          TELEFONO,
          ROLUSUARIO,
          EXTERNO: true,
          CLIENTEID,
          WD_EMAIL,
          WD_WHATSAPP
        };
        if (HSPASS.trim() !== "") {
          newUser.HSPASS = HSPASS;
        }
        return newUser;
      },
      didOpen: () => {
        const rolSelect = Swal.getPopup().querySelector("#ROLUSUARIO");
        rolSelect.addEventListener("change", (e) => {
          const clienteDiv = Swal.getPopup().querySelector("#clienteSelect");
          if (e.target.value === "2") {
            clienteDiv.style.display = "block";
          } else {
            clienteDiv.style.display = "none";
          }
        });
      },
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        handleAddUser(result.value);
      }
    });
  };

  // Handler para eliminar un usuario
  const handleDeleteUser = async (userID) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = getToken();
          const response = await fetchWithToken(`${API_URL}/usuarios/${userID}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            setUsuarios(prev => prev.filter(user => user.USUARIOID !== userID));
            Swal.fire({
              icon: 'success',
              title: 'Eliminado correctamente',
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            throw new Error('Error al eliminar el usuario');
          }
        } catch (err) {
          console.error('Error al eliminar el usuario:', err);
          Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
        }
      }
    });
  };

  // Handler para editar un usuario, precargando los valores actuales.
  const handleEditUser = (user) => {
    // Para el teléfono, si existe y comienza con "+54 9", extraemos el código y el número.
    const tel = user.TELEFONO && user.TELEFONO.startsWith('+549')
      ? user.TELEFONO
      : '';
    const cleanTel = tel.substring(4);
    const area = cleanTel.substring(0, 3);
    const numero = cleanTel.substring(3);

    Swal.fire({
      title: 'Editar Usuario',
      html: `
        <div style="display:flex; flex-wrap: wrap; justify-content: center;">
          <label for="NOMBRE" class="w-100">Nombre:</label>
          <input type="text" id="NOMBRE" class="swal2-input" placeholder="Nombre" value="${user.NOMBRE}">
        </div>
        <div style="display:flex; flex-wrap: wrap; justify-content: center;">
          <label for="EMAIL" class="w-100">Correo:</label>
          <input type="email" id="EMAIL" class="swal2-input" placeholder="Correo" value="${user.EMAIL}">
        </div>
        <!-- Dos inputs para teléfono, en línea -->
        <div style="display:flex; flex-wrap: wrap; justify-content: center;">
          <label for="TELEFONO" class="w-100">Tel&eacute;fono:</label>
          <div style="display:flex; justify-content: center;">
            <input type="text" id="AREA" class="swal2-input w-25 mx-0" placeholder="(sin 0)" value="${area}">
            <input type="text" id="NUMERO" class="swal2-input w-50 mx-0" placeholder="(sin 15)" value="${numero}">
          </div>
        </div>
        <div style="display:flex; flex-wrap: wrap; justify-content: center;">
          <label for="HSPASS" class="w-100">Contraseña (dejar vacío para no modificar):</label>
          <input type="password" id="HSPASS" class="swal2-input" placeholder="Contraseña">
        </div>
        <select id="ROLUSUARIO" class="swal2-input">
          <option value="2" ${user.ROLUSUARIO === 2 ? 'selected' : ''}>Cliente</option>
          <option value="3" ${user.ROLUSUARIO === 3 ? 'selected' : ''}>Administrativo</option>
          <option value="4" ${user.ROLUSUARIO === 4 ? 'selected' : ''}>Camionero</option>
        </select>
          <div class="custom-toggle-notif mt-3">
            <label class="notif-switch">
              <input type="checkbox" id="WD_EMAIL" ${user.WD_EMAIL ? 'checked' : ''}>
              <span class="notif-slider"></span>
            </label>
            <span>Notificar por Mail</span>
          </div>
          <div class="custom-toggle-notif">
            <label class="notif-switch">
              <input type="checkbox" id="WD_WHATSAPP" ${user.WD_WHATSAPP ? 'checked' : ''}>
              <span class="notif-slider"></span>
            </label>
            <span>Notificar por WhatsApp</span>
          </div>
        
        <div id="clienteSelect" style="display: ${user.ROLUSUARIO === 2 ? 'block' : 'none'}; margin-top:10px;">
          <select id="CLIENTEID" class="swal2-input">
            ${clientes.map(c => `<option value="${c.CLIENTEID}" ${c.CLIENTEID === user.CLIENTEID ? 'selected' : ''}>${c.NOMBRE}</option>`).join('')}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      },
      preConfirm: () => {
        const NOMBRE = Swal.getPopup().querySelector("#NOMBRE").value;
        const EMAIL = Swal.getPopup().querySelector("#EMAIL").value;
        const AREA = Swal.getPopup().querySelector("#AREA").value;
        const NUMERO = Swal.getPopup().querySelector("#NUMERO").value;
        const HSPASS = Swal.getPopup().querySelector("#HSPASS").value;
        const ROLUSUARIO = Number(Swal.getPopup().querySelector("#ROLUSUARIO").value);
        const WD_EMAIL = Swal.getPopup().querySelector("#WD_EMAIL").checked;
        const WD_WHATSAPP = Swal.getPopup().querySelector("#WD_WHATSAPP").checked;
        let CLIENTEID = null;
        if (ROLUSUARIO === 2) {
          CLIENTEID = Number(Swal.getPopup().querySelector("#CLIENTEID").value);
        }
        if (!NOMBRE || !EMAIL || !AREA || !NUMERO) {
          Swal.showValidationMessage("Todos los campos son obligatorios");
          return false;
        }
        // Validar email único (excluyendo al usuario actual)
        const emailExists = usuarios.some(u =>
          u.EMAIL.toLowerCase() === EMAIL.toLowerCase() && u.USUARIOID !== user.USUARIOID
        );
        if (emailExists) {
          Swal.showValidationMessage("Ese mail ya existe");
          return false;
        }
        const TELEFONO = `+549${AREA}${NUMERO}`;
        const updatedUser = {
          ...user,
          NOMBRE,
          EMAIL,
          TELEFONO,
          ROLUSUARIO,
          EXTERNO: true,
          CLIENTEID,
          WD_EMAIL,
          WD_WHATSAPP
        };
        if (HSPASS.trim() !== "") {
          updatedUser.HSPASS = HSPASS;
        }
        return updatedUser;
      },
      didOpen: () => {
        const rolSelect = Swal.getPopup().querySelector("#ROLUSUARIO");
        rolSelect.addEventListener("change", (e) => {
          const clienteDiv = Swal.getPopup().querySelector("#clienteSelect");
          if (e.target.value === "2") {
            clienteDiv.style.display = "block";
          } else {
            clienteDiv.style.display = "none";
          }
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedUser = result.value;
        fetchWithToken(`${API_URL}/usuarios/${updatedUser.USUARIOID}`, {
          method: 'PUT',
          body: JSON.stringify(updatedUser)
        })
          .then(res => {
            if (res.ok) {
              setUsuarios(prev =>
                prev.map(u => (u.USUARIOID === updatedUser.USUARIOID ? updatedUser : u))
              );
              Swal.fire({
                icon: 'success',
                title: 'Usuario actualizado correctamente',
                showConfirmButton: false,
                timer: 1500
              });
            } else {
              throw new Error('Error al actualizar el usuario');
            }
          })
          .catch(err => {
            console.error('Error al actualizar el usuario:', err);
            Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
          });
      }
    });
  };

  const handleNotification = (msg, icon) => {
    Swal.fire({

      icon: icon,
      title: msg,
      confirmButtonText: 'Aceptar',
      customClass: {
        confirmButton: 'btn btn-guardar'
      }
    });
  };

  if (loading) {
    return (
      <div className="container text-center mt-5 p-5 w-100 d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container text-center mt-2 mb-2 p-5 bg-light rounded shadow">
      <h1 className="mb-4 text-center">Usuarios</h1>
      <div className="d-flex align-items-center mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nombre, correo o teléfono"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-outline-success ms-2 ml-2" onClick={handleAddUserButtonClick}>
          <i className="fas fa-plus"></i>
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Notificación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsuarios.length > 0 ? (
              filteredUsuarios.map((user) => (
                <tr key={user.USUARIOID}
                  style={
                    clientIdFilterNumber && user.CLIENTEID === clientIdFilterNumber
                      ? { border: '3px solid #eaa416' }
                      : {}
                  }>
                  <td>{user.NOMBRE}</td>
                  <td>{user.EMAIL}</td>
                  <td>{user.TELEFONO}</td>
                  <td>
                    {user.ROLUSUARIO === 2 ? (
                      <>
                        Cliente
                        <br />
                        {(clientes.find(c => c.CLIENTEID === user.CLIENTEID) || {}).NOMBRE || ''}
                      </>
                    ) : user.ROLUSUARIO === 3 ? (
                      'Administrativo'
                    ) : user.ROLUSUARIO === 4 ? (
                      'Camionero'
                    ) : (
                      'Desconocido'
                    )}
                  </td>
                  <td className=" text-center">{user.WD_EMAIL ? (
                    <i className="fa-solid fa-envelope text-success mr-2" style={{ "font-size": "1.3em", "cursor": "pointer" }} onClick={() => handleNotification("Este usuario recibe notificaciones por correo", "success")}></i>
                  ) : (
                    <i className="fa-solid fa-envelope text-danger mr-2" style={{ "font-size": "1.3em", "cursor": "pointer" }} onClick={() => handleNotification("Este usuario no recibe notificaciones por correo", "error")}></i>
                  )} {user.WD_WHATSAPP ? (
                    <i className="fa-brands fa-whatsapp text-success ml-2" style={{ "font-size": "1.3em", "cursor": "pointer" }} onClick={() => handleNotification("Este usuario recibe notificaciones por WhatsApp", "success")}></i>
                  ) : (
                    <i className="fa-brands fa-whatsapp text-danger ml-2" style={{ "font-size": "1.3em", "cursor": "pointer" }} onClick={() => handleNotification("Este usuario no recibe notificaciones por WhatsApp", "error")}></i>
                  )
                    }
                  </td>
                  <td>
                    <button
                      className="btn btn-outline-info btn-sm mr-2"
                      title="Editar usuario"
                      onClick={() => handleEditUser(user)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      title="Eliminar usuario"
                      onClick={() => handleDeleteUser(user.USUARIOID)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No se encontraron resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsuariosScreen;
