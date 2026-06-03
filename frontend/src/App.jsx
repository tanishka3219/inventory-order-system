import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Login from './pages/Login';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CustomerProvider } from './context/CustomerContext';
import { OrderProvider } from './context/OrderContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-dark-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProductProvider>
          <CustomerProvider>
            <OrderProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/orders" element={<Orders />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
              <ToastContainer position="bottom-right" />
            </OrderProvider>
          </CustomerProvider>
        </ProductProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
