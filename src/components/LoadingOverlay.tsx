import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useThemeMode } from '../context/ThemeContext';
import { getTheme } from '../constants/theme';

interface Props { message?: string; }

export default function LoadingOverlay({ message = 'Loading...' }: Props) {
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);
  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={t.primary} />
      <Text style={[s.msg, { color: t.textSub }]}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  msg:  { fontSize: 16 },
});
