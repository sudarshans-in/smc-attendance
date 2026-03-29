import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { useThemeMode } from '../context/ThemeContext';
import { getTheme } from '../constants/theme';
import { Strings } from '../constants/strings';

interface Props {
  attendance: AttendanceRecord | null;
  status: AttendanceStatus;
  onMarkLogin: () => void;
  onMarkLogout: () => void;
  loading: boolean;
}

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';

export default function AttendanceCard({ attendance, status, onMarkLogin, onMarkLogout, loading }: Props) {
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);

  return (
    <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Header badge row */}
      <View style={[s.cardHeader, { borderBottomColor: t.divider }]}>
        <View style={[s.headerIcon, { backgroundColor: t.successBg }]}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={18} color={t.success} />
        </View>
        <Text style={[s.cardHeaderTitle, { color: t.text }]}>{Strings.attendanceStatus}</Text>
        {status === 'logged_in' && (
          <View style={[s.statusPill, { backgroundColor: '#FFF3CD', borderColor: '#FFECB5' }]}>
            <View style={[s.statusDot, { backgroundColor: '#856404' }]} />
            <Text style={[s.statusPillText, { color: '#856404' }]}>IN PROGRESS</Text>
          </View>
        )}
        {status === 'completed' && (
          <View style={[s.statusPill, { backgroundColor: t.successBg, borderColor: '#A3CFBB' }]}>
            <View style={[s.statusDot, { backgroundColor: t.success }]} />
            <Text style={[s.statusPillText, { color: t.successText }]}>COMPLETE</Text>
          </View>
        )}
        {status === 'not_started' && (
          <View style={[s.statusPill, { backgroundColor: isDark ? t.surfaceVar : '#E9ECEF', borderColor: t.border }]}>
            <View style={[s.statusDot, { backgroundColor: t.textMuted }]} />
            <Text style={[s.statusPillText, { color: t.textSub }]}>NOT STARTED</Text>
          </View>
        )}
      </View>

      <View style={s.cardBody}>
        {/* Photo + time grid */}
        {(status === 'logged_in' || status === 'completed') && (
          <>
            <View style={s.photoRow}>
              {(['login', 'logout'] as const).map((type) => {
                const uri = type === 'login' ? attendance?.loginPhotoUri : attendance?.logoutPhotoUri;
                const color = type === 'login' ? t.success : t.checkout;
                return (
                  <View key={type} style={[s.photoCol, { borderColor: t.border, backgroundColor: t.surfaceVar }]}>
                    {uri
                      ? <Image source={{ uri }} style={s.photo} resizeMode="cover" />
                      : <View style={[s.photoEmpty, { backgroundColor: t.surfaceVar }]}>
                          <MaterialCommunityIcons name="camera-off-outline" size={22} color={t.textMuted} />
                        </View>
                    }
                    <View style={[s.photoFooter, { borderTopColor: t.border }]}>
                      <MaterialCommunityIcons name={type} size={12} color={color} />
                      <Text style={[s.photoLabel, { color: t.textSub }]}>{type === 'login' ? 'Check-in' : 'Check-out'}</Text>
                      <Text style={[s.photoTime, { color: t.text }]}>
                        {fmtTime(type === 'login' ? attendance?.loginTime ?? null : attendance?.logoutTime ?? null)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Loading */}
        {loading && (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={t.primary} />
            <Text style={[s.loadingText, { color: t.textSub }]}>{Strings.fetchingLocation}</Text>
          </View>
        )}

        {/* Not started placeholder */}
        {!loading && status === 'not_started' && (
          <View style={[s.emptyState, { backgroundColor: t.surfaceVar, borderColor: t.border }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={32} color={t.textMuted} />
            <Text style={[s.emptyStateText, { color: t.textSub }]}>No attendance recorded today</Text>
          </View>
        )}

        {/* Check-in button */}
        {!loading && status === 'not_started' && (
          <TouchableOpacity style={[s.btn, { backgroundColor: t.primary, shadowColor: t.primary }]} onPress={onMarkLogin} activeOpacity={0.85} accessibilityLabel={Strings.markAttendance}>
            <MaterialCommunityIcons name="map-marker-check" size={20} color="#fff" />
            <Text style={s.btnText}>{Strings.markAttendance}</Text>
          </TouchableOpacity>
        )}

        {/* Check-out button */}
        {!loading && status === 'logged_in' && (
          <TouchableOpacity style={[s.btn, { backgroundColor: t.checkout, shadowColor: t.checkout }]} onPress={onMarkLogout} activeOpacity={0.85} accessibilityLabel={Strings.markLogout}>
            <MaterialCommunityIcons name="map-marker-remove-outline" size={20} color="#fff" />
            <Text style={s.btnText}>{Strings.markLogout}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:           { borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
  headerIcon:     { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardHeaderTitle:{ flex: 1, fontSize: 14, fontWeight: '600' },
  statusPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardBody:       { padding: 16, gap: 12 },
  photoRow:       { flexDirection: 'row', gap: 10 },
  photoCol:       { flex: 1, borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  photo:          { width: '100%', height: 100 },
  photoEmpty:     { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' },
  photoFooter:    { padding: 8, gap: 2, borderTopWidth: 1 },
  photoLabel:     { fontSize: 11, fontWeight: '500' },
  photoTime:      { fontSize: 13, fontWeight: '700' },
  loadingRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  loadingText:    { fontSize: 14 },
  emptyState:     { borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 6 },
  emptyStateText: { fontSize: 13 },
  btn:            { height: 52, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 3, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 },
  btnText:        { fontSize: 15, fontWeight: '600', color: '#fff' },
});
