import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Appbar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../../api';
import { Strings } from '../../constants/strings';
import { Colors } from '../../constants/colors';
import { AdminWorkerSummary, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import WorkerRow from '../../components/WorkerRow';

type SectionData =
  | { type: 'header'; title: string; icon: string }
  | { type: 'worker'; user: User; attendance?: AdminWorkerSummary['todayAttendance']; showAttendance: boolean }
  | { type: 'empty'; message: string };

export default function AdminScreen() {
  const { user } = useAuth();

  // Defense-in-depth guard: navigation already restricts this tab to admins,
  // but we enforce it again here in case the screen is ever reached directly.
  if (!user?.isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="bodyLarge" style={{ color: Colors.error }}>
          Access denied.
        </Text>
      </View>
    );
  }
  const [workers, setWorkers] = useState<User[]>([]);
  const [summaries, setSummaries] = useState<AdminWorkerSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allWorkers, todaySummaries] = await Promise.all([
        api.getAllWorkers(),
        api.getTodayAllAttendance(),
      ]);
      setWorkers(allWorkers);
      setSummaries(todaySummaries);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const listData: SectionData[] = [
    { type: 'header', title: Strings.todayAttendance, icon: 'clipboard-check' },
    ...(summaries.length > 0
      ? summaries.map((s) => ({
          type: 'worker' as const,
          user: s.user,
          attendance: s.todayAttendance,
          showAttendance: true,
        }))
      : [{ type: 'empty' as const, message: Strings.noWorkers }]),
    { type: 'header', title: Strings.allWorkers, icon: 'account-group' },
    ...(workers.length > 0
      ? workers.map((w) => ({
          type: 'worker' as const,
          user: w,
          attendance: undefined,
          showAttendance: false,
        }))
      : [{ type: 'empty' as const, message: Strings.noWorkers }]),
  ];

  const presentCount = summaries.filter((s) => !!s.todayAttendance?.loginTime).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Content title={Strings.adminTitle} titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      {/* Summary strip */}
      <View style={styles.strip}>
        <View style={styles.stripItem}>
          <Text variant="headlineSmall" style={[styles.stripNumber, { color: Colors.success }]}>
            {presentCount}
          </Text>
          <Text variant="bodySmall" style={styles.stripLabel}>{Strings.present}</Text>
        </View>
        <Divider style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text variant="headlineSmall" style={[styles.stripNumber, { color: Colors.error }]}>
            {workers.length - presentCount}
          </Text>
          <Text variant="bodySmall" style={styles.stripLabel}>{Strings.absent}</Text>
        </View>
        <Divider style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text variant="headlineSmall" style={[styles.stripNumber, { color: Colors.primary }]}>
            {workers.length}
          </Text>
          <Text variant="bodySmall" style={styles.stripLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, idx) =>
          item.type === 'worker' ? item.user.id + item.showAttendance : `${item.type}_${idx}`
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={Colors.primary} />
                <Text variant="titleMedium" style={styles.sectionTitle}>{item.title}</Text>
              </View>
            );
          }
          if (item.type === 'empty') {
            return (
              <View style={styles.emptyRow}>
                <Text variant="bodyMedium" style={styles.emptyText}>{item.message}</Text>
              </View>
            );
          }
          return (
            <WorkerRow
              user={item.user}
              attendance={item.attendance ?? null}
              showAttendance={item.showAttendance}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  appbar: { backgroundColor: Colors.surface },
  appbarTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  strip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    marginBottom: 4,
    elevation: 1,
  },
  stripItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  stripNumber: {
    fontWeight: '700',
  },
  stripLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  stripDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
    backgroundColor: Colors.outlineVariant,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingTop: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.onSurfaceVariant,
  },
});
