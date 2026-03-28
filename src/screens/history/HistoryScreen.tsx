import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Appbar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import { Strings } from '../../constants/strings';
import { Colors } from '../../constants/colors';
import { AttendanceRecord, WorkPhoto } from '../../types';
import PhotoCard from '../../components/PhotoCard';

type TabValue = 'photos' | 'attendance';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string | null): string {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function AttendanceItem({ record }: { record: AttendanceRecord }) {
  const isToday = record.date === new Date().toISOString().split('T')[0];
  return (
    <View style={[attStyles.row, isToday && attStyles.todayRow]}>
      {isToday && (
        <View style={attStyles.todayBadge}>
          <Text variant="bodySmall" style={attStyles.todayText}>TODAY</Text>
        </View>
      )}
      <Text variant="bodyMedium" style={attStyles.date}>{formatDate(record.date)}</Text>
      <View style={attStyles.times}>
        <View style={attStyles.timeBlock}>
          <MaterialCommunityIcons name="login" size={16} color={Colors.success} />
          <Text variant="bodyMedium" style={attStyles.time}>{formatTime(record.loginTime)}</Text>
        </View>
        <View style={attStyles.timeBlock}>
          <MaterialCommunityIcons name="logout" size={16} color={Colors.warning} />
          <Text variant="bodyMedium" style={attStyles.time}>{formatTime(record.logoutTime)}</Text>
        </View>
      </View>
    </View>
  );
}

const attStyles = StyleSheet.create({
  row: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  todayRow: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  todayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryContainer,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  todayText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 10,
  },
  date: {
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  times: {
    flexDirection: 'row',
    gap: 24,
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    color: Colors.onSurface,
    fontWeight: '500',
  },
});

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={emptyStyles.container}>
      <MaterialCommunityIcons name={icon as any} size={56} color={Colors.outline} />
      <Text variant="bodyLarge" style={emptyStyles.text}>{message}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  text: { color: Colors.onSurfaceVariant, textAlign: 'center' },
});

export default function HistoryScreen() {
  const { user } = useAuth();
  const { todayPhotos, attendanceHistory, setTodayPhotos, setAttendanceHistory } = useAppContext();

  const [tab, setTab] = useState<TabValue>('photos');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [photos, history] = await Promise.all([
        api.getTodayPhotos(user.id),
        api.getAttendanceHistory(user.id),
      ]);
      setTodayPhotos(photos);
      setAttendanceHistory(history);
    } catch {
      // silent fail
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Content title={Strings.historyTitle} titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as TabValue)}
          buttons={[
            { value: 'photos', label: Strings.tabTodayPhotos, icon: 'camera' },
            { value: 'attendance', label: Strings.tabAttendance, icon: 'clock-outline' },
          ]}
          style={styles.segmented}
        />
      </View>

      {tab === 'photos' ? (
        <FlatList
          data={todayPhotos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PhotoCard photo={item} />}
          contentContainerStyle={[styles.listContent, !todayPhotos.length && styles.emptyContent]}
          ListEmptyComponent={
            <EmptyState icon="camera-off" message={Strings.noPhotosToday} />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={attendanceHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AttendanceItem record={item} />}
          contentContainerStyle={[styles.listContent, !attendanceHistory.length && styles.emptyContent]}
          ListEmptyComponent={
            <EmptyState icon="calendar-blank" message={Strings.noAttendanceRecords} />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  appbar: { backgroundColor: Colors.surface },
  appbarTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    elevation: 1,
  },
  segmented: {},
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContent: {
    flex: 1,
  },
});
