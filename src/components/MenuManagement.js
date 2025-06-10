import React, { useState, useEffect } from 'react';
import { products as initialProducts } from '../mock/products';
import { categories as initialCategories } from '../mock/categories';
import { productsStorage, categoriesStorage } from '../utils/storage';
import { formatPrice } from '../utils/formatters';
import { validateRequired, validatePrice } from '../utils/validators';
import { generateId } from '../utils/helpers';

const MenuManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    sku: '',
    pricePesos: '',
    priceDollars: '',
    image: '',
    variants: [],
    modifiers: []
  });

  useEffect(() => {
    const savedProducts = productsStorage.get() || initialProducts;
    const savedCategories = categoriesStorage.get() || initialCategories;
    setProducts(savedProducts);
    setCategories(savedCategories);
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId.toString() === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductSubmit = (e) => {
    e.preventDefault();
    
    if (!validateRequired(productForm.name) || !validateRequired(productForm.sku) ||
        !validatePrice(productForm.pricePesos) || !validatePrice(productForm.priceDollars)) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const productData = {
      ...productForm,
      id: editingProduct ? editingProduct.id : generateId(),
      categoryId: parseInt(productForm.categoryId),
      subcategoryId: parseInt(productForm.subcategoryId),
      pricePesos: parseFloat(productForm.pricePesos),
      priceDollars: parseFloat(productForm.priceDollars)
    };

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? productData : p);
    } else {
      updatedProducts = [...products, productData];
    }

    setProducts(updatedProducts);
    productsStorage.set(updatedProducts);
    resetForm();
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      categoryId: '',
      subcategoryId: '',
      sku: '',
      pricePesos: '',
      priceDollars: '',
      image: '',
      variants: [],
      modifiers: []
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleEdit = (product) => {
    setProductForm({
      ...product,
      categoryId: product.categoryId.toString(),
      subcategoryId: product.subcategoryId.toString(),
      pricePesos: product.pricePesos.toString(),
      priceDollars: product.priceDollars.toString()
    });
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDelete = (productId) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      productsStorage.set(updatedProducts);
    }
  };

  const getSubcategories = (categoryId) => {
    const category = categories.find(c => c.id.toString() === categoryId);
    return category ? category.subcategories : [];
  };

  const handleAddVariant = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, { id: generateId(), name: '', pricePesos: '', priceDollars: '' }]
    }));
  };

  const handleUpdateVariant = (id, field, value) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const handleRemoveVariant = (id) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== id)
    }));
  };

  const handleAddModifier = () => {
    setProductForm(prev => ({
      ...prev,
      modifiers: [...prev.modifiers, { id: generateId(), name: '', price: '' }]
    }));
  };

  const handleUpdateModifier = (id, field, value) => {
    setProductForm(prev => ({
      ...prev,
      modifiers: prev.modifiers.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const handleRemoveModifier = (id) => {
    setProductForm(prev => ({
      ...prev,
      modifiers: prev.modifiers.filter(m => m.id !== id)
    }));
  };

  const handleCsvUpload = (csvData) => {
    const newProducts = [];
    const newCategories = [...categories];
    
    csvData.forEach(row => {
      const categoryName = row.categoria ? row.categoria.trim() : 'Sin Categoría';
      let category = newCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());

      if (!category) {
        const newCategoryId = generateId();
        category = { id: newCategoryId, name: categoryName, description: '', subcategories: [] };
        newCategories.push(category);
      }

      const productData = {
        id: generateId(),
        name: row.nombre || 'Producto sin nombre',
        description: row.descripcion || '',
        categoryId: category.id,
        subcategoryId: category.subcategories.length > 0 ? category.subcategories[0].id : '', // Asignar a la primera subcategoría si existe
        sku: row.sku || `SKU-${generateId().substring(0, 5)}`,
        pricePesos: parseFloat(row.precio) || 0,
        priceDollars: parseFloat(row.precio_dolar) || 0,
        image: row.imagen || '',
        variants: [],
        modifiers: []
      };
      newProducts.push(productData);
    });

    setCategories(newCategories);
    categoriesStorage.set(newCategories);
    
    const updatedProducts = [...products, ...newProducts];
    setProducts(updatedProducts);
    productsStorage.set(updatedProducts);
    
    setShowCsvUpload(false);
    alert('Productos cargados masivamente con éxito!');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Menú</h1>
          <p className="text-gray-600 mt-1">Administra productos, categorías y precios</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCsvUpload(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Cargar CSV</span>
          </button>
          <button
            onClick={() => setShowProductForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar productos por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-48 bg-gray-200">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {product.sku}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{product.description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(product.pricePesos)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatPrice(product.priceDollars, 'USD')}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {product.variants && product.variants.length > 0 && (
                <div className="text-xs text-gray-500">
                  Variantes: {product.variants.length}
                </div>
              )}
              
              {product.modifiers && product.modifiers.length > 0 && (
                <div className="text-xs text-gray-500">
                  Modificadores: {product.modifiers.length}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({...productForm, categoryId: e.target.value, subcategoryId: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id.toString()}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategoría
                    </label>
                    <select
                      value={productForm.subcategoryId}
                      onChange={(e) => setProductForm({...productForm, subcategoryId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={!productForm.categoryId}
                    >
                      <option value="">Seleccionar subcategoría</option>
                      {getSubcategories(productForm.categoryId).map(subcategory => (
                        <option key={subcategory.id} value={subcategory.id.toString()}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio en Pesos
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.pricePesos}
                      onChange={(e) => setProductForm({...productForm, pricePesos: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio en Dólares
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.priceDollars}
                      onChange={(e) => setProductForm({...productForm, priceDollars: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Sección de Variantes */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Variantes</h3>
                  {productForm.variants.map((variant, index) => (
                    <div key={variant.id} className="flex space-x-2 mb-2 items-center">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleUpdateVariant(variant.id, 'name', e.target.value)}
                        placeholder="Nombre de variante (Ej: Chico)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={variant.pricePesos}
                        onChange={(e) => handleUpdateVariant(variant.id, 'pricePesos', e.target.value)}
                        placeholder="Precio MXN"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={variant.priceDollars}
                        onChange={(e) => handleUpdateVariant(variant.id, 'priceDollars', e.target.value)}
                        placeholder="Precio USD"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="mt-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    + Agregar Variante
                  </button>
                </div>

                {/* Sección de Modificadores */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Modificadores</h3>
                  {productForm.modifiers.map((modifier, index) => (
                    <div key={modifier.id} className="flex space-x-2 mb-2 items-center">
                      <input
                        type="text"
                        value={modifier.name}
                        onChange={(e) => handleUpdateModifier(modifier.id, 'name', e.target.value)}
                        placeholder="Nombre de modificador (Ej: Sin cebolla)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={modifier.price}
                        onChange={(e) => handleUpdateModifier(modifier.id, 'price', e.target.value)}
                        placeholder="Costo adicional"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveModifier(modifier.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddModifier}
                    className="mt-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    + Agregar Modificador
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={productForm.image}
                    onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    {editingProduct ? 'Actualizar' : 'Crear'} Producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showCsvUpload && (
        <CsvUploadModal
          onClose={() => setShowCsvUpload(false)}
          onUpload={handleCsvUpload}
        />
      )}
    </div>
  );
};

const CsvUploadModal = ({ onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleProcessCsv = () => {
    if (!file) {
      setError('Por favor, selecciona un archivo CSV.');
      return;
    }

    if (file.type !== 'text/csv') {
      setError('El archivo debe ser de tipo CSV.');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      try {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
          setError('El archivo CSV está vacío.');
          setLoading(false);
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['nombre', 'categoria', 'precio']; // Nombres en español
        const optionalHeaders = ['precio_dolar', 'sku', 'descripcion', 'imagen']; // Opcionales en español

        const missingRequiredHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingRequiredHeaders.length > 0) {
          setError(`Faltan las siguientes columnas requeridas: ${missingRequiredHeaders.join(', ')}`);
          setLoading(false);
          return;
        }

        const result = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index];
          });
          result.push(rowData);
        }
        onUpload(result);
      } catch (parseError) {
        setError('Error al procesar el archivo CSV. Asegúrate de que el formato sea correcto.');
        console.error(parseError);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Cargar Productos desde CSV</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona un archivo CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <p className="text-sm text-gray-600">
              El archivo CSV debe contener las columnas: <span className="font-semibold">nombre, categoría, precio</span>.
              Opcionales: <span className="font-semibold">precio_dolar, sku, descripción, imagen</span>.
            </p>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleProcessCsv}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Cargar Productos'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;