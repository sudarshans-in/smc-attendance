import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../../api';
import { Strings } from '../../constants/strings';
import { getTheme } from '../../constants/theme';
import { AdminWorkerSummary, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import WorkerRow from '../../components/WorkerRow';

type Row =
  | { type: 'header'; title: string; icon: string }
  | { type: 'worker'; user: User; attendance?: AdminWorkerSummary['todayAttendance']; showAttendance: boolean }
  | { type: 'empty'; message: string };

export default function AdminScreen() {
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);

  if (!user?.isAdmin) {
    return (
      <View style={[s.root, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 16, color: t.errorColor }}>Access denied.</Text>
      </View>
    );
  }

  const [workers, setWorkers] = useState<User[]>([]);
  const [summaries, setSummaries] = useState<AdminWorkerSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [w, s] = await Promise.all([api.getAllWorkers(), api.getTodayAllAttendance()]);
    setWorkers(w); setSummaries(s);
  }, []);

  useEffect(() => { loadData().catch(() => {}); }, [loadData]);
  const onRefresh = async () => { setRefreshing(true); await loadData().catch(() => {}); setRefreshing(false); };

  const presentCount = summaries.filter((s) => !!s.todayAttendance?.loginTime).length;
  const absentCount = workers.length - presentCount;

  const stats = [
    { count: presentCount, label: Strings.present, color: t.successText, bg: t.successBg, border: '#A3CFBB', icon: 'account-check-outline' },
    { count: absentCount,  label: Strings.absent,  color: t.error,       bg: t.errorBg,   border: '#F1AEB5', icon: 'account-remove-outline' },
    { count: workers.length, label: 'Total',       color: t.accent,      bg: t.infoBg,    border: '#9ECFDD', icon: 'account-group-outline' },
  ];

  const rows: Row[] = [
    { type: 'header', title: Strings.todayAttendance, icon: 'clipboard-check-outline' },
    ...(summaries.length > 0
      ? summaries.map((s) => ({ type: 'worker' as const, user: s.user, attendance: s.todayAttendance, showAttendance: true }))
      : [{ type: 'empty' as const, message: Strings.noWorkers }]),
    { type: 'header', title: Strings.allWorkers, icon: 'account-group-outline' },
    ...(workers.length > 0
      ? workers.map((w) => ({ type: 'worker' as const, user: w, attendance: undefined, showAttendance: false }))
      : [{ type: 'empty' as const, message: Strings.noWorkers }]),
  ];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]} edges={['top']}>
      {/* Navbar */}
      <View style={[s.navbar, { backgroundColor: t.headerBg, borderBottomColor: t.headerBorder }]}>
        <MaterialCommunityIcons name="shield-account-outline" size={20} color={t.primary} />
        <Text style={[s.navTitle, { color: t.text }]}>{Strings.adminTitle}</Text>
      </View>

      {/* Stats row */}
      <View style={[s.statsRow, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        {stats.map((item, i) => (
          <View key={item.label} style={[s.statCard, { backgroundColor: item.bg, borderColor: item.border }, i > 0 && { marginLeft: 8 }]}>
            <View style={s.statTop}>
              <MaterialCommunityIcons name={item.icon as any} size={16} color={item.color} />
              <Text style={[s.statCount, { color: item.color }]}>{item.count}</Text>
            </View>
            <Text style={[s.statLabel, { color: item.color }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item, idx) => item.type === 'worker' ? item.user.id + item.showAttendance : `${item.type}_${idx}`}
        renderItem={({ item }) => {
          if (item.type === 'header') return (
            <View style={[s.sectionHeader, { borderBottomColor: t.divider }]}>
              <MaterialCommunityIcons name={item.icon as any} size={15} color={t.primary} />
              <Text style={[s.sectionTitle, { color: t.text }]}>{item.title}</Text>
            </View>
          );
          if (item.type === 'empty') return (
            <View style={s.emptyRow}><Text style={[s.emptyText, { color: t.textMuted }]}>{item.message}</Text></View>
          );
          return (
            <View style={{ paddingHorizontal: 16 }}>
              <WorkerRow user={item.user} attendance={item.attendance ?? null} showAttendance={item.showAttendance} />
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[t.primary]} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  navbar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
  navTitle:      { fontSize: 16, fontWeight: '700' },
  statsRow:      { flexDirection: 'row', padding: 12, borderBottomWidth: 1 },
  statCard:      { flex: 1, borderRadius: 8, borderWidth: 1, padding: 10, gap: 4 },
  statTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statCount:     { fontSize: 22, fontWeight: '800' },
  statLabel:     { fontSize: 11, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  sectionTitle:  { fontSize: 14, fontWeight: '700' },
  emptyRow:      { paddingVertical: 16, alignItems: 'center' },
  emptyText:     { fontSize: 14 },
});
