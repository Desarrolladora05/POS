const generateId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};

const calculateTotal = (items, taxRate = 0.16) => {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const modifiersTotal = (item.modifiers || []).reduce((modSum, mod) => modSum + (mod.price || 0), 0);
    return sum + itemTotal + (modifiersTotal * item.quantity);
  }, 0);
  
  const tax = subtotal * taxRate;
  return {
    subtotal: subtotal,
    tax: tax,
    total: subtotal + tax
  };
};

const calculateSplitBillTotal = (splitBill, taxRate = 0.16) => {
  const subtotal = splitBill.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const modifiersTotal = (item.modifiers || []).reduce((modSum, mod) => modSum + (mod.price || 0), 0);
    return sum + itemTotal + (modifiersTotal * item.quantity);
  }, 0);
  
  const tax = subtotal * taxRate;
  return {
    subtotal: subtotal,
    tax: tax,
    total: subtotal + tax
  };
};

const searchItems = (items, searchTerm) => {
  if (!searchTerm) return items;
  
  const term = searchTerm.toLowerCase();
  return items.filter(item => 
    item.name.toLowerCase().includes(term) ||
    item.sku.toLowerCase().includes(term) ||
    item.description.toLowerCase().includes(term)
  );
};

// Variable global para el tipo de cambio del dólar
let currentDollarRate = 19.0; // Valor por defecto

const getDollarRate = () => {
  return currentDollarRate;
};

const setDollarRate = (rate) => {
  currentDollarRate = rate;
};

const convertCurrency = (amount, fromCurrency, toCurrency, rate = getDollarRate()) => {
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'MXN' && toCurrency === 'USD') {
    return amount / rate;
  }
  
  if (fromCurrency === 'USD' && toCurrency === 'MXN') {
    return amount * rate;
  }
  
  return amount;
};

const applyDiscount = (amount, discountType, discountValue) => {
  if (discountType === 'percentage') {
    return amount * (discountValue / 100);
  } else if (discountType === 'fixed') {
    return Math.min(discountValue, amount);
  }
  return 0;
};

const generateTicketNumber = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  return `T${timestamp}`;
};

const formatTicketDate = (date) => {
  return new Date(date).toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export { 
  generateId, 
  calculateTotal, 
  calculateSplitBillTotal,
  searchItems, 
  getDollarRate, 
  setDollarRate, // Exportar la función para establecer el tipo de cambio
  convertCurrency,
  applyDiscount,
  generateTicketNumber,
  formatTicketDate
};