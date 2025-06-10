import React, { useState, useEffect } from 'react';
import { formatPrice, formatDate } from '../utils/formatters';
import { ordersStorage, tablesStorage } from '../utils/storage';
import { orders as initialOrders } from '../mock/orders';
import { tables as initialTables } from '../mock/tables';

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const savedOrders = ordersStorage.get() || initialOrders;
    const savedTables = tablesStorage.get() || initialTables;
    setOrders(savedOrders);
    setTables(savedTables);
  }, []);

  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const averageTicket = todayOrders.length > 0 ? totalSales / todayOrders.length : 0;
  const occupiedTables = tables.filter(table => table.status === 'occupied').length;

  const stats = [
    {
      title: 'Ventas del Día',
      value: formatPrice(totalSales),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'bg-green-500'
    },
    {
      title: 'Órdenes Hoy',
      value: todayOrders.length.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'bg-blue-500'
    },
    {
      title: 'Ticket Promedio',
      value: formatPrice(averageTicket),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-purple-500'
    },
    {
      title: 'Mesas Ocupadas',
      value: `${occupiedTables}/${tables.length}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen de actividad del restaurante</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Órdenes Recientes</h2>
          <div className="space-y-4">
            {todayOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Orden #{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customer}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatPrice(order.total)}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    order.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'active' ? 'Activa' : 
                     order.status === 'completed' ? 'Completada' : order.status}
                  </span>
                </div>
              </div>
            ))}
            {todayOrders.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay órdenes hoy</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Mesas</h2>
          <div className="grid grid-cols-3 gap-3">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`p-4 rounded-lg border-2 text-center ${
                  table.status === 'available' ? 'border-green-200 bg-green-50' :
                  table.status === 'occupied' ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}
              >
                <p className="font-semibold text-gray-900">Mesa {table.number}</p>
                <p className="text-sm text-gray-600">{table.seats} personas</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                  table.status === 'available' ? 'bg-green-100 text-green-800' :
                  table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {table.status === 'available' ? 'Libre' :
                   table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;