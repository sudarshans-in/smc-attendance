import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTabParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { getTheme } from '../constants/theme';
import HomeScreen from '../screens/home/HomeScreen';
import UploadScreen from '../screens/upload/UploadScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import AdminScreen from '../screens/admin/AdminScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

const TABS: Record<string, { active: string; inactive: string; label: string }> = {
  Home:    { active: 'home',          inactive: 'home-outline',         label: 'Home' },
  Upload:  { active: 'camera',        inactive: 'camera-outline',       label: 'Upload' },
  History: { active: 'clock',         inactive: 'clock-outline',        label: 'History' },
  Admin:   { active: 'account-group', inactive: 'account-group-outline', label: 'Admin' },
};

export default function AppNavigator() {
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const tab = TABS[route.name];
          return (
            <View style={[styles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(63,185,80,0.15)' : '#DCFCE7' }]}>
              <MaterialCommunityIcons
                name={focused ? tab.active : tab.inactive}
                size={22}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}    options={{ tabBarLabel: TABS.Home.label }} />
      <Tab.Screen name="Upload"  component={UploadScreen}  options={{ tabBarLabel: TABS.Upload.label }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: TABS.History.label }} />
      {user?.isAdmin && (
        <Tab.Screen name="Admin" component={AdminScreen}   options={{ tabBarLabel: TABS.Admin.label }} />
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
