// hooks/useAuth.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify token with backend
        const res = await axios.get('/verify-token', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoles(res.data.roles);
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRoles');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [navigate]);

  const hasRole = (requiredRoles) => {
    return requiredRoles.some(role => roles.includes(role));
  };

  return { roles, hasRole, loading };
}