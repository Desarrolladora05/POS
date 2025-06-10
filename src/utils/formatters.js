const formatPrice = (price, currency = 'MXN') => {
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    return 'N/A'; // O cualquier otro valor por defecto para indicar un precio inválido
  }

  if (currency === 'USD') {
    return `$${numericPrice.toFixed(2)} USD`;
  }
  return `$${numericPrice.toFixed(2)} MXN`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTableStatus = (status) => {
  const statusMap = {
    available: 'Disponible',
    occupied: 'Ocupada',
    reserved: 'Reservada'
  };
  return statusMap[status] || status;
};

const formatOrderType = (type) => {
  const typeMap = {
    'dine-in': 'En mesa',
    'takeout': 'Para llevar',
    'delivery': 'Domicilio'
  };
  return typeMap[type] || type;
};

export { formatPrice, formatDate, formatTableStatus, formatOrderType };