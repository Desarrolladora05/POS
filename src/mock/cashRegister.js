const cashMovements = [
  {
    id: 1,
    type: 'opening',
    amount: 1000,
    description: 'Apertura de caja',
    cashier: 'María García',
    timestamp: new Date('2024-01-15T08:00:00').toISOString(),
    orderId: null,
    paymentMethod: 'cash'
  },
  {
    id: 2,
    type: 'sale',
    amount: 250,
    description: 'Venta - Orden #12345',
    cashier: 'María García',
    timestamp: new Date('2024-01-15T09:30:00').toISOString(),
    orderId: '12345',
    paymentMethod: 'cash'
  },
  {
    id: 3,
    type: 'expense',
    amount: -50,
    description: 'Compra de ingredientes',
    cashier: 'María García',
    timestamp: new Date('2024-01-15T11:15:00').toISOString(),
    orderId: null,
    paymentMethod: 'cash'
  },
  {
    id: 4,
    type: 'sale',
    amount: 180,
    description: 'Venta - Orden #12346',
    cashier: 'María García',
    timestamp: new Date('2024-01-15T12:45:00').toISOString(),
    orderId: '12346',
    paymentMethod: 'cash'
  }
];

const cashClosures = [
  {
    id: 1,
    date: '2024-01-14',
    cashier: 'Juan Pérez',
    openingAmount: 1000,
    totalSales: 2500,
    totalExpenses: 150,
    expectedAmount: 3350,
    actualAmount: 3340,
    difference: -10,
    status: 'closed',
    closedAt: new Date('2024-01-14T22:00:00').toISOString(),
    movements: 45
  }
];

export { cashMovements, cashClosures };