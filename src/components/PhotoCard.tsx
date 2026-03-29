import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WorkPhoto } from '../types';
import { useThemeMode } from '../context/ThemeContext';
import { getTheme } from '../constants/theme';

interface Props { photo: WorkPhoto; onPress?: () => void; }

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtCoords = (lat: number, lon: number) => `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;

export default function PhotoCard({ photo, onPress }: Props) {
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);
  const Wrap: any = onPress ? TouchableOpacity : View;

  return (
    <Wrap style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]} onPress={onPress} activeOpacity={0.92}>
      <Image source={{ uri: photo.imageUri }} style={s.img} resizeMode="cover" accessibilityLabel="Work photo" />
      <View style={s.body}>
        <View style={s.row}>
          <MaterialCommunityIcons name="clock-outline" size={13} color={t.textSub} />
          <Text style={[s.time, { color: t.text }]}>{fmtTime(photo.uploadedAt)}</Text>
        </View>
        {!!photo.notes && (
          <View style={s.row}>
            <MaterialCommunityIcons name="text" size={13} color={t.textSub} style={{ marginTop: 1 }} />
            <Text style={[s.notes, { color: t.textSub }]} numberOfLines={2}>{photo.notes}</Text>
          </View>
        )}
        <View style={[s.coordsRow, { backgroundColor: t.surfaceVar, borderColor: t.border }]}>
          <MaterialCommunityIcons name="map-marker-outline" size={12} color={t.success} />
          <Text style={[s.coords, { color: t.textSub }]}>{fmtCoords(photo.location.latitude, photo.location.longitude)}</Text>
        </View>
      </View>
    </Wrap>
  );
}

const s = StyleSheet.create({
  card:      { borderRadius: 10, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  img:       { width: '100%', height: 180 },
  body:      { padding: 12, gap: 6 },
  row:       { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  time:      { fontSize: 13, fontWeight: '600' },
  notes:     { flex: 1, fontSize: 13 },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  coords:    { fontSize: 11 },
});
