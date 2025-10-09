import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { loadUser } from '../redux/actions/userActions';
import TabNavigation from './(tabs)/tabs';

const Stack = createNativeStackNavigator();

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: any) => state.user);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          setHasToken(true);
          await dispatch(loadUser() as any);
        }
      } catch (error) {
        console.error('Error checking token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {(isAuthenticated || hasToken) ? (
        <Stack.Screen name="(tabs)/tabs" component={TabNavigation} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(tabs)/tabs" component={TabNavigation} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
};

export default Index;
