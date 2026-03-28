import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LoadingOverlay from '../components/LoadingOverlay';
import { AppProvider } from '../context/AppContext';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingOverlay message="Loading..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
      {isAuthenticated ? (
        <Stack.Screen name="App">
          {() => (
            <AppProvider>
              <AppNavigator />
            </AppProvider>
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
