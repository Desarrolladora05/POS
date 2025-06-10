import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MenuManagement from './components/MenuManagement';
import OrderManagement from './components/OrderManagement';
import TableManagement from './components/TableManagement';
import PaymentManagement from './components/PaymentManagement';
import DeliveryManagement from './components/DeliveryManagement';
import CashRegisterManagement from './components/CashRegisterManagement';
import ConfigurationManagement from './components/ConfigurationManagement';
import DollarRateModal from './components/DollarRateModal'; // Importar el nuevo modal
import { userStorage } from './utils/storage';

const App = () => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const [showDollarRateModal, setShowDollarRateModal] = useState(false); // Estado para el modal del tipo de cambio

  useEffect(() => {
    const savedUser = userStorage.get();
    if (savedUser) {
      setUser(savedUser);
      // Mostrar el modal del tipo de cambio solo si el usuario está logueado
      setShowDollarRateModal(true); 
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
    setShowDollarRateModal(true); // Mostrar el modal después del login
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
    setShowRegister(false);
    setShowDollarRateModal(true); // Mostrar el modal después del registro
  };

  const handleLogout = () => {
    userStorage.remove();
    setUser(null);
    setCurrentView('dashboard');
    setShowRegister(false);
    setShowDollarRateModal(false); // Ocultar el modal al cerrar sesión
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'menu':
        return <MenuManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'tables':
        return <TableManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'delivery':
        return <DeliveryManagement />;
      case 'cashregister':
        return <CashRegisterManagement />;
      case 'configuration':
        return <ConfigurationManagement />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    if (showRegister) {
      return (
        <RegisterForm
          onRegister={handleRegister}
          onShowLogin={() => setShowRegister(false)}
        />
      );
    }
    
    return (
      <LoginForm
        onLogin={handleLogin}
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />
      <div className="flex-1 overflow-auto">
        {renderCurrentView()}
      </div>

      {showDollarRateModal && (
        <DollarRateModal onClose={() => setShowDollarRateModal(false)} />
      )}
    </div>
  );
};

export default App;