import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { loadUser, checkInitialAuth } from '../redux/actions/userActions';
import { useAuth } from '../hooks/useAuth';

const Index = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      if (isInitialized) return; // Prevent multiple initializations
      
      try {
        // Check initial authentication status first
        const authResult = await dispatch(checkInitialAuth() as any);
        
        // If user is authenticated, load user data to check onboarding status
        if (authResult.payload?.isAuthenticated) {
          const loadUserResult = await dispatch(loadUser() as any);
          // If loadUser fails (404 or other error), redirect to login
          if (loadUser.rejected.match(loadUserResult)) {
            router.replace("/(auth)/login");
          } else {
            // Redirect to tabs on initial load if authenticated
            router.replace("/(tabs)/tabs");
          }
        } else {
          // Redirect to login if not authenticated
          router.replace("/(auth)/login");
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        router.replace("/(auth)/login");
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [dispatch, router]);

  // Show nothing while initializing or redirecting
  return null;
};

export default Index;
