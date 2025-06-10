const orders = [
  {
    id: 1,
    tableId: 2,
    type: 'dine-in',
    status: 'active',
    waiter: 'Juan Pérez',
    customer: 'Mesa 2',
    splitBills: [
      {
        id: 1,
        customerName: 'Persona 1',
        items: [
          {
            id: 1,
            productId: 1,
            name: 'Ensalada César',
            quantity: 1,
            price: 180,
            variant: 'Grande',
            modifiers: ['Extra queso'],
            specialInstructions: 'Sin crutones por favor'
          }
        ]
      },
      {
        id: 2,
        customerName: 'Persona 2',
        items: [
          {
            id: 2,
            productId: 2,
            name: 'Hamburguesa Clásica',
            quantity: 1,
            price: 250,
            variant: 'Simple',
            modifiers: ['Sin cebolla'],
            specialInstructions: 'Término medio'
          }
        ]
      }
    ],
    items: [
      {
        id: 1,
        productId: 1,
        name: 'Ensalada César',
        quantity: 1,
        price: 180,
        variant: 'Grande',
        modifiers: ['Extra queso'],
        specialInstructions: 'Sin crutones por favor',
        assignedTo: 1
      },
      {
        id: 2,
        productId: 2,
        name: 'Hamburguesa Clásica',
        quantity: 1,
        price: 250,
        variant: 'Simple',
        modifiers: ['Sin cebolla'],
        specialInstructions: 'Término medio',
        assignedTo: 2
      }
    ],
    subtotal: 430,
    tax: 68.8,
    tip: 50,
    total: 548.8,
    paymentMethod: null,
    createdAt: new Date().toISOString(),
    discounts: [],
    promotions: []
  }
];

export { orders };