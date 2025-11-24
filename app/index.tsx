import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { loadUser, checkInitialAuth } from '../redux/actions/userActions';
import { useAuth } from '../hooks/useAuth';
import TabNavigation from './(tabs)/tabs';
import Login from './(auth)/login';

const Stack = createNativeStackNavigator();

const Index = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check initial authentication status first
        await dispatch(checkInitialAuth() as any);
        
        // If user is authenticated, load user data to check onboarding status
        if (isAuthenticated) {
          await dispatch(loadUser() as any);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, [dispatch, isAuthenticated]);

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(tabs)/tabs" component={TabNavigation} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
};

export default Index;
