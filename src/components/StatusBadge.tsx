import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeMode } from '../context/ThemeContext';
import { getTheme } from '../constants/theme';
import { Strings } from '../constants/strings';

interface Props { present: boolean; }

export default function StatusBadge({ present }: Props) {
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);
  return (
    <View style={[s.badge, { backgroundColor: present ? t.successBg : t.errorBg, borderColor: present ? '#A3CFBB' : '#F1AEB5' }]}
      accessibilityLabel={present ? Strings.present : Strings.absent}>
      <Text style={[s.text, { color: present ? t.successText : t.error }]}>
        {present ? Strings.present : Strings.absent}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  text:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
