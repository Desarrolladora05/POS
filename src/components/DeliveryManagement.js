import React, { useState, useEffect } from 'react';
import { orders as initialOrders } from '../mock/orders';
import { ordersStorage } from '../utils/storage';
import { formatPrice, formatDate } from '../utils/formatters';
import { generateId } from '../utils/helpers';

const DeliveryManagement = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    neighborhood: '',
    city: '',
    zipCode: '',
    deliveryTime: '',
    specialInstructions: '',
    deliveryFee: 50,
    assignedDriver: ''
  });

  const drivers = [
    'Carlos Mendoza',
    'Ana López',
    'Roberto García',
    'María Fernández'
  ];

  useEffect(() => {
    const savedOrders = ordersStorage.get() || initialOrders;
    setOrders(savedOrders);
    
    const deliveryOrdersData = savedOrders.filter(order => order.type === 'delivery');
    setDeliveryOrders(deliveryOrdersData);
  }, []);

  const createDeliveryOrder = () => {
    if (!deliveryForm.customerName || !deliveryForm.phone || !deliveryForm.address) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    const newOrder = {
      id: generateId(),
      type: 'delivery',
      status: 'preparing',
      customer: deliveryForm.customerName,
      phone: deliveryForm.phone,
      address: deliveryForm.address,
      neighborhood: deliveryForm.neighborhood,
      city: deliveryForm.city,
      zipCode: deliveryForm.zipCode,
      deliveryTime: deliveryForm.deliveryTime,
      specialInstructions: deliveryForm.specialInstructions,
      deliveryFee: deliveryForm.deliveryFee,
      assignedDriver: deliveryForm.assignedDriver,
      items: [],
      subtotal: 0,
      tax: 0,
      total: deliveryForm.deliveryFee,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 45 * 60000).toISOString()
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    setDeliveryOrders([...deliveryOrders, newOrder]);
    ordersStorage.set(updatedOrders);

    resetForm();
    alert('Orden de delivery creada exitosamente');
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    
    const updatedDeliveryOrders = deliveryOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );

    setOrders(updatedOrders);
    setDeliveryOrders(updatedDeliveryOrders);
    ordersStorage.set(updatedOrders);
  };

  const assignDriver = (orderId, driverName) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, assignedDriver: driverName } : order
    );
    
    const updatedDeliveryOrders = deliveryOrders.map(order =>
      order.id === orderId ? { ...order, assignedDriver: driverName } : order
    );

    setOrders(updatedOrders);
    setDeliveryOrders(updatedDeliveryOrders);
    ordersStorage.set(updatedOrders);
  };

  const resetForm = () => {
    setDeliveryForm({
      customerName: '',
      phone: '',
      address: '',
      neighborhood: '',
      city: '',
      zipCode: '',
      deliveryTime: '',
      specialInstructions: '',
      deliveryFee: 50,
      assignedDriver: ''
    });
    setShowDeliveryForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'in-transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Listo';
      case 'in-transit':
        return 'En camino';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Delivery</h1>
          <p className="text-gray-600 mt-1">Administra pedidos para entrega a domicilio</p>
        </div>
        <button
          onClick={() => setShowDeliveryForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nueva Orden Delivery</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {['preparing', 'ready', 'in-transit', 'delivered'].map(status => {
          const statusOrders = deliveryOrders.filter(order => order.status === status);
          return (
            <div key={status} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{getStatusText(status)}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                  {statusOrders.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {statusOrders.slice(0, 3).map(order => (
                  <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">#{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                    <p className="text-sm text-gray-600">{order.neighborhood}</p>
                    {order.assignedDriver && (
                      <p className="text-xs text-indigo-600">{order.assignedDriver}</p>
                    )}
                  </div>
                ))}
                {statusOrders.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{statusOrders.length - 3} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Órdenes de Delivery</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Orden</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Dirección</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Repartidor</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deliveryOrders.map(order => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">#{order.id}</p>
                      <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.customer}</p>
                      <p className="text-sm text-gray-600">{order.phone}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-gray-900">{order.address}</p>
                      <p className="text-sm text-gray-600">{order.neighborhood}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {order.assignedDriver ? (
                      <p className="text-sm text-gray-900">{order.assignedDriver}</p>
                    ) : (
                      <select
                        onChange={(e) => assignDriver(order.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Asignar repartidor</option>
                        {drivers.map(driver => (
                          <option key={driver} value={driver}>{driver}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{formatPrice(order.total)}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition"
                        >
                          Listo
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'in-transit')}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition"
                        >
                          En camino
                        </button>
                      )}
                      {order.status === 'in-transit' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition"
                        >
                          Entregado
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition"
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {deliveryOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay órdenes de delivery
            </div>
          )}
        </div>
      </div>

      {showDeliveryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nueva Orden de Delivery</h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createDeliveryOrder(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.customerName}
                      onChange={(e) => setDeliveryForm({...deliveryForm, customerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={deliveryForm.phone}
                      onChange={(e) => setDeliveryForm({...deliveryForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.address}
                    onChange={(e) => setDeliveryForm({...deliveryForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Calle, número, referencias..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colonia
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.neighborhood}
                      onChange={(e) => setDeliveryForm({...deliveryForm, neighborhood: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.city}
                      onChange={(e) => setDeliveryForm({...deliveryForm, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.zipCode}
                      onChange={(e) => setDeliveryForm({...deliveryForm, zipCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Entrega Preferida
                    </label>
                    <input
                      type="time"
                      value={deliveryForm.deliveryTime}
                      onChange={(e) => setDeliveryForm({...deliveryForm, deliveryTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo de Envío
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryForm.deliveryFee}
                      onChange={(e) => setDeliveryForm({...deliveryForm, deliveryFee: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repartidor Asignado
                  </label>
                  <select
                    value={deliveryForm.assignedDriver}
                    onChange={(e) => setDeliveryForm({...deliveryForm, assignedDriver: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar repartidor</option>
                    {drivers.map(driver => (
                      <option key={driver} value={driver}>{driver}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instrucciones Especiales
                  </label>
                  <textarea
                    value={deliveryForm.specialInstructions}
                    onChange={(e) => setDeliveryForm({...deliveryForm, specialInstructions: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Referencias adicionales, instrucciones de entrega..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Crear Orden
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagement;