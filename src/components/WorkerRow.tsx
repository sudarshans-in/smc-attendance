import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { User, AttendanceRecord } from '../types';
import { useThemeMode } from '../context/ThemeContext';
import { getTheme } from '../constants/theme';
import StatusBadge from './StatusBadge';

interface Props {
  user: User;
  attendance?: AttendanceRecord | null;
  showAttendance?: boolean;
}

function fmtTime(iso?: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function WorkerRow({ user, attendance, showAttendance = false }: Props) {
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);
  const isPresent = showAttendance ? !!attendance?.loginTime : false;

  return (
    <View style={[s.row, { borderBottomColor: t.divider }]}>
      <View style={[s.avatar, { backgroundColor: t.successBg }]}>
        <MaterialCommunityIcons name="account-circle-outline" size={26} color={t.primary} />
      </View>
      <View style={s.info}>
        <Text style={[s.name, { color: t.text }]} numberOfLines={1}>{user.name}</Text>
        <Text style={[s.sub, { color: t.textSub }]}>{user.mobile}</Text>
        {!showAttendance && (
          <Text style={[s.addr, { color: t.textMuted }]} numberOfLines={1}>{user.address}</Text>
        )}
        {showAttendance && isPresent && (
          <Text style={[s.sub, { color: t.textSub }]}>
            In: {fmtTime(attendance?.loginTime)} · Out: {fmtTime(attendance?.logoutTime)}
          </Text>
        )}
      </View>
      {showAttendance && <StatusBadge present={isPresent} />}
    </View>
  );
}

const s = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  info:   { flex: 1, gap: 2 },
  name:   { fontSize: 15, fontWeight: '600' },
  sub:    { fontSize: 13 },
  addr:   { fontSize: 12 },
});
