import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Sync user info on boot if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Auth verification failed", err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // We use the JSON login route since it's cleaner for React forms
      const res = await api.post('/api/auth/login-json', { email, password });
      const accessToken = res.data.access_token;
      
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      
      // Fetch user profile immediately
      const profileRes = await api.get('/api/auth/me');
      setUser(profileRes.data);
      setLoading(false);
      return profileRes.data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (email, password, fullName, role = "staff") => {
    try {
      const res = await api.post('/api/auth/register', {
        email,
        password,
        full_name: fullName,
        role,
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (allowedRoles) => {
    return user && allowedRoles.includes(user.role);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isStaff: user?.role === 'staff',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
