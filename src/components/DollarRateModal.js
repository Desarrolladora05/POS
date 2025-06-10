import React, { useState } from 'react';
import { setDollarRate } from '../utils/helpers';

const DollarRateModal = ({ onClose }) => {
  const [rate, setRate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const numericRate = parseFloat(rate);
    if (isNaN(numericRate) || numericRate <= 0) {
      setError('Por favor, ingresa un tipo de cambio válido.');
      return;
    }
    setDollarRate(numericRate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Tipo de Cambio del Dólar</h2>
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
                Ingresa el tipo de cambio actual (MXN por 1 USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => {
                  setRate(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: 19.50"
                required
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DollarRateModal;