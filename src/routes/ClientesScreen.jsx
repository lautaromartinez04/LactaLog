import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // Asegúrate de tener SweetAlert2 instalado
import 'sweetalert2/src/sweetalert2.scss'; // Estilos de SweetAlert2
import "../styles/transporte.css"; // Hoja de estilos
import { getToken, fetchWithToken, removeTokenOnUnload, removeTokenOnPage } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export const ClientesScreen = () => {
  const [clientes, setClientes] = useState([]);
  const [allClients, setAllClients] = useState([]); // Para el select de clientes (si se necesita)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  const handleViewUsers = (clientId) => {
    navigate(`/usuarios?clientId=${clientId}`);
  };

  // Remover token al salir o recargar la página
  useEffect(() => {
    removeTokenOnUnload();
    removeTokenOnPage();
  }, []);

  // Obtener la lista de clientes
  useEffect(() => {
    // getToken redirige al login si no existe el token
    const token = getToken();
    const fetchClientes = async () => {
      try {
        const response = await fetchWithToken(`${API_URL}/clientes/`, {
          method: 'GET'
        });
        if (!response.ok) {
          throw new Error('Error al obtener los proveedores');
        }
        const result = await response.json();
        setClientes(result);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  // Obtener la lista de clientes para el select (en caso de necesitarlo)
  useEffect(() => {
    const token = getToken();
    fetchWithToken(`${API_URL}/clientes/`, { method: 'GET' })
      .then(res => res.json())
      .then(clientList => {
        setAllClients(clientList);
      })
      .catch(err => console.error('Error al obtener proveedores', err));
  }, []);

  // Filtrar clientes según término de búsqueda
  const filteredClientes = clientes.filter(cliente =>
    cliente.NOMBRE.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para agregar un cliente
  const handleAddCliente = async (clienteNombre) => {
    if (!clienteNombre) return;
    const newClienteData = { NOMBRE: clienteNombre, CLIENTEID: 0 };
    try {
      const response = await fetchWithToken(`${API_URL}/clientes/`, {
        method: 'POST',
        body: JSON.stringify(newClienteData)
      });
      if (response.ok) {
        const addedCliente = await response.json();
        setClientes([...clientes, addedCliente]);
        Swal.fire({
          icon: 'success',
          title: 'Proveedor agregado correctamente',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al agregar el proveedor',
          showConfirmButton: false,
          timer: 1500
        });
        throw new Error('Error al agregar el proveedor');
      }
    } catch (err) {
      console.error('Error al agregar el proveedor:', err);
    }
  };

  // Abre SweetAlert para solicitar el nombre del nuevo cliente
  const handleAddClienteButtonClick = () => {
    Swal.fire({
      title: 'Nuevo Proveedor',
      input: 'text',
      inputPlaceholder: 'Ingresa el nombre del proveedor',
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'El nombre no puede estar vacío';
        }
        return null;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        handleAddCliente(result.value);
      }
    });
  };

  // Función para eliminar un cliente
  const handleDeleteCliente = async (clienteID) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
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
          const response = await fetchWithToken(`${API_URL}/clientes/${clienteID}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            setClientes(clientes.filter(cliente => cliente.CLIENTEID !== clienteID));
            Swal.fire({
              icon: 'success',
              title: 'Proveedor eliminado correctamente',
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            throw new Error('Error al eliminar el proveedor');
          }
        } catch (err) {
          console.error('Error al eliminar el proveedor:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar el proveedor',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    });
  };

  // Función para editar un cliente
  const handleEditCliente = (clienteID) => {
    const cliente = clientes.find(c => c.CLIENTEID === clienteID);
    Swal.fire({
      title: 'Editar Proveedor',
      input: 'text',
      inputValue: cliente.NOMBRE,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-guardar',
        cancelButton: 'btn btn-cancelar'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'El nombre no puede estar vacío';
        }
        return null;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const updatedCliente = { ...cliente, NOMBRE: result.value };
        try {
          const response = await fetchWithToken(`${API_URL}/clientes/${clienteID}`, {
            method: 'PUT',
            body: JSON.stringify(updatedCliente)
          });
          if (response.ok) {
            setClientes(clientes.map(cliente =>
              cliente.CLIENTEID === clienteID ? updatedCliente : cliente
            ));
            Swal.fire({
              icon: 'success',
              title: 'Proveedor actualizado correctamente',
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error al actualizar el proveedor',
              showConfirmButton: false,
              timer: 1500
            })
          }
        } catch (err) {
          console.error('Error al actualizar el proveedor:', err);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="container text-center text-warning mt-5 p-5 w-100 d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container text-center mt-5 p-5 bg-light bold">
      <h1>Error al cargar los proveedores</h1>
      <p>{error}</p>
    </div>;
  }

  return (
    <div className="container mt-2 mb-2 text-center p-5 bg-light rounded shadow">
      <h1 className="mb-4 text-center">Proveedores</h1>
      {/* Campo de búsqueda y botón para agregar, en vista móvil y escritorio */}
      <div className="mb-4 d-flex align-items-center">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar proveedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-outline-success ml-2" onClick={handleAddClienteButtonClick}>
          <i className="fas fa-plus"></i>
        </button>
      </div>


      {/* Tabla de clientes */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th className="w-100">Nombre</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.length > 0 ? (
              filteredClientes.map(cliente => (
                <tr key={cliente.CLIENTEID}>
                  <td>{cliente.NOMBRE}</td>
                  <td className="d-flex justify-content-center">
                    <button
                      className="btn btn-outline-primary btn-sm mr-2"
                      title="Ver usuarios relacionados"
                      onClick={() => handleViewUsers(cliente.CLIENTEID)}
                    >
                      <i className="fas fa-user-group"></i>
                    </button>
                    <button
                      className="btn btn-outline-info btn-sm mr-2"
                      title="Editar proveedor"
                      onClick={() => handleEditCliente(cliente.CLIENTEID)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      title="Eliminar proveedor"
                      onClick={() => handleDeleteCliente(cliente.CLIENTEID)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="text-center">No hay proveedores disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientesScreen;
