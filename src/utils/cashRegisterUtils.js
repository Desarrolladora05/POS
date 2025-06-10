const calculateCashSummary = (movements) => {
  const summary = {
    opening: 0,
    sales: 0,
    expenses: 0,
    deposits: 0,
    withdrawals: 0,
    total: 0
  };

  movements.forEach(movement => {
    switch (movement.type) {
      case 'opening':
        summary.opening += movement.amount;
        break;
      case 'sale':
        summary.sales += movement.amount;
        break;
      case 'expense':
        summary.expenses += Math.abs(movement.amount);
        break;
      case 'deposit':
        summary.deposits += movement.amount;
        break;
      case 'withdrawal':
        summary.withdrawals += Math.abs(movement.amount);
        break;
    }
  });

  summary.total = summary.opening + summary.sales + summary.deposits - summary.expenses - summary.withdrawals;
  
  return summary;
};

const generateCashReport = (movements, startDate, endDate) => {
  const filteredMovements = movements.filter(movement => {
    const movementDate = new Date(movement.timestamp);
    return movementDate >= startDate && movementDate <= endDate;
  });

  const summary = calculateCashSummary(filteredMovements);
  
  return {
    movements: filteredMovements,
    summary,
    period: {
      start: startDate,
      end: endDate
    },
    generatedAt: new Date().toISOString()
  };
};

const validateCashClosure = (expectedAmount, actualAmount, tolerance = 10) => {
  const difference = actualAmount - expectedAmount;
  const isValid = Math.abs(difference) <= tolerance;
  
  return {
    isValid,
    difference,
    tolerance,
    status: isValid ? 'balanced' : (difference > 0 ? 'surplus' : 'shortage')
  };
};

const formatCashMovementType = (type) => {
  const types = {
    opening: 'Apertura',
    sale: 'Venta',
    expense: 'Gasto',
    deposit: 'Depósito',
    withdrawal: 'Retiro',
    closing: 'Cierre'
  };
  
  return types[type] || type;
};

export { 
  calculateCashSummary, 
  generateCashReport, 
  validateCashClosure, 
  formatCashMovementType 
};