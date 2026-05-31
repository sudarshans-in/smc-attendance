import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import { Strings } from '../../constants/strings';
import { getTheme } from '../../constants/theme';
import { AttendanceRecord, WorkPhoto } from '../../types';
import PhotoCard from '../../components/PhotoCard';

type Tab = 'photos' | 'attendance';
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';

function AttendanceItem({ record, isDark }: { record: AttendanceRecord; isDark: boolean }) {
  const t = getTheme(isDark);
  const isToday = record.date === new Date().toISOString().split('T')[0];
  const hasOut = !!record.logoutTime;

  return (
    <View style={[s.attCard, { backgroundColor: t.surface, borderColor: t.border }, isToday && { borderLeftColor: t.primary, borderLeftWidth: 3 }]}>
      <View style={s.attCardTop}>
        <Text style={[s.attDate, { color: t.text }]}>{fmtDate(record.date)}</Text>
        {isToday && (
          <View style={[s.todayBadge, { backgroundColor: t.successBg }]}>
            <Text style={[s.todayText, { color: t.successText }]}>Today</Text>
          </View>
        )}
        <View style={[s.statusDot, { backgroundColor: hasOut ? t.success : t.warning }]} />
      </View>
      <View style={s.timesRow}>
        <View style={[s.timeBlock, { backgroundColor: t.successBg, borderColor: '#A3CFBB' }]}>
          <MaterialCommunityIcons name="login" size={16} color={t.success} />
          <View>
            <Text style={[s.timeBlockLabel, { color: t.successText }]}>CHECK IN</Text>
            <Text style={[s.timeBlockValue, { color: t.successText }]}>{fmtTime(record.loginTime)}</Text>
          </View>
        </View>
        <View style={[s.timeBlock, { backgroundColor: hasOut ? t.warningBg : t.surfaceVar, borderColor: hasOut ? '#FFECB5' : t.border }]}>
          <MaterialCommunityIcons name="logout" size={16} color={hasOut ? t.warning : t.textMuted} />
          <View>
            <Text style={[s.timeBlockLabel, { color: hasOut ? t.warningText : t.textMuted }]}>CHECK OUT</Text>
            <Text style={[s.timeBlockValue, { color: hasOut ? t.warningText : t.textMuted }]}>{fmtTime(record.logoutTime)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Empty({ icon, msg, t }: { icon: string; msg: string; t: ReturnType<typeof getTheme> }) {
  return (
    <View style={s.empty}>
      <MaterialCommunityIcons name={icon as any} size={48} color={t.border} />
      <Text style={[s.emptyText, { color: t.textMuted }]}>{msg}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);
  const { todayPhotos, attendanceHistory, setTodayPhotos, setAttendanceHistory } = useAppContext();
  const [tab, setTab] = useState<Tab>('photos');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [photos, history] = await Promise.all([api.getTodayPhotos(user.id), api.getAttendanceHistory(user.id)]);
    setTodayPhotos(photos); setAttendanceHistory(history);
  }, [user]);

  const onRefresh = async () => { setRefreshing(true); await loadData().catch(() => {}); setRefreshing(false); };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]} edges={['top']}>
      {/* Navbar */}
      <View style={[s.navbar, { backgroundColor: t.headerBg, borderBottomColor: t.headerBorder }]}>
        <MaterialCommunityIcons name="history" size={20} color={t.onHeader} />
        <Text style={[s.navTitle, { color: t.onHeader }]}>{Strings.historyTitle}</Text>
      </View>

      {/* Tab bar */}
      <View style={[s.tabBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        {(['photos', 'attendance'] as Tab[]).map((tb) => (
          <TouchableOpacity key={tb} style={[s.tabItem, tab === tb && { borderBottomColor: t.primary }]} onPress={() => setTab(tb)} activeOpacity={0.8}>
            <MaterialCommunityIcons name={tb === 'photos' ? 'camera-outline' : 'clock-outline'} size={15} color={tab === tb ? t.primary : t.textSub} />
            <Text style={[s.tabText, { color: tab === tb ? t.primary : t.textSub }, tab === tb && { fontWeight: '700' }]}>
              {tb === 'photos' ? Strings.tabTodayPhotos : Strings.tabAttendance}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'photos' ? (
        <FlatList
          data={todayPhotos}
          keyExtractor={(i) => i.id}
          renderItem={({ item }: { item: WorkPhoto }) => <PhotoCard photo={item} />}
          contentContainerStyle={[s.list, !todayPhotos.length && { flex: 1 }]}
          ListEmptyComponent={<Empty icon="camera-off" msg={Strings.noPhotosToday} t={t} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[t.primary]} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={attendanceHistory}
          keyExtractor={(i) => i.id}
          renderItem={({ item }: { item: AttendanceRecord }) => <AttendanceItem record={item} isDark={isDark} />}
          contentContainerStyle={[s.list, !attendanceHistory.length && { flex: 1 }]}
          ListEmptyComponent={<Empty icon="calendar-blank" msg={Strings.noAttendanceRecords} t={t} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[t.primary]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  navbar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
  navTitle:       { fontSize: 16, fontWeight: '700' },
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText:        { fontSize: 14, fontWeight: '500' },
  list:           { padding: 16, paddingBottom: 32 },
  attCard:        { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12, gap: 12 },
  attCardTop:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attDate:        { flex: 1, fontSize: 15, fontWeight: '600' },
  todayBadge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  todayText:      { fontSize: 12, fontWeight: '700' },
  statusDot:      { width: 8, height: 8, borderRadius: 4 },
  timesRow:       { flexDirection: 'column', gap: 8 },
  timeBlock:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  timeBlockLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  timeBlockValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyText:      { fontSize: 15 },
});
