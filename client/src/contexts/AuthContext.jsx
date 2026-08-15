import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Decode user from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // MOCK LOGIN FOR UI TESTING
    return new Promise((resolve) => {
      setTimeout(() => {
        const dummyToken = "mock_jwt_token_123";
        const dummyUser = { 
          user_id: "u_1", 
          org_id: "org_1", 
          role: 1, 
          email: email, 
          name: email.split('@')[0].toUpperCase() 
        };
        
        setToken(dummyToken);
        setUser(dummyUser);
        localStorage.setItem('token', dummyToken);
        localStorage.setItem('user', JSON.stringify(dummyUser));
        resolve({ success: true });
      }, 1000); // simulate 1s network delay
    });
  };

  const register = async (organizationName, name, email, password) => {
    // MOCK REGISTER FOR UI TESTING
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
