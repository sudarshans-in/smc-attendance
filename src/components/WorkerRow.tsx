import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { User, AttendanceRecord } from '../types';
import { Colors } from '../constants/colors';
import StatusBadge from './StatusBadge';

interface Props {
  user: User;
  attendance?: AttendanceRecord | null;
  showAttendance?: boolean;
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function WorkerRow({ user, attendance, showAttendance = false }: Props) {
  const isPresent = showAttendance ? !!attendance?.loginTime : false;

  return (
    <View style={styles.row}>
      <View style={styles.avatarContainer}>
        <MaterialCommunityIcons name="account-circle" size={40} color={Colors.primary} />
      </View>
      <View style={styles.info}>
        <Text variant="bodyLarge" style={styles.name} numberOfLines={1}>
          {user.name}
        </Text>
        <Text variant="bodySmall" style={styles.mobile}>
          {user.mobile}
        </Text>
        {!showAttendance && (
          <Text variant="bodySmall" style={styles.address} numberOfLines={1}>
            {user.address}
          </Text>
        )}
        {showAttendance && isPresent && (
          <Text variant="bodySmall" style={styles.times}>
            In: {formatTime(attendance?.loginTime)} · Out: {formatTime(attendance?.logoutTime)}
          </Text>
        )}
      </View>
      {showAttendance && (
        <StatusBadge present={isPresent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
    color: Colors.onSurface,
  },
  mobile: {
    color: Colors.onSurfaceVariant,
  },
  address: {
    color: Colors.onSurfaceVariant,
  },
  times: {
    color: Colors.onSurfaceVariant,
  },
});
