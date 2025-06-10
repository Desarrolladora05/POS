import React, { useState, useEffect } from 'react';
import { orders as initialOrders } from '../mock/orders';
import { tables as initialTables } from '../mock/tables'; // Importar tables
import { ordersStorage, tablesStorage } from '../utils/storage'; // Importar tablesStorage
import { formatPrice, formatDate, formatOrderType } from '../utils/formatters';
import { getDollarRate, convertCurrency, generateTicketNumber, formatTicketDate, applyDiscount } from '../utils/helpers';
import { ticketTemplate as initialTicketTemplate } from '../mock/printers';
import { printWithBrowserDialog } from '../utils/printerUtils';
import { createStorage } from '../utils/storage'; // Importar createStorage
import { cashMovements as initialCashMovements } from '../mock/cashRegister'; // Importar movimientos iniciales
import { generateId } from '../utils/helpers'; // Importar generateId
import { ticketTemplateStorage } from '../utils/storage'; // Importar ticketTemplateStorage

const cashMovementsStorage = createStorage('pos_cash_movements', initialCashMovements); // Crear storage para movimientos de caja

const PaymentManagement = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]); // Estado para las mesas
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [paymentData, setPaymentData] = useState({
    method: 'cash',
    currency: 'MXN',
    amountReceived: '',
    tip: 0,
    discount: 0,
    discountReason: '',
    discountType: 'fixed',
    ticketType: 'normal'
  });
  const [currentTicketTemplate, setCurrentTicketTemplate] = useState(initialTicketTemplate); // Estado para la plantilla de ticket

  useEffect(() => {
    const savedOrders = ordersStorage.get() || initialOrders;
    const savedTables = tablesStorage.get() || initialTables; // Cargar mesas
    const savedTicketTemplate = ticketTemplateStorage.get() || initialTicketTemplate; // Cargar plantilla de ticket
    setOrders(savedOrders);
    setTables(savedTables);
    setCurrentTicketTemplate(savedTicketTemplate);
  }, []);

  const activeOrders = orders.filter(order => order.status === 'active');
  const dollarRate = getDollarRate();

  const processPayment = () => {
    if (!selectedOrder) return;

    const totals = {
      subtotal: selectedOrder.subtotal,
      tax: selectedOrder.tax,
      total: selectedOrder.total
    };
    const discountAmount = applyDiscount(totals.total, paymentData.discountType, paymentData.discount);
    const finalTotalMXN = totals.total - discountAmount + paymentData.tip;

    let amountReceivedMXN = parseFloat(paymentData.amountReceived) || 0;
    let changeMXN = 0;

    if (paymentData.method === 'cash') {
      if (paymentData.currency === 'USD') {
        amountReceivedMXN = convertCurrency(amountReceivedMXN, 'USD', 'MXN', dollarRate);
      }

      if (amountReceivedMXN < finalTotalMXN) {
        alert('El monto recibido es insuficiente');
        return;
      }
      changeMXN = amountReceivedMXN - finalTotalMXN;

      // Registrar movimiento en caja
      const newCashMovement = {
        id: generateId(),
        type: 'sale',
        amount: finalTotalMXN, // Registrar el total final en MXN
        description: `Venta - Orden #${selectedOrder.id}`,
        cashier: 'Usuario Actual', // Esto debería ser dinámico
        timestamp: new Date().toISOString(),
        orderId: selectedOrder.id,
        paymentMethod: 'cash'
      };
      const currentCashMovements = cashMovementsStorage.get();
      cashMovementsStorage.set([...currentCashMovements, newCashMovement]);
    }

    const updatedOrder = {
      ...selectedOrder,
      status: 'completed', // Marcar la orden como completada
      paymentMethod: paymentData.method,
      paymentCurrency: paymentData.currency,
      amountReceived: parseFloat(paymentData.amountReceived) || 0, // Guarda el monto recibido en la moneda original
      tip: paymentData.tip,
      discount: paymentData.discount,
      discountReason: paymentData.discountReason,
      finalTotal: finalTotalMXN, // El total final siempre en MXN
      change: changeMXN, // El cambio siempre en MXN
      paidAt: new Date().toISOString()
    };

    const updatedOrders = orders.map(order =>
      order.id === selectedOrder.id ? updatedOrder : order
    );

    setOrders(updatedOrders);
    ordersStorage.set(updatedOrders);

    // Cerrar la mesa si la orden estaba asociada a una
    if (selectedOrder.tableId) {
      const updatedTables = tables.map(table =>
        table.id === selectedOrder.tableId
          ? { ...table, status: 'available', order: null, customer: null, waiter: null } // Liberar mesa
          : table
      );
      setTables(updatedTables);
      tablesStorage.set(updatedTables);
    }

    const ticket = {
      number: generateTicketNumber(),
      date: formatTicketDate(new Date()),
      type: paymentData.ticketType,
      order: updatedOrder,
      payment: {
        ...paymentData,
        finalTotal: finalTotalMXN,
        discountAmount,
        change: changeMXN,
        dollarRate
      },
      totals: {
        ...totals,
        discountAmount,
        finalTotal: finalTotalMXN
      }
    };

    setGeneratedTicket(ticket);
    setShowTicketModal(true);
    setShowPaymentModal(false);
    setSelectedOrder(null);
    resetPaymentData();
  };

  const resetPaymentData = () => {
    setPaymentData({
      method: 'cash',
      currency: 'MXN',
      amountReceived: '',
      tip: 0,
      discount: 0,
      discountReason: '',
      discountType: 'fixed',
      ticketType: 'normal'
    });
  };

  const calculateFinalTotal = () => {
    if (!selectedOrder) return 0;
    const totals = {
      subtotal: selectedOrder.subtotal,
      tax: selectedOrder.tax,
      total: selectedOrder.total
    };
    const discountAmount = applyDiscount(totals.total, paymentData.discountType, paymentData.discount);
    return totals.total - discountAmount + paymentData.tip;
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'card':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'transfer':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
        <p className="text-gray-600 mt-1">Procesa pagos y genera tickets de venta</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tipo de Cambio Actual</h2>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{formatPrice(dollarRate)} USD</p>
            <p className="text-sm text-gray-600">por 1 USD</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Órdenes Pendientes de Pago</h2>
          <div className="space-y-4">
            {activeOrders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">Orden #{order.id}</h3>
                    <p className="text-sm text-gray-600">{order.customer || 'Cliente sin nombre'}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                    <p className="text-sm text-gray-600">{formatPrice(convertCurrency(order.total, 'MXN', 'USD'), 'USD')}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Mesa:</span> {order.tableId ? `Mesa ${order.tableId}` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Mesero:</span> {order.waiter || 'No asignado'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Productos:</span> {order.items.length}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setPaymentData({...paymentData, amountReceived: order.total.toString()});
                    setShowPaymentModal(true);
                  }}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Procesar Pago
                </button>
              </div>
            ))}
            {activeOrders.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay órdenes pendientes de pago</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Órdenes Completadas Hoy</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {orders.filter(order => {
              const orderDate = new Date(order.createdAt);
              const today = new Date();
              return order.status === 'completed' && orderDate.toDateString() === today.toDateString();
            }).map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">Orden #{order.id}</h3>
                    <p className="text-sm text-gray-600">{order.customer || 'Cliente sin nombre'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(order.finalTotal || order.total)}</p>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      {getPaymentMethodIcon(order.paymentMethod)}
                      <span className="capitalize">{order.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                
                {order.tip > 0 && (
                  <p className="text-sm text-green-600">Propina: {formatPrice(order.tip)}</p>
                )}
                
                {order.discount > 0 && (
                  <p className="text-sm text-orange-600">
                    Descuento: {formatPrice(order.discount)} ({order.discountReason})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPaymentModal && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          onProcessPayment={processPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
            resetPaymentData();
          }}
          calculateFinalTotal={calculateFinalTotal}
          dollarRate={dollarRate}
        />
      )}

      {showTicketModal && generatedTicket && (
        <TicketModal
          ticket={generatedTicket}
          onClose={() => {
            setShowTicketModal(false);
            setGeneratedTicket(null);
          }}
        />
      )}
    </div>
  );
};

const PaymentModal = ({ order, paymentData, setPaymentData, onProcessPayment, onClose, calculateFinalTotal, dollarRate }) => {
  const finalTotalMXN = calculateFinalTotal(); // Total final en MXN
  const discountAmount = applyDiscount(order.total, paymentData.discountType, paymentData.discount);

  let amountReceivedInCurrentCurrency = parseFloat(paymentData.amountReceived) || 0;
  let amountReceivedMXN = amountReceivedInCurrentCurrency;
  if (paymentData.currency === 'USD') {
    amountReceivedMXN = convertCurrency(amountReceivedInCurrentCurrency, 'USD', 'MXN', dollarRate);
  }

  const changeMXN = amountReceivedMXN - finalTotalMXN;
  const changeInCurrentCurrency = paymentData.currency === 'USD' 
    ? convertCurrency(changeMXN, 'MXN', 'USD', dollarRate)
    : changeMXN;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Procesar Pago - Orden #{order.id}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Resumen de la Orden</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Original:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Comprobante
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentData({...paymentData, ticketType: 'normal'})}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    paymentData.ticketType === 'normal'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Ticket Normal
                </button>
                <button
                  onClick={() => setPaymentData({...paymentData, ticketType: 'electronic'})}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    paymentData.ticketType === 'electronic'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Factura Electrónica
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentData({...paymentData, method: 'cash'})}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    paymentData.method === 'cash'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm">Efectivo</span>
                </button>
                
                <button
                  onClick={() => setPaymentData({...paymentData, method: 'card'})}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    paymentData.method === 'card'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-sm">Tarjeta</span>
                </button>
                
                <button
                  onClick={() => setPaymentData({...paymentData, method: 'transfer'})}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    paymentData.method === 'transfer'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-sm">Transferencia</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentData({...paymentData, currency: 'MXN'})}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    paymentData.currency === 'MXN'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Pesos MXN
                </button>
                <button
                  onClick={() => setPaymentData({...paymentData, currency: 'USD'})}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    paymentData.currency === 'USD'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Dólares USD
                </button>
              </div>
              {paymentData.currency === 'USD' && (
                <p className="text-sm text-gray-600 mt-2">
                  Tipo de cambio: {formatPrice(dollarRate)} MXN por USD
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento
                </label>
                <div className="flex space-x-2">
                  <select
                    value={paymentData.discountType}
                    onChange={(e) => setPaymentData({...paymentData, discountType: e.target.value})}
                    className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="fixed">$</option>
                    <option value="percentage">%</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.discount}
                    onChange={(e) => setPaymentData({...paymentData, discount: parseFloat(e.target.value) || 0})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Propina
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.tip}
                  onChange={(e) => setPaymentData({...paymentData, tip: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {paymentData.discount > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón del Descuento
                </label>
                <input
                  type="text"
                  value={paymentData.discountReason}
                  onChange={(e) => setPaymentData({...paymentData, discountReason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Cliente frecuente, promoción..."
                />
              </div>
            )}

            {paymentData.method === 'cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Recibido ({paymentData.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amountReceived}
                  onChange={(e) => setPaymentData({...paymentData, amountReceived: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="font-medium text-indigo-900 mb-2">Total a Pagar</h3>
              <div className="space-y-1 text-sm">
                {discountAmount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Descuento ({paymentData.discountType === 'percentage' ? `${paymentData.discount}%` : formatPrice(paymentData.discount)}):</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {paymentData.tip > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Propina:</span>
                    <span>+{formatPrice(paymentData.tip)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-indigo-900">
                  <span>Total Final:</span>
                  <span>{formatPrice(finalTotalMXN)}</span>
                </div>
                {paymentData.currency === 'USD' && (
                  <div className="flex justify-between text-sm text-indigo-700">
                    <span>En USD:</span>
                    <span>{formatPrice(convertCurrency(finalTotalMXN, 'MXN', 'USD', dollarRate), 'USD')}</span>
                  </div>
                )}
                {paymentData.method === 'cash' && amountReceivedInCurrentCurrency > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Cambio:</span>
                    <span>{formatPrice(changeInCurrentCurrency, paymentData.currency)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={onProcessPayment}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Procesar Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TicketModal = ({ ticket, onClose }) => {
  const printTicket = () => {
    // Usar la función de impresión del navegador
    printWithBrowserDialog(ticket.order, ticketTemplateStorage.get()); // Usar la plantilla actualizada
    onClose(); // Cerrar el modal después de imprimir
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {ticket.type === 'electronic' ? 'Factura Electrónica' : 'Ticket de Venta'}
            </h2>
            <button
              onClick={onClose} // Cerrar el modal al hacer clic en la X
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 font-mono text-sm">
            <div className="text-center mb-4">
              {ticketTemplateStorage.get().header.logo && (
                <img src={ticketTemplateStorage.get().header.logo} alt="Logo" className="h-10 object-contain mx-auto mb-2" />
              )}
              {ticketTemplateStorage.get().header.businessName && (
                <h3 className="font-bold text-lg">{ticketTemplateStorage.get().header.businessName}</h3>
              )}
              {ticketTemplateStorage.get().header.address && (
                <p className="text-sm">{ticketTemplateStorage.get().header.address}</p>
              )}
              {ticketTemplateStorage.get().header.phone && (
                <p className="text-sm">{ticketTemplateStorage.get().header.phone}</p>
              )}
              {ticketTemplateStorage.get().header.rfc && (
                <p className="text-sm">{ticketTemplateStorage.get().header.rfc}</p>
              )}
            </div>

            <div className="border-t border-gray-300 pt-2 mb-4">
              {ticketTemplateStorage.get().content.showTicketNumber && (
                <div className="flex justify-between">
                  <span>Ticket:</span>
                  <span>{ticket.number}</span>
                </div>
              )}
              {ticketTemplateStorage.get().content.showDate && (
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{ticket.date}</span>
                </div>
              )}
              {ticketTemplateStorage.get().content.showCashier && (
                <div className="flex justify-between">
                  <span>Cajero:</span>
                  <span>{ticket.order.cashier || 'N/A'}</span>
                </div>
              )}
              {ticketTemplateStorage.get().content.showCustomer && (
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span>{ticket.order.customer || 'N/A'}</span>
                </div>
              )}
              {ticketTemplateStorage.get().content.showTable && ticket.order.tableId && (
                <div className="flex justify-between">
                  <span>Mesa:</span>
                  <span>{ticket.order.tableId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tipo:</span>
                <span>{formatOrderType(ticket.order.type)}</span>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-2 mb-4">
              <div className="font-bold mb-2">PRODUCTOS:</div>
              {ticket.order.items.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span>{item.name}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  {ticketTemplateStorage.get().content.showItemDetails && (
                    <div className="text-xs text-gray-600">
                      {item.quantity} x {formatPrice(item.price)}
                      {item.variant && ` (${item.variant})`}
                    </div>
                  )}
                  {ticketTemplateStorage.get().content.showModifiers && item.modifiers.length > 0 && (
                    <div className="text-xs text-gray-600">
                      + {item.modifiers.join(', ')}
                    </div>
                  )}
                  {ticketTemplateStorage.get().content.showSpecialInstructions && item.specialInstructions && (
                    <div className="text-xs text-orange-600">
                      Nota: {item.specialInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(ticket.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (16%):</span>
                <span>{formatPrice(ticket.totals.tax)}</span>
              </div>
              {ticket.totals.discountAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Descuento:</span>
                  <span>-{formatPrice(ticket.totals.discountAmount)}</span>
                </div>
              )}
              {ticket.payment.tip > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Propina:</span>
                  <span>+{formatPrice(ticket.payment.tip)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                <span>TOTAL:</span>
                <span>{formatPrice(ticket.totals.finalTotal)}</span>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-2 mt-4">
              <div className="flex justify-between">
                <span>Método de Pago:</span>
                <span className="capitalize">{ticket.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span>Moneda:</span>
                <span>{ticket.payment.currency}</span>
              </div>
              {ticket.payment.currency === 'USD' && (
                <div className="flex justify-between text-xs">
                  <span>Tipo de Cambio:</span>
                  <span>{formatPrice(ticket.payment.dollarRate)} MXN</span>
                </div>
              )}
              {ticket.payment.method === 'cash' && (
                <>
                  <div className="flex justify-between">
                    <span>Recibido:</span>
                    <span>{formatPrice(ticket.payment.amountReceived)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cambio:</span>
                    <span>{formatPrice(ticket.payment.change)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center mt-4 text-xs">
              {ticketTemplateStorage.get().footer.thankYouMessage && (
                <p>{ticketTemplateStorage.get().footer.thankYouMessage}</p>
              )}
              {ticketTemplateStorage.get().footer.returnPolicy && (
                <p>{ticketTemplateStorage.get().footer.returnPolicy}</p>
              )}
              {ticketTemplateStorage.get().footer.additionalInfo && (
                <p>{ticketTemplateStorage.get().footer.additionalInfo}</p>
              )}
            </div>

            {ticketTemplateStorage.get().formatting.showQR && (
              <div className="text-center mt-4">
                <div className="w-16 h-16 bg-gray-300 mx-auto rounded">
                  <span className="text-xs">QR</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={printTicket}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;