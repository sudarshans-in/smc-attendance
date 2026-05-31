import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, RefreshControl, StyleSheet,
  Image, TouchableOpacity, Modal, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../../api';
import { Strings } from '../../constants/strings';
import { getTheme } from '../../constants/theme';
import { AdminWorkerSummary, User, WorkPhoto } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import WorkerRow from '../../components/WorkerRow';

const SCREEN_W = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_W - 16 * 2 - 8) / 3;  // 3-column grid

function fmtTime(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Photo viewer modal ─────────────────────────────────────────────────────
function PhotoModal({ photo, onClose }: { photo: WorkPhoto | null; onClose: () => void }) {
  if (!photo) return null;
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <TouchableOpacity style={pm.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: photo.imageUri }} style={pm.fullImg} resizeMode="contain" />
        <View style={pm.meta}>
          <Text style={pm.metaName}>{photo.memberName ?? 'Unknown'}</Text>
          {!!photo.notes && <Text style={pm.metaNotes}>{photo.notes}</Text>}
          {!!photo.uploadedAt && <Text style={pm.metaTime}>{fmtTime(photo.uploadedAt)}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  closeBtn:  { position: 'absolute', top: 52, right: 16, zIndex: 10, padding: 8 },
  fullImg:   { width: SCREEN_W, height: SCREEN_W * 1.1 },
  meta:      { padding: 20, gap: 4 },
  metaName:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  metaNotes: { color: '#cbd5e1', fontSize: 13 },
  metaTime:  { color: '#94a3b8', fontSize: 12 },
});

// ── Photo grid section ─────────────────────────────────────────────────────
function PhotoGrid({ photos, onTap, t }: {
  photos: WorkPhoto[];
  onTap: (p: WorkPhoto) => void;
  t: ReturnType<typeof getTheme>;
}) {
  if (photos.length === 0) {
    return (
      <View style={[pg.empty, { borderColor: t.border }]}>
        <MaterialCommunityIcons name="image-off-outline" size={28} color={t.textMuted} />
        <Text style={[pg.emptyText, { color: t.textMuted }]}>No photos uploaded today</Text>
      </View>
    );
  }
  return (
    <View style={pg.grid}>
      {photos.map((photo) => (
        <TouchableOpacity
          key={photo.id}
          onPress={() => onTap(photo)}
          activeOpacity={0.85}
          style={pg.thumb}
        >
          <Image source={{ uri: photo.imageUri }} style={pg.img} resizeMode="cover" />
          <View style={[pg.nameTag, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <Text style={pg.nameText} numberOfLines={1}>
              {photo.memberName?.split(' ')[0] ?? '—'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const pg = StyleSheet.create({
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: 16, paddingBottom: 8 },
  thumb:     { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 8, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  img:       { width: '100%', height: '100%' },
  nameTag:   { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 6, paddingVertical: 3 },
  nameText:  { color: '#fff', fontSize: 10, fontWeight: '600' },
  empty:     { marginHorizontal: 16, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 28, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 13 },
});

// ── Main screen ────────────────────────────────────────────────────────────
type Row =
  | { type: 'header';     title: string; icon: string }
  | { type: 'photoGrid';  photos: WorkPhoto[] }
  | { type: 'worker';     user: User; attendance?: AdminWorkerSummary['todayAttendance']; showAttendance: boolean }
  | { type: 'empty';      message: string };

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
  const [photos, setPhotos] = useState<WorkPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<WorkPhoto | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [w, att, ph] = await Promise.all([
      api.getAllWorkers(),
      api.getTodayAllAttendance(),
      api.getSquadTodayPhotos(),
    ]);
    setWorkers(w);
    setSummaries(att);
    setPhotos(ph);
  }, []);

  useEffect(() => { loadData().catch(() => {}); }, [loadData]);
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData().catch(() => {});
    setRefreshing(false);
  };

  const presentCount = summaries.filter((s) => !!s.todayAttendance?.loginTime).length;
  const absentCount  = workers.length - presentCount;

  const stats = [
    { count: presentCount,  label: Strings.present, color: t.successText, bg: t.successBg, border: '#A3CFBB', icon: 'account-check-outline' },
    { count: absentCount,   label: Strings.absent,  color: t.error,       bg: t.errorBg,   border: '#F1AEB5', icon: 'account-remove-outline' },
    { count: photos.length, label: 'Photos',         color: t.accent,      bg: t.infoBg,    border: '#9ECFDD', icon: 'image-multiple-outline' },
  ];

  const rows: Row[] = [
    { type: 'header', title: Strings.todayAttendance, icon: 'clipboard-check-outline' },
    ...(summaries.length > 0
      ? summaries.map((s) => ({ type: 'worker' as const, user: s.user, attendance: s.todayAttendance, showAttendance: true }))
      : [{ type: 'empty' as const, message: Strings.noWorkers }]),

    { type: 'header', title: "Today's Work Photos", icon: 'image-multiple-outline' },
    { type: 'photoGrid', photos },

    { type: 'header', title: Strings.allWorkers, icon: 'account-group-outline' },
    ...(workers.length > 0
      ? workers.map((w) => ({ type: 'worker' as const, user: w, showAttendance: false }))
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
        keyExtractor={(item, idx) =>
          item.type === 'worker' ? item.user.id + item.showAttendance
          : item.type === 'photoGrid' ? 'photoGrid'
          : `${item.type}_${idx}`
        }
        renderItem={({ item }) => {
          if (item.type === 'header') return (
            <View style={[s.sectionHeader, { borderBottomColor: t.divider }]}>
              <MaterialCommunityIcons name={item.icon as any} size={15} color={t.primary} />
              <Text style={[s.sectionTitle, { color: t.text }]}>{item.title}</Text>
            </View>
          );
          if (item.type === 'photoGrid') return (
            <PhotoGrid photos={item.photos} onTap={setSelectedPhoto} t={t} />
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

      <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
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
