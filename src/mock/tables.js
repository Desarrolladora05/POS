const tables = [
  {
    id: 1,
    number: 1,
    seats: 4,
    status: 'available',
    waiter: null,
    customer: null,
    order: null,
    position: { x: 50, y: 50 }
  },
  // Mesa 2 eliminada
  {
    id: 3,
    number: 3,
    seats: 6,
    status: 'reserved',
    waiter: null,
    customer: 'Reserva García',
    order: null,
    position: { x: 350, y: 50 }
  },
  {
    id: 4,
    number: 4,
    seats: 4,
    status: 'available',
    waiter: null,
    customer: null,
    order: null,
    position: { x: 50, y: 200 }
  },
  {
    id: 5,
    number: 5,
    seats: 8,
    status: 'occupied',
    waiter: 'María García',
    customer: 'Mesa 5',
    order: { id: 2, items: [], total: 0 },
    position: { x: 200, y: 200 }
  },
  {
    id: 6,
    number: 6,
    seats: 2,
    status: 'available',
    waiter: null,
    customer: null,
    order: null,
    position: { x: 350, y: 200 }
  }
];

export { tables };