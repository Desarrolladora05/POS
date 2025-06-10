const createStorage = (key, defaultValue = null) => {
  const get = () => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const set = (value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      return false;
    }
  };

  const remove = () => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  };

  return { get, set, remove };
};

const userStorage = createStorage('pos_user');
const tablesStorage = createStorage('pos_tables');
const ordersStorage = createStorage('pos_orders');
const productsStorage = createStorage('pos_products');
const categoriesStorage = createStorage('pos_categories');
const printersStorage = createStorage('pos_printers');
const ticketTemplateStorage = createStorage('pos_ticket_template');
const generalSettingsStorage = createStorage('pos_general_settings');

export { 
  createStorage, 
  userStorage, 
  tablesStorage, 
  ordersStorage, 
  productsStorage, 
  categoriesStorage,
  printersStorage,
  ticketTemplateStorage,
  generalSettingsStorage
};