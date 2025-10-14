import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { loadUser, checkInitialAuth } from '../redux/actions/userActions';
import { useAuth } from '../hooks/useAuth';
import TabNavigation from './(tabs)/tabs';
import StepOnboardingScreen from '../components/Onboarding/StepOnboardingScreen';
import Login from './(auth)/login';

const Stack = createNativeStackNavigator();

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated, loading, isOnboardingCompleted } = useAuth();

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
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [dispatch, isAuthenticated]);

  const handleOnboardingComplete = async () => {
    try {
      // Onboarding completed, no need to save to AsyncStorage
      // The backend will handle the completion status
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };


  if (isLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      ) : !isOnboardingCompleted ? (
        <Stack.Screen 
          name="Onboarding" 
          options={{ headerShown: false }}
        >
          {() => <StepOnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="(tabs)/tabs" component={TabNavigation} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
};

export default Index;
