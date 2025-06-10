import React, { useState, useEffect } from 'react';
import { tables as initialTables } from '../mock/tables';
import { tablesStorage } from '../utils/storage';
import { formatTableStatus, formatPrice } from '../utils/formatters';
import { generateId } from '../utils/helpers';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showEditTableModal, setShowEditTableModal] = useState(false);

  useEffect(() => {
    const savedTables = tablesStorage.get() || initialTables;
    setTables(savedTables);
  }, []);

  const updateTableStatus = (tableId, newStatus) => {
    const updatedTables = tables.map(table =>
      table.id === tableId ? { ...table, status: newStatus } : table
    );
    setTables(updatedTables);
    tablesStorage.set(updatedTables);
  };

  const assignWaiter = (tableId, waiterName) => {
    const updatedTables = tables.map(table =>
      table.id === tableId ? { ...table, waiter: waiterName } : table
    );
    setTables(updatedTables);
    tablesStorage.set(updatedTables);
  };

  const addTable = (tableNumber, seats) => {
    const newTable = {
      id: generateId(),
      number: tableNumber,
      seats: seats,
      status: 'available',
      waiter: null,
      customer: null,
      order: null,
      position: { x: 50 + (tables.length % 4) * 150, y: 50 + Math.floor(tables.length / 4) * 150 } 
    };
    const updatedTables = [...tables, newTable];
    setTables(updatedTables);
    tablesStorage.set(updatedTables);
    setShowAddTableModal(false);
  };

  const editTable = (tableId, newNumber, newSeats, newPosition) => {
    const updatedTables = tables.map(table =>
      table.id === tableId
        ? { ...table, number: newNumber, seats: newSeats, position: newPosition }
        : table
    );
    setTables(updatedTables);
    tablesStorage.set(updatedTables);
    setShowEditTableModal(false);
    setSelectedTable(null);
  };

  const deleteTable = (tableId) => {
    if (window.confirm('¿Estás seguro de eliminar esta mesa?')) {
      const updatedTables = tables.filter(table => table.id !== tableId);
      setTables(updatedTables);
      tablesStorage.set(updatedTables);
      setShowEditTableModal(false);
      setSelectedTable(null);
    }
  };

  const handleTableDrag = (tableId, newX, newY) => {
    setTables(prevTables => prevTables.map(table =>
      table.id === tableId ? { ...table, position: { x: newX, y: newY } } : table
    ));
    tablesStorage.set(tables.map(table =>
      table.id === tableId ? { ...table, position: { x: newX, y: newY } } : table
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Mesas</h1>
          <p className="text-gray-600 mt-1">Administra el estado y asignación de mesas del restaurante</p>
        </div>
        <button
          onClick={() => setShowAddTableModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Agregar Mesa</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mapa del Salón</h2>
        <div className="relative bg-gray-50 rounded-lg p-8 min-h-96 overflow-hidden">
          {tables.map(table => (
            <DraggableTable
              key={table.id}
              table={table}
              onSelect={() => {
                setSelectedTable(table);
                setShowTableModal(true);
              }}
              onDragEnd={handleTableDrag}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mesa {table.number}</h3>
                <p className="text-sm text-gray-600">{table.seats} personas</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(table.status)}`}>
                {formatTableStatus(table.status)}
              </span>
            </div>

            {table.waiter && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Mesero:</span> {table.waiter}
                </p>
              </div>
            )}

            {table.customer && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Cliente:</span> {table.customer}
                </p>
              </div>
            )}

            {table.order && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Orden Activa</p>
                <p className="text-sm text-blue-700">
                  {table.order.items.length} productos
                </p>
                <p className="text-sm text-blue-700">
                  Total: {table.order.total ? formatPrice(table.order.total) : '0.00'}
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => updateTableStatus(table.id, 'available')}
                disabled={table.status === 'available'}
                className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Liberar
              </button>
              <button
                onClick={() => updateTableStatus(table.id, 'occupied')}
                disabled={table.status === 'occupied'}
                className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Ocupar
              </button>
              <button
                onClick={() => updateTableStatus(table.id, 'reserved')}
                disabled={table.status === 'reserved'}
                className="flex-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Reservar
              </button>
              <button
                onClick={() => {
                  setSelectedTable(table);
                  setShowEditTableModal(true);
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showTableModal && selectedTable && (
        <TableModal
          table={selectedTable}
          onClose={() => {
            setShowTableModal(false);
            setSelectedTable(null);
          }}
          onUpdateStatus={updateTableStatus}
          onAssignWaiter={assignWaiter}
        />
      )}

      {showAddTableModal && (
        <AddTableModal
          onClose={() => setShowAddTableModal(false)}
          onAddTable={addTable}
        />
      )}

      {showEditTableModal && selectedTable && (
        <EditTableModal
          table={selectedTable}
          onClose={() => {
            setShowEditTableModal(false);
            setSelectedTable(null);
          }}
          onEditTable={editTable}
          onDeleteTable={deleteTable}
        />
      )}
    </div>
  );
};

const DraggableTable = ({ table, onSelect, onDragEnd, getStatusColor }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setOffset({
      x: e.clientX - (table.position ? table.position.x : 0),
      y: e.clientY - (table.position ? table.position.y : 0)
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;
    onDragEnd(table.id, newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      onClick={onSelect}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves the window
      className={`absolute w-24 h-24 rounded-full flex items-center justify-center text-center border-4 shadow-lg cursor-grab active:cursor-grabbing transition-all duration-300 ease-in-out hover:scale-105 ${getStatusColor(table.status)}`}
      style={{
        left: `${table.position ? table.position.x : 0}px`,
        top: `${table.position ? table.position.y : 0}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div>
        <span className="font-bold text-lg block">Mesa {table.number}</span>
        <span className="text-sm">{table.seats} pers.</span>
        {table.status === 'occupied' && table.order && (
          <span className="text-xs block mt-1">Orden #{table.order.id}</span>
        )}
      </div>
    </div>
  );
};

const TableModal = ({ table, onClose, onUpdateStatus, onAssignWaiter }) => {
  const [waiterName, setWaiterName] = useState(table.waiter || '');
  const [customerName, setCustomerName] = useState(table.customer || '');

  const handleSave = () => {
    if (waiterName !== table.waiter) {
      onAssignWaiter(table.id, waiterName);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Mesa {table.number}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Actual
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => onUpdateStatus(table.id, 'available')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    table.status === 'available'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Disponible
                </button>
                <button
                  onClick={() => onUpdateStatus(table.id, 'occupied')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    table.status === 'occupied'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Ocupada
                </button>
                <button
                  onClick={() => onUpdateStatus(table.id, 'reserved')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    table.status === 'reserved'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  Reservada
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesero Asignado
              </label>
              <input
                type="text"
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nombre del mesero"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Capacidad:</span> {table.seats} personas
              </p>
            </div>

            {table.order && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Orden Activa</p>
                <p className="text-sm text-blue-700">
                  {table.order.items.length} productos en la orden
                </p>
                <p className="text-sm text-blue-700">
                  Total: {table.order.total ? formatPrice(table.order.total) : '0.00'}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddTableModal = ({ onClose, onAddTable }) => {
  const [tableNumber, setTableNumber] = useState('');
  const [seats, setSeats] = useState(4);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tableNumber || !seats) {
      alert('Por favor, ingresa el número de mesa y la capacidad.');
      return;
    }
    onAddTable(parseInt(tableNumber), parseInt(seats));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Agregar Nueva Mesa</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Mesa
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad (personas)
              </label>
              <input
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Agregar Mesa
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditTableModal = ({ table, onClose, onEditTable, onDeleteTable }) => {
  const [tableNumber, setTableNumber] = useState(table.number);
  const [seats, setSeats] = useState(table.seats);
  const [position, setPosition] = useState(table.position);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tableNumber || !seats) {
      alert('Por favor, ingresa el número de mesa y la capacidad.');
      return;
    }
    onEditTable(table.id, parseInt(tableNumber), parseInt(seats), position);
  };

  const handleDelete = () => {
    onDeleteTable(table.id);
  };

  const handleDrag = (e) => {
    // Esto es una simulación simple de arrastrar.
    // En una implementación real, necesitarías calcular la posición relativa al contenedor.
    setPosition({
      x: e.clientX - 50, // Ajusta por el tamaño de la mesa
      y: e.clientY - 50
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Editar Mesa {table.number}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Mesa
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad (personas)
              </label>
              <input
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posición (Arrastrar en el mapa)
              </label>
              <div
                className="w-full h-24 bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrag}
              >
                Arrastra aquí para cambiar posición (simulado)
              </div>
              <p className="text-xs text-gray-500 mt-1">
                X: {position.x}, Y: {position.y}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                Eliminar Mesa
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TableManagement;