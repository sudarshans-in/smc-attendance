import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Card } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WorkPhoto } from '../types';
import { Colors } from '../constants/colors';

interface Props {
  photo: WorkPhoto;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
}

export default function PhotoCard({ photo }: Props) {
  return (
    <Card style={styles.card} elevation={1}>
      <Image
        source={{ uri: photo.imageUri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="Work photo"
      />
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={styles.timeText}>
            {formatDateTime(photo.uploadedAt)}
          </Text>
        </View>
        {photo.notes !== '' && (
          <View style={styles.row}>
            <MaterialCommunityIcons name="text" size={16} color={Colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.notesText} numberOfLines={2}>
              {photo.notes}
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={Colors.onSurfaceVariant} />
          <Text variant="bodySmall" style={styles.coordsText}>
            {formatCoords(photo.location.latitude, photo.location.longitude)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    paddingTop: 10,
    paddingBottom: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  timeText: {
    color: Colors.onSurface,
    fontWeight: '600',
  },
  notesText: {
    flex: 1,
    color: Colors.onSurface,
  },
  coordsText: {
    flex: 1,
    color: Colors.onSurfaceVariant,
  },
});
