import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useLocation } from '../../hooks/useLocation';
import { useCamera } from '../../hooks/useCamera';
import { api } from '../../api';
import { Strings } from '../../constants/strings';
import { getTheme } from '../../constants/theme';
import { AttendanceStatus, AppTabParamList } from '../../types';
import AttendanceCard from '../../components/AttendanceCard';

type Props = { navigation: BottomTabNavigationProp<AppTabParamList, 'Home'> };

function getStatus(att: ReturnType<typeof useAppContext>['todayAttendance']): AttendanceStatus {
  if (!att?.loginTime) return 'not_started';
  if (!att.logoutTime) return 'logged_in';
  return 'completed';
}

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useThemeMode();
  const t = getTheme(isDark);
  const { todayAttendance, todayPhotos, setTodayAttendance, setTodayPhotos } = useAppContext();
  const { loading: locLoading, fetchLocation } = useLocation();
  const { takePicture } = useCamera();
  const [snackbar, setSnackbar] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const status = getStatus(todayAttendance);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    Promise.all([api.getTodayAttendance(user.id), api.getTodayPhotos(user.id)])
      .then(([att, photos]) => { setTodayAttendance(att); setTodayPhotos(photos); })
      .catch(() => {});
  }, [user]));

  const handleMarkLogin = async () => {
    if (!user) return;
    const uri = await takePicture();
    if (!uri) { setSnackbar(Strings.checkinPhotoRequired); return; }
    setActionLoading(true);
    const coords = await fetchLocation();
    if (!coords) { setSnackbar(Strings.locationError); setActionLoading(false); return; }
    try { setTodayAttendance(await api.markAttendanceLogin(user.id, coords, uri)); setSnackbar(Strings.attendanceLoginDone); }
    catch { setSnackbar(Strings.errorGeneric); }
    finally { setActionLoading(false); }
  };

  const handleMarkLogout = async () => {
    if (!user) return;
    const uri = await takePicture();
    if (!uri) { setSnackbar(Strings.checkinPhotoRequired); return; }
    setActionLoading(true);
    const coords = await fetchLocation();
    if (!coords) { setSnackbar(Strings.locationError); setActionLoading(false); return; }
    try { setTodayAttendance(await api.markAttendanceLogout(user.id, coords, uri)); setSnackbar(Strings.attendanceLogoutDone); }
    catch (e: any) { setSnackbar(e?.message ?? Strings.errorGeneric); }
    finally { setActionLoading(false); }
  };

  const handleLogout = () => Alert.alert(
    Strings.logoutConfirmTitle, Strings.logoutConfirmMessage,
    [{ text: Strings.cancel, style: 'cancel' }, { text: Strings.confirm, style: 'destructive', onPress: logout }]
  );

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]} edges={['top']}>
      {/* Navbar */}
      <View style={[s.navbar, { backgroundColor: t.headerBg, borderBottomColor: t.headerBorder }]}>
        <View style={s.navInfo}>
          <Text style={[s.navTitle, { color: t.onHeader }]}>{user?.name ?? Strings.appName}</Text>
          <Text style={[s.navSub, { color: t.onHeaderSub }]}>{Strings.appName}</Text>
        </View>
        <TouchableOpacity style={[s.navBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]} onPress={toggle} activeOpacity={0.75}>
          <MaterialCommunityIcons name={isDark ? 'weather-sunny' : 'weather-night'} size={16} color={t.onHeader} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.navBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]} onPress={handleLogout} activeOpacity={0.75}>
          <MaterialCommunityIcons name="logout-variant" size={16} color={t.onHeader} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Date badge */}
        <View style={[s.dateBadge, { backgroundColor: t.surface, borderColor: t.border }]}>
          <MaterialCommunityIcons name="calendar-today" size={14} color={t.primary} />
          <Text style={[s.dateText, { color: t.textSub }]}>{today}</Text>
        </View>

        <AttendanceCard
          attendance={todayAttendance}
          status={status}
          onMarkLogin={handleMarkLogin}
          onMarkLogout={handleMarkLogout}
          loading={actionLoading || locLoading}
        />

        {/* Work photos card */}
        <View style={[s.photoCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={s.photoCardHeader}>
            <View style={[s.photoIcon, { backgroundColor: t.infoBg }]}>
              <MaterialCommunityIcons name="image-multiple-outline" size={18} color={t.infoColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.photoCardTitle, { color: t.text }]}>Today's Work Photos</Text>
              <Text style={[s.photoCardSub, { color: t.textSub }]}>{Strings.photosTodayCount(todayPhotos.length)}</Text>
            </View>
            {todayPhotos.length > 0 && (
              <View style={[s.countBadge, { backgroundColor: t.infoBg }]}>
                <Text style={[s.countText, { color: t.infoColor }]}>{todayPhotos.length}</Text>
              </View>
            )}
          </View>
          <View style={[s.divider, { backgroundColor: t.divider }]} />
          <TouchableOpacity
            style={[s.uploadBtn, { backgroundColor: t.accent }]}
            onPress={() => navigation.navigate('Upload')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={16} color="#fff" />
            <Text style={s.uploadBtnText}>{Strings.uploadPhotoShortcut}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {!!snackbar && (
        <View style={[s.snackbar, { backgroundColor: t.snackbar }]}>
          <Text style={s.snackMsg}>{snackbar}</Text>
          <TouchableOpacity onPress={() => setSnackbar('')}>
            <Text style={[s.snackAction, { color: t.primaryLight }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  navbar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
  navInfo:        { flex: 1 },
  navTitle:       { fontSize: 16, fontWeight: '700' },
  navSub:         { fontSize: 12, marginTop: 1 },
  navBtn:         { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:         { padding: 16, paddingBottom: 32, gap: 12 },
  dateBadge:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  dateText:       { fontSize: 13 },
  photoCard:      { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  photoCardHeader:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoIcon:      { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  photoCardTitle: { fontSize: 15, fontWeight: '600' },
  photoCardSub:   { fontSize: 13, marginTop: 2 },
  countBadge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countText:      { fontSize: 13, fontWeight: '700' },
  divider:        { height: 1 },
  uploadBtn:      { height: 44, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadBtnText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  snackbar:       { position: 'absolute', bottom: 16, left: 16, right: 16, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 8 },
  snackMsg:       { flex: 1, color: '#fff', fontSize: 14 },
  snackAction:    { fontSize: 13, fontWeight: '700' },
});
