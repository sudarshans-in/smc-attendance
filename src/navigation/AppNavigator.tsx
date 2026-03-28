import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppTabParamList } from '../types';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/home/HomeScreen';
import UploadScreen from '../screens/upload/UploadScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import AdminScreen from '../screens/admin/AdminScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

type IconName = string;

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Upload: { active: 'camera', inactive: 'camera-outline' },
  History: { active: 'clock', inactive: 'clock-outline' },
  Admin: { active: 'account-group', inactive: 'account-group-outline' },
};

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.outlineVariant,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Upload" component={UploadScreen} options={{ tabBarLabel: 'Upload' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History' }} />
      {user?.isAdmin && (
        <Tab.Screen name="Admin" component={AdminScreen} options={{ tabBarLabel: 'Admin' }} />
      )}
    </Tab.Navigator>
  );
}
