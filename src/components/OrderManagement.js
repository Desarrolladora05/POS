import React, { useState, useEffect } from 'react';
import { products as initialProducts } from '../mock/products';
import { tables as initialTables } from '../mock/tables';
import { orders as initialOrders } from '../mock/orders';
import { customers as initialCustomers } from '../mock/customers'; // Importar clientes
import { productsStorage, tablesStorage, ordersStorage } from '../utils/storage';
import { formatPrice, formatOrderType } from '../utils/formatters';
import { calculateTotal, calculateSplitBillTotal, generateId, searchItems, getDollarRate, convertCurrency, applyDiscount, generateTicketNumber, formatTicketDate } from '../utils/helpers';
import PaymentModal from './PaymentManagement'; // Importar PaymentModal
import TicketModal from './PaymentManagement'; // Importar TicketModal (si está en el mismo archivo)
import CustomerSelectionModal from './CustomerManagement'; // Importar CustomerSelectionModal desde CustomerManagement

const OrderManagement = () => {
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState(initialCustomers); // Estado para clientes
  const [currentOrder, setCurrentOrder] = useState({
    items: [],
    tableId: null,
    type: 'dine-in',
    customer: '',
    customerId: null, // Nuevo campo para ID de cliente
    waiter: '',
    specialInstructions: '',
    splitBills: [],
    discounts: [],
    promotions: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [showCustomerSelectionModal, setShowCustomerSelectionModal] = useState(false); // Nuevo modal

  useEffect(() => {
    const savedProducts = productsStorage.get() || initialProducts;
    const savedTables = tablesStorage.get() || initialTables;
    const savedOrders = ordersStorage.get() || initialOrders;
    setProducts(savedProducts);
    setTables(savedTables);
    setOrders(savedOrders);
  }, []);

  const filteredProducts = searchItems(products, searchTerm);

  const addToOrder = (product, variant = null, modifiers = [], quantity = 1, specialInstructions = '') => {
    const price = variant ? variant.pricePesos : product.pricePesos;
    const orderItem = {
      id: generateId(),
      productId: product.id,
      name: product.name,
      quantity,
      price,
      variant: variant ? variant.name : null,
      modifiers: modifiers.map(m => m.name),
      specialInstructions,
      assignedTo: null
    };

    setCurrentOrder(prev => ({
      ...prev,
      items: [...prev.items, orderItem]
    }));
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const removeFromOrder = (itemId) => {
    setCurrentOrder(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromOrder(itemId);
      return;
    }

    setCurrentOrder(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    }));
  };

  const createSplitBill = (customerName) => {
    const newSplitBill = {
      id: generateId(),
      customerName,
      items: []
    };

    setCurrentOrder(prev => ({
      ...prev,
      splitBills: [...prev.splitBills, newSplitBill]
    }));
  };

  const assignItemToSplitBill = (itemId, splitBillId) => {
    setCurrentOrder(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, assignedTo: splitBillId } : item
      ),
      splitBills: prev.splitBills.map(bill => {
        if (bill.id === splitBillId) {
          const assignedItem = prev.items.find(item => item.id === itemId);
          if (assignedItem && !bill.items.find(item => item.id === itemId)) {
            return {
              ...bill,
              items: [...bill.items, assignedItem]
            };
          }
        }
        return bill;
      })
    }));
  };

  const saveOrder = () => {
    if (currentOrder.items.length === 0) {
      alert('Agrega productos a la orden');
      return;
    }

    const totals = calculateTotal(currentOrder.items);
    const newOrder = {
      id: generateId(),
      ...currentOrder,
      ...totals,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    ordersStorage.set(updatedOrders);

    if (currentOrder.tableId) {
      const updatedTables = tables.map(table =>
        table.id === currentOrder.tableId
          ? { ...table, status: 'occupied', order: newOrder }
          : table
      );
      setTables(updatedTables);
      tablesStorage.set(updatedTables);
    }

    setCurrentOrder({
      items: [],
      tableId: null,
      type: 'dine-in',
      customer: '',
      customerId: null,
      waiter: '',
      specialInstructions: '',
      splitBills: [],
      discounts: [],
      promotions: []
    });

    alert('Orden guardada exitosamente');
  };

  const totals = calculateTotal(currentOrder.items);

  const handleSelectCustomerForOrder = (customer) => {
    setCurrentOrder(prev => ({
      ...prev,
      customer: customer.name,
      customerId: customer.id,
      phone: customer.phone, // Asignar teléfono y dirección para el ticket
      address: customer.address,
      neighborhood: customer.neighborhood,
      city: customer.city,
      zipCode: customer.zipCode
    }));
    setShowCustomerSelectionModal(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Toma de Pedidos Avanzada</h1>
        <p className="text-gray-600 mt-1">Sistema completo de órdenes con división de cuentas y pagos múltiples</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'products'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Productos
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'search'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Búsqueda Rápida
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'products' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={() => {
                        setSelectedProduct(product);
                        setShowProductModal(true);
                      }}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'search' && (
                <div>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Buscar por nombre, código SKU o descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {filteredProducts.slice(0, 10).map(product => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductModal(true);
                        }}
                        className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition"
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-semibold text-gray-900">
                              {formatPrice(product.pricePesos)}
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatPrice(product.priceDollars, 'USD')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary
            currentOrder={currentOrder}
            setCurrentOrder={setCurrentOrder}
            tables={tables}
            totals={totals}
            onSaveOrder={saveOrder}
            onShowSplitBill={() => setShowSplitBillModal(true)}
            onShowPayment={() => setShowPaymentModal(true)}
            onRemoveItem={removeFromOrder}
            onUpdateQuantity={updateQuantity}
            onShowCustomerSelection={() => setShowCustomerSelectionModal(true)} // Pasar la función para abrir el modal
          />
        </div>
      </div>

      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onAddToOrder={addToOrder}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showSplitBillModal && (
        <SplitBillModal
          currentOrder={currentOrder}
          onCreateSplitBill={createSplitBill}
          onAssignItem={assignItemToSplitBill}
          onClose={() => setShowSplitBillModal(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          currentOrder={currentOrder}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={(ticket) => {
            setGeneratedTicket(ticket);
            setShowTicketModal(true);
            setShowPaymentModal(false);
          }}
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

      {showCustomerSelectionModal && (
        <CustomerSelectionModal
          customers={customers}
          onSelectCustomer={handleSelectCustomerForOrder}
          onClose={() => setShowCustomerSelectionModal(false)}
        />
      )}
    </div>
  );
};

const ProductCard = ({ product, onSelect }) => (
  <div
    onClick={onSelect}
    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 cursor-pointer transition"
  >
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600">{product.description}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="font-semibold text-gray-900">
            {formatPrice(product.pricePesos)}
          </span>
          <span className="text-sm text-gray-600">
            {formatPrice(product.priceDollars, 'USD')}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const OrderSummary = ({ 
  currentOrder, 
  setCurrentOrder, 
  tables, 
  totals, 
  onSaveOrder, 
  onShowSplitBill, 
  onShowPayment,
  onRemoveItem,
  onUpdateQuantity,
  onShowCustomerSelection 
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Orden Actual</h2>

    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Orden
          </label>
          <select
            value={currentOrder.type}
            onChange={(e) => setCurrentOrder({...currentOrder, type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="dine-in">En mesa</option>
            <option value="takeout">Para llevar</option>
            <option value="delivery">Domicilio</option>
          </select>
        </div>

        {currentOrder.type === 'dine-in' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mesa
            </label>
            <select
              value={currentOrder.tableId || ''}
              onChange={(e) => setCurrentOrder({...currentOrder, tableId: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar mesa</option>
              {tables.filter(t => t.status === 'available').map(table => (
                <option key={table.id} value={table.id}>
                  Mesa {table.number} ({table.seats} personas)
                </option>
              ))}
            </select>
          </div>
        )}

        {currentOrder.type === 'delivery' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente (Delivery)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentOrder.customer}
                onChange={(e) => setCurrentOrder({...currentOrder, customer: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nombre del cliente"
              />
              <button
                type="button"
                onClick={onShowCustomerSelection} 
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-5 4v-4a3 3 0 00-3-3H6a3 3 0 00-3 3v4a3 3 0 003 3h12a3 3 0 003-3v-4a3 3 0 00-3-3H9a3 3 0 00-3 3v4" />
                </svg>
              </button>
            </div>
            {currentOrder.customerId && (
              <p className="text-xs text-gray-500 mt-1">Cliente ID: {currentOrder.customerId}</p>
            )}
          </div>
        )}

        {currentOrder.type !== 'delivery' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={currentOrder.customer}
              onChange={(e) => setCurrentOrder({...currentOrder, customer: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nombre del cliente"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mesero
          </label>
          <input
            type="text"
            value={currentOrder.waiter}
            onChange={(e) => setCurrentOrder({...currentOrder, waiter: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nombre del mesero"
          />
        </div>
      </div>
    </div>

    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-900">Productos ({currentOrder.items.length})</h3>
        {currentOrder.items.length > 0 && (
          <button
            onClick={onShowSplitBill}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Dividir Cuenta
          </button>
        )}
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {currentOrder.items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.name}</p>
              {item.variant && (
                <p className="text-sm text-gray-600">Variante: {item.variant}</p>
              )}
              {item.modifiers.length > 0 && (
                <p className="text-sm text-gray-600">
                  Modificadores: {item.modifiers.join(', ')}
                </p>
              )}
              {item.specialInstructions && (
                <p className="text-sm text-orange-600">
                  Nota: {item.specialInstructions}
                </p>
              )}
              <p className="text-sm font-semibold text-gray-900">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition"
              >
                -
              </button>
              <span className="w-12 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition"
              >
                +
              </button>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {currentOrder.items.length === 0 && (
          <p className="text-gray-500 text-center py-4">No hay productos en la orden</p>
        )}
      </div>
    </div>

    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">{formatPrice(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">IVA (16%):</span>
          <span className="font-medium">{formatPrice(totals.tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{formatPrice(totals.total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={onSaveOrder}
          disabled={currentOrder.items.length === 0}
          className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
        >
          Guardar
        </button>
        <button
          onClick={onShowPayment}
          disabled={currentOrder.items.length === 0}
          className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
        >
          Pagar
        </button>
      </div>
    </div>
  </div>
);

const ProductModal = ({ product, onAddToOrder, onClose }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleAddToOrder = () => {
    onAddToOrder(product, selectedVariant, selectedModifiers, quantity, specialInstructions);
  };

  const toggleModifier = (modifier) => {
    setSelectedModifiers(prev =>
      prev.find(m => m.id === modifier.id)
        ? prev.filter(m => m.id !== modifier.id)
        : [...prev, modifier]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <p className="text-gray-600">{product.description}</p>
            <p className="text-sm text-gray-500 mt-2">SKU: {product.sku}</p>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Variantes</h3>
              <div className="space-y-2">
                {product.variants.map(variant => (
                  <label key={variant.id} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="variant"
                      checked={selectedVariant?.id === variant.id}
                      onChange={() => setSelectedVariant(variant)}
                      className="text-indigo-600"
                    />
                    <span className="flex-1">{variant.name}</span>
                    <span className="font-medium">{formatPrice(variant.pricePesos)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {product.modifiers && product.modifiers.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Modificadores</h3>
              <div className="space-y-2">
                {product.modifiers.map(modifier => (
                  <label key={modifier.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedModifiers.find(m => m.id === modifier.id)}
                      onChange={() => toggleModifier(modifier)}
                      className="text-indigo-600"
                    />
                    <span className="flex-1">{modifier.name}</span>
                    {modifier.price > 0 && (
                      <span className="font-medium">+{formatPrice(modifier.price)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instrucciones Especiales
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Sin cebolla, término medio, extra salsa..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition"
              >
                -
              </button>
              <span className="w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToOrder}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Agregar a la Orden
          </button>
        </div>
      </div>
    </div>
  );
};

const SplitBillModal = ({ currentOrder, onCreateSplitBill, onAssignItem, onClose }) => {
  const [newCustomerName, setNewCustomerName] = useState('');

  const handleCreateSplitBill = () => {
    if (!newCustomerName.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }
    onCreateSplitBill(newCustomerName);
    setNewCustomerName('');
  };

  const unassignedItems = currentOrder.items.filter(item => !item.assignedTo);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">División de Cuenta</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Crear Nueva Cuenta</h3>
              <div className="flex space-x-3 mb-6">
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleCreateSplitBill}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Crear
                </button>
              </div>

              <h3 className="font-medium text-gray-900 mb-4">Productos Sin Asignar ({unassignedItems.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {unassignedItems.map(item => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <div className="mt-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onAssignItem(item.id, e.target.value);
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="">Asignar a...</option>
                        {currentOrder.splitBills.map(bill => (
                          <option key={bill.id} value={bill.id}>
                            {bill.customerName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {unassignedItems.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Todos los productos están asignados</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">Cuentas Divididas ({currentOrder.splitBills.length})</h3>
              <div className="space-y-4">
                {currentOrder.splitBills.map(bill => {
                  const billTotals = calculateSplitBillTotal(bill);
                  return (
                    <div key={bill.id} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{bill.customerName}</h4>
                      <div className="space-y-2">
                        {bill.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatPrice(billTotals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>IVA:</span>
                          <span>{formatPrice(billTotals.tax)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>{formatPrice(billTotals.total)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {currentOrder.splitBills.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No hay cuentas divididas</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente PaymentModal movido a su propio archivo PaymentManagement.js
// Componente TicketModal movido a su propio archivo PaymentManagement.js

export default OrderManagement;