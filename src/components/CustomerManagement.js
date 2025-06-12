import React, { useState, useEffect } from 'react';
import { customers as initialCustomers } from '../mock/customers';
import { createStorage } from '../utils/storage';
import { validateRequired, validateEmail } from '../utils/validators';
import { generateId } from '../utils/helpers';

const customersStorage = createStorage('pos_customers', initialCustomers);

const CustomerManagement = () => {
  const [customers, setCustomers] = useState(customersStorage.get());
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    neighborhood: '',
    city: '',
    zipCode: '',
    notes: ''
  });

  useEffect(() => {
    customersStorage.set(customers);
  }, [customers]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.phone.includes(searchTerm) ||
                          customer.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    
    if (!validateRequired(customerForm.name) || !validateRequired(customerForm.phone) || !validateRequired(customerForm.address)) {
      alert('Por favor completa los campos requeridos: Nombre, Teléfono, Dirección.');
      return;
    }

    if (customerForm.email && !validateEmail(customerForm.email)) {
      alert('Por favor, ingresa un formato de correo electrónico válido.');
      return;
    }

    const customerData = {
      ...customerForm,
      id: editingCustomer ? editingCustomer.id : generateId()
    };

    let updatedCustomers;
    if (editingCustomer) {
      updatedCustomers = customers.map(c => c.id === editingCustomer.id ? customerData : c);
    } else {
      updatedCustomers = [...customers, customerData];
    }

    setCustomers(updatedCustomers);
    resetForm();
  };

  const resetForm = () => {
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      neighborhood: '',
      city: '',
      zipCode: '',
      notes: ''
    });
    setEditingCustomer(null);
    setShowCustomerForm(false);
  };

  const handleEdit = (customer) => {
    setCustomerForm(customer);
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleDelete = (customerId) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      const updatedCustomers = customers.filter(c => c.id !== customerId);
      setCustomers(updatedCustomers);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes (CRM)</h1>
          <p className="text-gray-600 mt-1">Administra la información de tus clientes</p>
        </div>
        <button
          onClick={() => setShowCustomerForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <input
          type="text"
          placeholder="Buscar clientes por nombre, teléfono o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-600">{customer.phone}</p>
                {customer.email && <p className="text-xs text-gray-500">{customer.email}</p>}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{customer.address}</p>
            {customer.neighborhood && <p className="text-xs text-gray-500">{customer.neighborhood}, {customer.city} {customer.zipCode}</p>}
            {customer.notes && (
              <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                Notas: {customer.notes}
              </div>
            )}
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No hay clientes registrados.
          </div>
        )}
      </div>

      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
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
                      name="phone"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
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
                      name="neighborhood"
                      value={customerForm.neighborhood}
                      onChange={(e) => setCustomerForm({...customerForm, neighborhood: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={customerForm.city}
                      onChange={(e) => setCustomerForm({...customerForm, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={customerForm.zipCode}
                      onChange={(e) => setCustomerForm({...customerForm, zipCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    name="notes"
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Notas adicionales sobre el cliente..."
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
                    {editingCustomer ? 'Actualizar' : 'Crear'} Cliente
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

export default CustomerManagement;