import React, { useState, useEffect } from 'react';
import { cashMovements as initialMovements, cashClosures as initialClosures } from '../mock/cashRegister';
import { formatPrice, formatDate } from '../utils/formatters';
import { calculateCashSummary, generateCashReport, validateCashClosure, formatCashMovementType } from '../utils/cashRegisterUtils';
import { generateId } from '../utils/helpers';
import { createStorage } from '../utils/storage';

const cashMovementsStorage = createStorage('pos_cash_movements', initialMovements);
const cashClosuresStorage = createStorage('pos_cash_closures', initialClosures);
const currentSessionStorage = createStorage('pos_current_session', null);

const CashRegisterManagement = () => {
  const [movements, setMovements] = useState(cashMovementsStorage.get());
  const [closures, setClosures] = useState(cashClosuresStorage.get());
  const [currentSession, setCurrentSession] = useState(currentSessionStorage.get());
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    cashMovementsStorage.set(movements);
    cashClosuresStorage.set(closures);
    currentSessionStorage.set(currentSession);
  }, [movements, closures, currentSession]);

  // Actualizar la sesión actual cada vez que los movimientos cambien
  useEffect(() => {
    const today = new Date().toDateString();
    const todayMovements = movements.filter(m => 
      new Date(m.timestamp).toDateString() === today
    );
    
    const openingMovement = todayMovements.find(m => m.type === 'opening');
    
    if (openingMovement) {
      const summary = calculateCashSummary(todayMovements);
      setCurrentSession({
        date: today,
        movements: todayMovements,
        summary,
        isOpen: true
      });
    } else {
      setCurrentSession(null); // No hay sesión abierta si no hay movimiento de apertura hoy
    }
  }, [movements]); // Dependencia de movements para recalcular la sesión

  const openCashRegister = (initialAmount) => {
    const newMovement = {
      id: generateId(),
      type: 'opening',
      amount: initialAmount,
      description: 'Apertura de caja',
      cashier: 'Usuario Actual',
      timestamp: new Date().toISOString(),
      orderId: null,
      paymentMethod: 'cash'
    };

    const updatedMovements = [...movements, newMovement];
    setMovements(updatedMovements);
  };

  const addMovement = (movementData) => {
    const newMovement = {
      id: generateId(),
      ...movementData,
      cashier: 'Usuario Actual',
      timestamp: new Date().toISOString()
    };

    const updatedMovements = [...movements, newMovement];
    setMovements(updatedMovements);
  };

  const closeCashRegister = (actualAmount, notes) => {
    if (!currentSession) return;

    const validation = validateCashClosure(currentSession.summary.total, actualAmount);
    
    const closure = {
      id: generateId(),
      date: currentSession.date,
      cashier: 'Usuario Actual',
      openingAmount: currentSession.summary.opening,
      totalSales: currentSession.summary.sales,
      totalExpenses: currentSession.summary.expenses,
      expectedAmount: currentSession.summary.total,
      actualAmount,
      difference: validation.difference,
      status: 'closed',
      closedAt: new Date().toISOString(),
      movements: currentSession.movements.length,
      notes,
      validation
    };

    const closingMovement = {
      id: generateId(),
      type: 'closing',
      amount: actualAmount, // El monto del cierre es el monto final en caja
      description: `Cierre de caja - ${validation.status}`,
      cashier: 'Usuario Actual',
      timestamp: new Date().toISOString(),
      orderId: null,
      paymentMethod: 'cash'
    };

    setClosures([...closures, closure]);
    setMovements([...movements, closingMovement]);
    setCurrentSession(null);
  };

  const tabs = [
    { id: 'current', name: 'Sesión Actual', icon: '💰' },
    { id: 'movements', name: 'Movimientos', icon: '📋' },
    { id: 'reports', name: 'Reportes', icon: '📊' } // Eliminado el tab de 'Cierres'
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Caja</h1>
        <p className="text-gray-600 mt-1">Control de efectivo, movimientos y cierres de caja</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'current' && (
            <CurrentSession
              session={currentSession}
              onOpenRegister={openCashRegister}
              onAddMovement={() => setShowMovementModal(true)}
              onCloseRegister={() => setShowClosureModal(true)}
            />
          )}

          {activeTab === 'movements' && (
            <MovementsHistory
              movements={movements}
              onAddMovement={() => setShowMovementModal(true)}
            />
          )}

          {activeTab === 'reports' && ( // Cambiado de 'closures' a 'reports'
            <CashReports movements={movements} closures={closures} />
          )}
        </div>
      </div>

      {showMovementModal && (
        <MovementModal
          onClose={() => setShowMovementModal(false)}
          onSave={(data) => {
            addMovement(data);
            setShowMovementModal(false);
          }}
        />
      )}

      {showClosureModal && currentSession && (
        <ClosureModal
          session={currentSession}
          onClose={() => setShowClosureModal(false)}
          onSave={(actualAmount, notes) => {
            closeCashRegister(actualAmount, notes);
            setShowClosureModal(false);
          }}
        />
      )}
    </div>
  );
};

const CurrentSession = ({ session, onOpenRegister, onAddMovement, onCloseRegister }) => {
  const [openingAmount, setOpeningAmount] = useState(1000);

  if (!session || !session.isOpen) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Caja Cerrada</h3>
        <p className="text-gray-600 mb-6">No hay una sesión de caja activa. Abre la caja para comenzar.</p>
        
        <div className="max-w-sm mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto de Apertura
          </label>
          <input
            type="number"
            step="0.01"
            value={openingAmount}
            onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            placeholder="1000.00"
          />
          <button
            onClick={() => onOpenRegister(openingAmount)}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
          >
            Abrir Caja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Sesión Actual - {session.date}</h2>
        <div className="flex space-x-3">
          <button
            onClick={onAddMovement}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Agregar Movimiento
          </button>
          <button
            onClick={onCloseRegister}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Cerrar Caja
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Apertura</p>
              <p className="text-2xl font-bold text-green-900">{formatPrice(session.summary.opening)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Ventas</p>
              <p className="text-2xl font-bold text-blue-900">{formatPrice(session.summary.sales)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Gastos</p>
              <p className="text-2xl font-bold text-red-900">{formatPrice(session.summary.expenses)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total en Caja</p>
              <p className="text-2xl font-bold text-purple-900">{formatPrice(session.summary.total)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Movimientos Recientes</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {session.movements.slice(-10).reverse().map(movement => (
            <div key={movement.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{formatCashMovementType(movement.type)}</p>
                <p className="text-sm text-gray-600">{movement.description}</p>
                <p className="text-xs text-gray-500">{formatDate(movement.timestamp)}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  movement.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movement.amount >= 0 ? '+' : ''}{formatPrice(movement.amount)}
                </p>
              </div>
            </div>
          ))}
          {session.movements.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay movimientos registrados</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MovementsHistory = ({ movements, onAddMovement }) => {
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  const filteredMovements = movements.filter(movement => {
    const typeMatch = filterType === 'all' || movement.type === filterType;
    
    let dateMatch = true;
    const movementDate = new Date(movement.timestamp);
    const today = new Date();
    
    switch (dateFilter) {
      case 'today':
        dateMatch = movementDate.toDateString() === today.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateMatch = movementDate >= weekAgo;
        break;
      case 'month':
        dateMatch = movementDate.getMonth() === today.getMonth() && 
                   movementDate.getFullYear() === today.getFullYear();
        break;
    }
    
    return typeMatch && dateMatch;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Historial de Movimientos</h2>
        <button
          onClick={onAddMovement}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Nuevo Movimiento
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos los tipos</option>
          <option value="opening">Apertura</option>
          <option value="sale">Ventas</option>
          <option value="expense">Gastos</option>
          <option value="deposit">Depósitos</option>
          <option value="withdrawal">Retiros</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="today">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="all">Todos</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cajero
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.map(movement => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(movement.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      movement.type === 'sale' ? 'bg-green-100 text-green-800' :
                      movement.type === 'expense' ? 'bg-red-100 text-red-800' :
                      movement.type === 'opening' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatCashMovementType(movement.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {movement.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movement.cashier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`font-semibold ${
                      movement.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.amount >= 0 ? '+' : ''}{formatPrice(movement.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMovements.length === 0 && (
            <p className="text-gray-500 text-center py-4">No se encontraron movimientos con los filtros seleccionados</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ClosuresHistory = ({ closures }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Historial de Cierres</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {closures.map(closure => (
          <div key={closure.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{closure.date}</h3>
                <p className="text-sm text-gray-600">Cajero: {closure.cashier}</p>
                <p className="text-xs text-gray-500">{formatDate(closure.closedAt)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                closure.validation.status === 'balanced' ? 'bg-green-100 text-green-800' :
                closure.validation.status === 'surplus' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {closure.validation.status === 'balanced' ? 'Balanceado' :
                 closure.validation.status === 'surplus' ? 'Sobrante' : 'Faltante'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Apertura:</span>
                <span>{formatPrice(closure.openingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ventas:</span>
                <span className="text-green-600">+{formatPrice(closure.totalSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gastos:</span>
                <span className="text-red-600">-{formatPrice(closure.totalExpenses)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Esperado:</span>
                <span>{formatPrice(closure.expectedAmount)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Real:</span>
                <span>{formatPrice(closure.actualAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Diferencia:</span>
                <span className={closure.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {closure.difference >= 0 ? '+' : ''}{formatPrice(closure.difference)}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              {closure.movements} movimientos registrados
            </div>
          </div>
        ))}
        {closures.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No hay cierres de caja registrados
          </div>
        )}
      </div>
    </div>
  );
};

const CashReports = ({ movements, closures }) => {
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const generateReport = () => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 1);

    return generateCashReport(movements, startDate, endDate);
  };

  const report = generateReport();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Reportes de Caja</h2>
        <div className="flex space-x-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-green-600 mb-2">Total Ventas</h3>
          <p className="text-2xl font-bold text-green-900">{formatPrice(report.summary.sales)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-red-600 mb-2">Total Gastos</h3>
          <p className="text-2xl font-bold text-red-900">{formatPrice(report.summary.expenses)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-600 mb-2">Movimientos</h3>
          <p className="text-2xl font-bold text-blue-900">{report.movements.length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-purple-600 mb-2">Balance Final</h3>
          <p className="text-2xl font-bold text-purple-900">{formatPrice(report.summary.total)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Detalle de Movimientos</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.movements.map(movement => (
                <tr key={movement.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(movement.timestamp).toLocaleTimeString('es-MX')}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      movement.type === 'sale' ? 'bg-green-100 text-green-800' :
                      movement.type === 'expense' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatCashMovementType(movement.type)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{movement.description}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <span className={movement.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {movement.amount >= 0 ? '+' : ''}{formatPrice(movement.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MovementModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    paymentMethod: 'cash'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      alert('Por favor completa todos los campos');
      return;
    }

    const amount = formData.type === 'expense' || formData.type === 'withdrawal' 
      ? -Math.abs(parseFloat(formData.amount))
      : parseFloat(formData.amount);

    onSave({
      ...formData,
      amount
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Nuevo Movimiento</h2>
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
                Tipo de Movimiento
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="expense">Gasto</option>
                <option value="deposit">Depósito</option>
                <option value="withdrawal">Retiro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe el motivo del movimiento..."
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
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ClosureModal = ({ session, onClose, onSave }) => {
  const [actualAmount, setActualAmount] = useState(session.summary.total);
  const [notes, setNotes] = useState('');

  const validation = validateCashClosure(session.summary.total, actualAmount);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(actualAmount, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Cierre de Caja</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Resumen del Día</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Apertura:</span>
                <span>{formatPrice(session.summary.opening)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas:</span>
                <span className="text-green-600">+{formatPrice(session.summary.sales)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos:</span>
                <span className="text-red-600">-{formatPrice(session.summary.expenses)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total Esperado:</span>
                <span>{formatPrice(session.summary.total)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Real en Caja
              </label>
              <input
                type="number"
                step="0.01"
                value={actualAmount}
                onChange={(e) => setActualAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className={`p-3 rounded-lg ${
              validation.status === 'balanced' ? 'bg-green-50 border border-green-200' :
              validation.status === 'surplus' ? 'bg-blue-50 border border-blue-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">Diferencia:</span>
                <span className={`font-bold ${
                  validation.difference === 0 ? 'text-green-600' :
                  validation.difference > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {validation.difference >= 0 ? '+' : ''}{formatPrice(validation.difference)}
                </span>
              </div>
              <p className="text-sm mt-1">
                {validation.status === 'balanced' && 'Caja balanceada correctamente'}
                {validation.status === 'surplus' && 'Hay un sobrante en caja'}
                {validation.status === 'shortage' && 'Hay un faltante en caja'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas del Cierre
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Observaciones adicionales..."
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Cerrar Caja
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CashRegisterManagement;