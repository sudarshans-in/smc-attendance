import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';

interface Props {
  attendance: AttendanceRecord | null;
  status: AttendanceStatus;
  onMarkLogin: () => void;
  onMarkLogout: () => void;
  loading: boolean;
}

function formatTime(iso: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function AttendanceCard({ attendance, status, onMarkLogin, onMarkLogout, loading }: Props) {
  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={24} color={Colors.primary} />
          <Text variant="titleMedium" style={styles.headerText}>
            {Strings.attendanceStatus}
          </Text>
          {status !== 'not_started' && (
            <Chip
              mode="flat"
              style={[styles.statusChip, status === 'completed' ? styles.chipCompleted : styles.chipActive]}
              textStyle={styles.chipText}
              compact
            >
              {status === 'completed' ? Strings.attendanceComplete : Strings.attendanceLoginDone}
            </Chip>
          )}
        </View>

        {(status === 'logged_in' || status === 'completed') && (
          <>
            <View style={styles.photoRow}>
              <View style={styles.photoBlock}>
                <Text variant="bodySmall" style={styles.photoLabel}>
                  <MaterialCommunityIcons name="login" size={12} color={Colors.success} /> Check-in
                </Text>
                {attendance?.loginPhotoUri ? (
                  <Image
                    source={{ uri: attendance.loginPhotoUri }}
                    style={styles.attendancePhoto}
                    accessibilityLabel="Check-in photo"
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.attendancePhoto, styles.photoPlaceholder]} />
                )}
              </View>
              <View style={styles.photoBlock}>
                <Text variant="bodySmall" style={styles.photoLabel}>
                  <MaterialCommunityIcons name="logout" size={12} color={Colors.warning} /> Check-out
                </Text>
                {attendance?.logoutPhotoUri ? (
                  <Image
                    source={{ uri: attendance.logoutPhotoUri }}
                    style={styles.attendancePhoto}
                    accessibilityLabel="Check-out photo"
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.attendancePhoto, styles.photoPlaceholder]} />
                )}
              </View>
            </View>
            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <MaterialCommunityIcons name="login" size={20} color={Colors.success} />
                <Text variant="bodySmall" style={styles.timeLabel}>{Strings.loginTime}</Text>
                <Text variant="titleMedium" style={styles.timeValue}>
                  {formatTime(attendance?.loginTime ?? null)}
                </Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeBlock}>
                <MaterialCommunityIcons name="logout" size={20} color={Colors.warning} />
                <Text variant="bodySmall" style={styles.timeLabel}>{Strings.logoutTime}</Text>
                <Text variant="titleMedium" style={styles.timeValue}>
                  {formatTime(attendance?.logoutTime ?? null)}
                </Text>
              </View>
            </View>
          </>
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text variant="bodyMedium" style={styles.loadingText}>{Strings.fetchingLocation}</Text>
          </View>
        )}

        {!loading && status === 'not_started' && (
          <Button
            mode="contained"
            onPress={onMarkLogin}
            style={[styles.actionButton, { backgroundColor: Colors.success }]}
            contentStyle={styles.actionButtonContent}
            labelStyle={styles.actionButtonLabel}
            icon="map-marker-check"
            accessibilityLabel={Strings.markAttendance}
          >
            {Strings.markAttendance}
          </Button>
        )}

        {!loading && status === 'logged_in' && (
          <Button
            mode="contained"
            onPress={onMarkLogout}
            style={[styles.actionButton, { backgroundColor: Colors.warning }]}
            contentStyle={styles.actionButtonContent}
            labelStyle={styles.actionButtonLabel}
            icon="map-marker-minus"
            accessibilityLabel={Strings.markLogout}
          >
            {Strings.markLogout}
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerText: {
    flex: 1,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  statusChip: {
    height: 28,
  },
  chipActive: {
    backgroundColor: Colors.successContainer,
  },
  chipCompleted: {
    backgroundColor: Colors.primaryContainer,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  timeDivider: {
    width: 1,
    backgroundColor: Colors.outlineVariant,
    marginHorizontal: 8,
  },
  timeLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  timeValue: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingText: {
    color: Colors.onSurfaceVariant,
  },
  actionButton: {
    borderRadius: 8,
  },
  actionButtonContent: {
    height: 56,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  photoBlock: {
    flex: 1,
    gap: 4,
  },
  photoLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  attendancePhoto: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  photoPlaceholder: {
    backgroundColor: Colors.surfaceVariant,
  },
});
