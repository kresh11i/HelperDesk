import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT token:", e);
    return null;
  }
};

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
    try {
      const response = await api.post('/auth/login', { email, password });
      // The backend returns { status: 200, message: "...", token: "..." }
      if (response.data && response.data.token) {
        const tokenVal = response.data.token;
        const decoded = decodeToken(tokenVal);
        if (decoded) {
          // Normalise name if it is missing in the payload
          const userObj = {
            ...decoded,
            name: decoded.name || email.split('@')[0].toUpperCase()
          };
          setToken(tokenVal);
          setUser(userObj);
          localStorage.setItem('token', tokenVal);
          localStorage.setItem('user', JSON.stringify(userObj));
          return { success: true };
        }
      }
      return { success: false, message: response.data?.message || 'Login failed' };
    } catch (error) {
      console.error("Login request failed:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const register = async (organizationName, name, email, password) => {
    try {
      const response = await api.post('/auth/register', { organizationName, name, email, password });
      // The backend returns { status: 201, message: "...", data: [...] }
      const status = response.status || response.data?.status;
      if (status === 201 || status === 200) {
        return { success: true, message: response.data.message || 'Registration successful' };
      }
      return { success: false, message: response.data?.message || 'Registration failed' };
    } catch (error) {
      console.error("Registration request failed:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Registration failed' 
      };
    }
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
