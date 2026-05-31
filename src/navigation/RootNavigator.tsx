import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { getTheme } from '../constants/theme';
import { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LoadingOverlay from '../components/LoadingOverlay';
import { AppProvider } from '../context/AppContext';

const Stack = createStackNavigator<RootStackParamList>();

function LockScreen() {
  const { unlock, logout } = useAuth();
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);
  const [unlocking, setUnlocking] = React.useState(false);

  const handleUnlock = async () => {
    setUnlocking(true);
    await unlock();
    setUnlocking(false);
  };

  return (
    <SafeAreaView style={[ls.root, { backgroundColor: t.primaryDark }]}>
      <View style={ls.content}>
        <View style={[ls.iconBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <MaterialCommunityIcons name="lock-outline" size={48} color="#fff" />
        </View>
        <Text style={ls.title}>App Locked</Text>
        <Text style={ls.sub}>Verify your identity to continue</Text>

        <TouchableOpacity
          style={[ls.btn, { backgroundColor: t.accent }]}
          onPress={handleUnlock}
          disabled={unlocking}
          activeOpacity={0.85}
          accessibilityLabel="Unlock with biometric or PIN"
        >
          {unlocking
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialCommunityIcons name="fingerprint" size={22} color="#fff" />
                <Text style={ls.btnText}>Unlock</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={logout} style={ls.logoutLink} activeOpacity={0.7}>
          <Text style={ls.logoutText}>Sign out instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  root:      { flex: 1, justifyContent: 'center' },
  content:   { alignItems: 'center', padding: 32, gap: 16 },
  iconBadge: { width: 96, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title:     { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub:       { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  btn:       { flexDirection: 'row', alignItems: 'center', gap: 10, height: 56, paddingHorizontal: 32, borderRadius: 14, marginTop: 16 },
  btnText:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  logoutLink:{ marginTop: 8, padding: 12 },
  logoutText:{ fontSize: 14, color: 'rgba(255,255,255,0.5)' },
});

export default function RootNavigator() {
  const { isLoading, isAuthenticated, isLocked } = useAuth();

  if (isLoading) return <LoadingOverlay message="Loading..." />;
  if (isAuthenticated && isLocked) return <LockScreen />;

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
