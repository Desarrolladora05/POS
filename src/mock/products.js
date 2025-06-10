const products = [
  {
    id: 1,
    name: 'Ensalada César',
    description: 'Lechuga romana, crutones, queso parmesano',
    categoryId: 1,
    subcategoryId: 1,
    sku: 'ENS001',
    pricePesos: 180, // Precio base, puede ser ignorado si hay variantes
    priceDollars: 9.5, // Precio base, puede ser ignorado si hay variantes
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300',
    variants: [
      { id: 1, name: 'Pequeña', pricePesos: 150, priceDollars: 8 },
      { id: 2, name: 'Mediana', pricePesos: 180, priceDollars: 9.5 },
      { id: 3, name: 'Grande', pricePesos: 220, priceDollars: 11.5 }
    ],
    modifiers: [
      { id: 1, name: 'Sin crutones', price: 0 },
      { id: 2, name: 'Extra queso', price: 25 },
      { id: 3, name: 'Con pollo', price: 45 }
    ]
  },
  {
    id: 2,
    name: 'Hamburguesa Clásica',
    description: 'Carne de res, lechuga, tomate, cebolla',
    categoryId: 2,
    subcategoryId: 4,
    sku: 'HAM001',
    pricePesos: 250,
    priceDollars: 13,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300',
    variants: [
      { id: 4, name: 'Simple', pricePesos: 220, priceDollars: 11.5 },
      { id: 5, name: 'Doble carne', pricePesos: 320, priceDollars: 16.8 }
    ],
    modifiers: [
      { id: 4, name: 'Sin cebolla', price: 0 },
      { id: 5, name: 'Extra queso', price: 30 },
      { id: 6, name: 'Con tocino', price: 40 }
    ]
  },
  {
    id: 3,
    name: 'Coca Cola',
    description: 'Refresco de cola',
    categoryId: 3,
    subcategoryId: 7,
    sku: 'BEB001',
    pricePesos: 45,
    priceDollars: 2.4,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300',
    variants: [
      { id: 6, name: '355ml', pricePesos: 45, priceDollars: 2.4 },
      { id: 7, name: '600ml', pricePesos: 65, priceDollars: 3.4 }
    ],
    modifiers: []
  },
  {
    id: 4,
    name: 'Tiramisú',
    description: 'Postre italiano con café y mascarpone',
    categoryId: 4,
    subcategoryId: 12,
    sku: 'POS001',
    pricePesos: 120,
    priceDollars: 6.3,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300',
    variants: [],
    modifiers: [
      { id: 7, name: 'Con helado', price: 35 },
      { id: 8, name: 'Sin café', price: 0 }
    ]
  },
  {
    id: 5,
    name: 'Pizza Margherita',
    description: 'Salsa de tomate, mozzarella, albahaca',
    categoryId: 2,
    subcategoryId: 4,
    sku: 'PIZ001',
    pricePesos: 280,
    priceDollars: 14.7,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300',
    variants: [
      { id: 8, name: 'Personal', pricePesos: 180, priceDollars: 9.5 },
      { id: 9, name: 'Mediana', pricePesos: 280, priceDollars: 14.7 },
      { id: 10, name: 'Familiar', pricePesos: 380, priceDollars: 20 }
    ],
    modifiers: [
      { id: 9, name: 'Extra queso', price: 40 },
      { id: 10, name: 'Pepperoni', price: 50 },
      { id: 11, name: 'Champiñones', price: 35 }
    ]
  },
  {
    id: 6,
    name: 'Tacos al Pastor',
    description: 'Carne al pastor, piña, cebolla, cilantro',
    categoryId: 2,
    subcategoryId: 4,
    sku: 'TAC001',
    pricePesos: 15,
    priceDollars: 0.8,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300',
    variants: [
      { id: 11, name: 'Orden (3 piezas)', pricePesos: 45, priceDollars: 2.4 },
      { id: 12, name: 'Media orden (6 piezas)', pricePesos: 85, priceDollars: 4.5 },
      { id: 13, name: 'Orden completa (12 piezas)', pricePesos: 160, priceDollars: 8.4 }
    ],
    modifiers: [
      { id: 12, name: 'Sin piña', price: 0 },
      { id: 13, name: 'Extra salsa', price: 5 },
      { id: 14, name: 'Con queso', price: 10 }
    ]
  }
];

export { products };