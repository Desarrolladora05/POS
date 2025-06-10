const categories = [
  {
    id: 1,
    name: 'Entradas',
    description: 'Aperitivos y entradas',
    subcategories: [
      { id: 1, name: 'Ensaladas', categoryId: 1 },
      { id: 2, name: 'Sopas', categoryId: 1 },
      { id: 3, name: 'Aperitivos', categoryId: 1 }
    ]
  },
  {
    id: 2,
    name: 'Platos Principales',
    description: 'Platos fuertes',
    subcategories: [
      { id: 4, name: 'Carnes', categoryId: 2 },
      { id: 5, name: 'Pescados', categoryId: 2 },
      { id: 6, name: 'Vegetarianos', categoryId: 2 }
    ]
  },
  {
    id: 3,
    name: 'Bebidas',
    description: 'Bebidas frías y calientes',
    subcategories: [
      { id: 7, name: 'Gaseosas', categoryId: 3 },
      { id: 8, name: 'Jugos', categoryId: 3 },
      { id: 9, name: 'Café', categoryId: 3 },
      { id: 10, name: 'Vinos', categoryId: 3 }
    ]
  },
  {
    id: 4,
    name: 'Postres',
    description: 'Dulces y postres',
    subcategories: [
      { id: 11, name: 'Helados', categoryId: 4 },
      { id: 12, name: 'Pasteles', categoryId: 4 },
      { id: 13, name: 'Frutas', categoryId: 4 }
    ]
  }
];

export { categories };