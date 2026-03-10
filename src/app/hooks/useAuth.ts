import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const publicRoutes = ['/', '/signup'];
      const candidateRoutes = ['/test/'];
      
      // Check if current route is a candidate test route
      const isCandidateRoute = candidateRoutes.some(route => 
        location.pathname.startsWith(route)
      );
      
      // Skip auth check for public routes
      if (publicRoutes.includes(location.pathname) || isCandidateRoute) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          // No valid session, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_email');
          navigate('/');
        } else {
          // Update token in localStorage
          localStorage.setItem('access_token', session.access_token);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [location.pathname, navigate]);

  return {
    isAuthenticated: !!localStorage.getItem('access_token'),
    isChecking,
  };
}