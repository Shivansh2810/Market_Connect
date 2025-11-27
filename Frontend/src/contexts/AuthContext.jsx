import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../../services/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const validateToken = async (storedToken) => {
    try {
      console.log('Validating token...');
      
      const config = {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      };
      
      let response;
      try {
        response = await api.get('/users/me', config);
      } catch (error) {
        console.log(' /users/me failed, trying fallback...');
        
        response = await api.get('/me', config);
      }
      
      console.log('Token validation response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.data || response.data.user;
        setUser(userData);
        setToken(storedToken);
        setIsAuthenticated(true);
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        return true;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      console.error('Error response:', error.response?.data);
    
      logout();
    }
    return false;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      console.log('🔄 Initializing auth...');
      console.log('Stored token:', storedToken ? 'Exists' : ' Missing');
      console.log('Stored user:', storedUser ? ' Exists' : 'Missing');

      if (storedToken) {
        await validateToken(storedToken);
      } else {
        console.log('No token found, logging out');
        logout();
      }
      
      setLoading(false);
      console.log(' Auth initialization complete');
    };

    initializeAuth();
  }, []);

  const login = (userData, authToken) => {
    console.log('🔑 Login function called:', { userData, hasToken: !!authToken });
    
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
    
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    console.log(' Login successful, user:', userData);
  };

  const logout = () => {
    console.log(' Logging out...');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Remove authorization header
    delete api.defaults.headers.common['Authorization'];
    
    console.log('✅ Logout complete');
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};