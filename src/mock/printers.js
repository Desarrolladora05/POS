const printers = [
  {
    id: 1,
    name: 'Impresora Térmica Principal',
    type: 'thermal',
    width: '80mm',
    connection: 'USB',
    port: 'USB001',
    status: 'connected',
    model: 'Epson TM-T20III',
    isDefault: true
  },
  {
    id: 2,
    name: 'Impresora Cocina',
    type: 'thermal',
    width: '58mm',
    connection: 'Network',
    port: '192.168.1.100',
    status: 'connected',
    model: 'Star TSP143III',
    isDefault: false
  },
  {
    id: 3,
    name: 'Impresora Backup',
    type: 'thermal',
    width: '80mm',
    connection: 'Serial',
    port: 'COM1',
    status: 'disconnected',
    model: 'Bixolon SRP-350III',
    isDefault: false
  }
];

const ticketTemplate = {
  header: {
    businessName: 'RESTAURANTE POS',
    address: 'Calle Principal #123, Centro',
    phone: 'Tel: (555) 123-4567',
    email: 'info@restaurantepos.com',
    rfc: 'RFC: ABC123456789',
    logo: null
  },
  content: {
    showTicketNumber: true,
    showDate: true,
    showCashier: true,
    showWaiter: true,
    showCustomer: true,
    showTable: true,
    showItemDetails: true,
    showModifiers: true,
    showSpecialInstructions: true
  },
  footer: {
    thankYouMessage: '¡Gracias por su preferencia!',
    returnPolicy: 'Cambios y devoluciones: 7 días con ticket',
    additionalInfo: 'Conserve su ticket como comprobante',
    website: 'www.restaurantepos.com',
    socialMedia: '@RestaurantePOS'
  },
  formatting: {
    fontSize: 'normal',
    alignment: 'center',
    showBorders: true,
    showQR: false,
    showBarcode: false,
    language: 'es'
  }
};

const generalSettings = {
  systemName: 'RestaurantePOS', // Nuevo campo para el nombre del sistema
  systemLogo: null, // Nuevo campo para el logo del sistema (base64)
  currency: 'MXN',
  taxRate: 16,
  language: 'es',
  timezone: 'America/Mexico_City',
  autoBackup: true,
  soundEnabled: true,
  theme: 'light'
};

export { printers, ticketTemplate, generalSettings };