import React, { useState, useEffect } from 'react';
import { printers as initialPrinters, ticketTemplate as initialTemplate, generalSettings as initialGeneralSettings } from '../mock/printers';
import { formatPrice } from '../utils/formatters';
import { generatePrintHTML, printWithBrowserDialog, generateQRCode } from '../utils/printerUtils';
import { printersStorage, ticketTemplateStorage, generalSettingsStorage } from '../utils/storage';

const ConfigurationManagement = () => {
  const [activeTab, setActiveTab] = useState('printers');
  const [printers, setPrinters] = useState(printersStorage.get() || initialPrinters);
  const [ticketTemplate, setTicketTemplate] = useState(ticketTemplateStorage.get() || initialTemplate);
  const [generalSettings, setGeneralSettings] = useState(generalSettingsStorage.get() || initialGeneralSettings);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    printersStorage.set(printers);
  }, [printers]);

  useEffect(() => {
    ticketTemplateStorage.set(ticketTemplate);
  }, [ticketTemplate]);

  useEffect(() => {
    generalSettingsStorage.set(generalSettings);
  }, [generalSettings]);

  const sampleTicketData = {
    number: 'T123456',
    date: new Date().toLocaleString('es-MX'),
    cashier: 'María García',
    waiter: 'Juan Pérez',
    customer: 'Cliente Ejemplo',
    table: '5',
    items: [
      {
        name: 'Hamburguesa Clásica',
        quantity: 2,
        price: '$250.00',
        total: '$500.00',
        modifiers: ['Extra queso', 'Sin cebolla'],
        specialInstructions: 'Término medio'
      },
      {
        name: 'Coca Cola',
        quantity: 2,
        price: '$45.00',
        total: '$90.00',
        modifiers: [],
        specialInstructions: ''
      }
    ],
    subtotal: '$590.00',
    tax: '$94.40',
    discount: '$0.00',
    tip: '$50.00',
    total: '$734.40',
    paymentMethod: 'Efectivo',
    change: '$15.60'
  };

  const updatePrinterStatus = (printerId, newStatus) => {
    setPrinters(prev => prev.map(printer =>
      printer.id === printerId ? { ...printer, status: newStatus } : printer
    ));
  };

  const setDefaultPrinter = (printerId) => {
    setPrinters(prev => prev.map(printer => ({
      ...printer,
      isDefault: printer.id === printerId
    })));
  };

  const testPrint = (printer) => {
    const testData = {
      ...sampleTicketData,
      number: 'TEST001'
    };
    
    const result = printWithBrowserDialog(testData, ticketTemplate);
    
    if (result.success) {
      alert(`Impresión de prueba enviada a ${printer.name}`);
    } else {
      alert(`Error al imprimir en ${printer.name}: ${result.message}`);
    }
  };

  const updateTicketTemplate = (section, field, value) => {
    setTicketTemplate(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateGeneralSetting = (key, value) => {
    setGeneralSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const tabs = [
    { id: 'printers', name: 'Impresoras', icon: '🖨️' },
    { id: 'tickets', name: 'Tickets', icon: '🎫' },
    { id: 'general', name: 'General', icon: '⚙️' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">Administra impresoras, tickets y configuraciones generales</p>
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
          {activeTab === 'printers' && (
            <PrinterConfiguration
              printers={printers}
              onUpdateStatus={updatePrinterStatus}
              onSetDefault={setDefaultPrinter}
              onTestPrint={testPrint}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketConfiguration
              template={ticketTemplate}
              onUpdateTemplate={updateTicketTemplate}
              sampleData={sampleTicketData}
              onShowPreview={() => setShowPreview(true)}
            />
          )}

          {activeTab === 'general' && (
            <GeneralConfiguration
              settings={generalSettings}
              onUpdateSetting={updateGeneralSetting}
            />
          )}
        </div>
      </div>

      {showPreview && (
        <TicketPreviewModal
          template={ticketTemplate}
          sampleData={sampleTicketData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

const PrinterConfiguration = ({ printers, onUpdateStatus, onSetDefault, onTestPrint }) => {
  const [showAddPrinter, setShowAddPrinter] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Configuración de Impresoras</h2>
        <button
          onClick={() => setShowAddPrinter(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Agregar Impresora</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {printers.map(printer => (
          <div key={printer.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span>{printer.name}</span>
                  {printer.isDefault && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Predeterminada
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">{printer.model}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                printer.status === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {printer.status === 'connected' ? 'Conectada' : 'Desconectada'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tipo:</span>
                <span className="capitalize">{printer.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ancho:</span>
                <span>{printer.width}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Conexión:</span>
                <span>{printer.connection}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Puerto:</span>
                <span>{printer.port}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onTestPrint(printer)}
                className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition text-sm"
              >
                Imprimir Prueba
              </button>
              {!printer.isDefault && (
                <button
                  onClick={() => onSetDefault(printer.id)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Predeterminada
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TicketConfiguration = ({ template, onUpdateTemplate, sampleData, onShowPreview }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Configuración de Tickets</h2>
        <button
          onClick={onShowPreview}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Vista Previa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Encabezado del Ticket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  value={template.header.businessName}
                  onChange={(e) => onUpdateTemplate('header', 'businessName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={template.header.address}
                  onChange={(e) => onUpdateTemplate('header', 'address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={template.header.phone}
                  onChange={(e) => onUpdateTemplate('header', 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFC/NIT
                </label>
                <input
                  type="text"
                  value={template.header.rfc}
                  onChange={(e) => onUpdateTemplate('header', 'rfc', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Contenido del Ticket</h3>
            <div className="space-y-3">
              {Object.entries(template.content).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onUpdateTemplate('content', key, e.target.checked)}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Pie del Ticket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje de Agradecimiento
                </label>
                <input
                  type="text"
                  value={template.footer.thankYouMessage}
                  onChange={(e) => onUpdateTemplate('footer', 'thankYouMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Política de Devoluciones
                </label>
                <textarea
                  value={template.footer.returnPolicy}
                  onChange={(e) => onUpdateTemplate('footer', 'returnPolicy', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Información Adicional
                </label>
                <input
                  type="text"
                  value={template.footer.additionalInfo}
                  onChange={(e) => onUpdateTemplate('footer', 'additionalInfo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Formato</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamaño de Fuente
                </label>
                <select
                  value={template.formatting.fontSize}
                  onChange={(e) => onUpdateTemplate('formatting', 'fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="small">Pequeña</option>
                  <option value="normal">Normal</option>
                  <option value="large">Grande</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={template.formatting.showQR}
                    onChange={(e) => onUpdateTemplate('formatting', 'showQR', e.target.checked)}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Mostrar código QR</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={template.formatting.showBarcode}
                    onChange={(e) => onUpdateTemplate('formatting', 'showBarcode', e.target.checked)}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Mostrar código de barras</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GeneralConfiguration = ({ settings, onUpdateSetting }) => {
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSetting('systemLogo', reader.result); // Guarda la imagen como Base64
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuración General</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Información del Sistema</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Sistema
                </label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => onUpdateSetting('systemName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo del Sistema
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {settings.systemLogo && (
                  <div className="mt-2">
                    <img src={settings.systemLogo} alt="Logo del Sistema" className="max-w-[100px] max-h-[100px] object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Configuración Regional</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda Principal
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => onUpdateSetting('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MXN">Peso Mexicano (MXN)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasa de IVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => onUpdateSetting('taxRate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => onUpdateSetting('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Preferencias del Sistema</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Respaldo automático</span>
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => onUpdateSetting('autoBackup', e.target.checked)}
                  className="text-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Sonidos habilitados</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSetting('soundEnabled', e.target.checked)}
                  className="text-indigo-600"
                />
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tema
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => onUpdateSetting('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};

const TicketPreviewModal = ({ template, sampleData, onClose }) => {
  const printPreview = () => {
    printWithBrowserDialog(sampleData, template);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Vista Previa del Ticket</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 font-mono text-sm border-2 border-dashed border-gray-300">
            <div className="text-center mb-4">
              {template.header.logo && (
                <img src={template.header.logo} alt="Logo" className="h-10 object-contain mx-auto mb-2" />
              )}
              {template.header.businessName && (
                <h3 className="font-bold text-lg">{template.header.businessName}</h3>
              )}
              {template.header.address && (
                <p className="text-sm">{template.header.address}</p>
              )}
              {template.header.phone && (
                <p className="text-sm">{template.header.phone}</p>
              )}
              {template.header.rfc && (
                <p className="text-sm">{template.header.rfc}</p>
              )}
            </div>

            <div className="border-t border-gray-400 pt-2 mb-4">
              {template.content.showTicketNumber && (
                <div className="flex justify-between">
                  <span>Ticket:</span>
                  <span>{sampleData.number}</span>
                </div>
              )}
              {template.content.showDate && (
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{sampleData.date}</span>
                </div>
              )}
              {template.content.showCashier && (
                <div className="flex justify-between">
                  <span>Cajero:</span>
                  <span>{sampleData.cashier}</span>
                </div>
              )}
              {template.content.showCustomer && (
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span>{sampleData.customer}</span>
                </div>
              )}
              {template.content.showTable && sampleData.table && (
                <div className="flex justify-between">
                  <span>Mesa:</span>
                  <span>{sampleData.table}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tipo:</span>
                <span>{sampleData.type}</span>
              </div>
            </div>

            <div className="border-t border-gray-400 pt-2 mb-4">
              <div className="font-bold mb-2">PRODUCTOS:</div>
              {sampleData.items.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span>{item.name}</span>
                    <span>{item.total}</span>
                  </div>
                  {template.content.showItemDetails && (
                    <div className="text-xs text-gray-600">
                      {item.quantity} x {item.price}
                    </div>
                  )}
                  {template.content.showModifiers && item.modifiers.length > 0 && (
                    <div className="text-xs text-gray-600">
                      + {item.modifiers.join(', ')}
                    </div>
                  )}
                  {template.content.showSpecialInstructions && item.specialInstructions && (
                    <div className="text-xs text-orange-600">
                      Nota: {item.specialInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-400 pt-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{sampleData.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA:</span>
                <span>{sampleData.tax}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
                <span>TOTAL:</span>
                <span>{sampleData.total}</span>
              </div>
            </div>

            <div className="border-t border-gray-400 pt-2 mt-4">
              <div className="flex justify-between">
                <span>Pago:</span>
                <span>{sampleData.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Cambio:</span>
                <span>{sampleData.change}</span>
              </div>
            </div>

            <div className="text-center mt-4 text-xs">
              {template.footer.thankYouMessage && (
                <p>{template.footer.thankYouMessage}</p>
              )}
              {template.footer.returnPolicy && (
                <p>{template.footer.returnPolicy}</p>
              )}
              {template.footer.additionalInfo && (
                <p>{template.footer.additionalInfo}</p>
              )}
            </div>

            {template.formatting.showQR && (
              <div className="text-center mt-4">
                <div className="w-16 h-16 bg-gray-300 mx-auto rounded">
                  <span className="text-xs">QR</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={printPreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Imprimir Prueba
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationManagement;