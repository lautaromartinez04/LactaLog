import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // Asegúrate de tener SweetAlert2 instalado
import 'sweetalert2/src/sweetalert2.scss'; // Estilos de SweetAlert2
import "../styles/transporte.css"; // Hoja de estilos
import { getToken, fetchWithToken, removeTokenOnUnload } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL;

export const ClientesScreen = () => {
  const [clientes, setClientes] = useState([]);
  const [allClients, setAllClients] = useState([]); // Para el select de clientes (si se necesita)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Remover token al salir o recargar la página
  useEffect(() => {
    removeTokenOnUnload();
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
          throw new Error('Error al obtener los clientes');
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
      .catch(err => console.error('Error al obtener clientes', err));
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
      } else {
        throw new Error('Error al agregar el cliente');
      }
    } catch (err) {
      console.error('Error al agregar cliente:', err);
    }
  };

  // Abre SweetAlert para solicitar el nombre del nuevo cliente
  const handleAddClienteButtonClick = () => {
    Swal.fire({
      title: 'Nuevo Cliente',
      input: 'text',
      inputPlaceholder: 'Ingresa el nombre del cliente',
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetchWithToken(`${API_URL}/clientes/${clienteID}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            setClientes(clientes.filter(cliente => cliente.CLIENTEID !== clienteID));
            Swal.fire('¡Eliminado!', 'El cliente ha sido eliminado.', 'success');
          } else {
            throw new Error('Error al eliminar el cliente');
          }
        } catch (err) {
          console.error('Error al eliminar cliente:', err);
          Swal.fire('Error', 'Hubo un problema al eliminar el cliente.', 'error');
        }
      }
    });
  };

  // Función para editar un cliente
  const handleEditCliente = (clienteID) => {
    const cliente = clientes.find(c => c.CLIENTEID === clienteID);
    Swal.fire({
      title: 'Editar Cliente',
      input: 'text',
      inputValue: cliente.NOMBRE,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
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
          } else {
            throw new Error('Error al actualizar el cliente');
          }
        } catch (err) {
          console.error('Error al actualizar cliente:', err);
        }
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

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  return (
    <div className="container mt-2 mb-2 text-center p-5 bg-light rounded shadow">
      <h2 className="mb-4 text-center">Clientes</h2>

      {/* Campo de búsqueda y botón para agregar, en vista móvil y escritorio */}
      <div className="mb-4 d-flex align-items-center">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-success ml-2" onClick={handleAddClienteButtonClick}>
          <i className="fas fa-plus"></i>
        </button>
      </div>


      {/* Tabla de clientes */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered table-hover">
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
                      className="btn btn-warning btn-sm rounded-circle mr-2"
                      title="Editar cliente"
                      onClick={() => handleEditCliente(cliente.CLIENTEID)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button
                      className="btn btn-danger btn-sm rounded-circle"
                      title="Eliminar cliente"
                      onClick={() => handleDeleteCliente(cliente.CLIENTEID)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="text-center">No hay clientes disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientesScreen;
