import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Size = 'small' | 'medium' | 'large';

interface Props {
  size?: Size;
}

const SIZES: Record<Size, { badge: number; circle: number; icon: number; label: number; sub: number }> = {
  small:  { badge: 56,  circle: 40,  icon: 22, label: 11, sub: 8  },
  medium: { badge: 88,  circle: 64,  icon: 36, label: 16, sub: 11 },
  large:  { badge: 120, circle: 88,  icon: 50, label: 22, sub: 14 },
};

export default function AppLogo({ size = 'medium' }: Props) {
  const d = SIZES[size];

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View
        style={[
          styles.badge,
          { width: d.badge, height: d.badge, borderRadius: d.badge * 0.26 },
        ]}
      >
        <View
          style={[
            styles.circle,
            { width: d.circle, height: d.circle, borderRadius: d.circle / 2 },
          ]}
        >
          <MaterialCommunityIcons name="map-marker-check" size={d.icon} color="#2E7D32" />
        </View>
        <Text style={[styles.label, { fontSize: d.label }]}>SMC</Text>
      </View>

      {size !== 'small' && (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={[styles.appName, { fontSize: d.sub + 4 }]}>SMC Karmachari</Text>
          <Text style={[styles.subName, { fontSize: d.sub }]}>Silchar Municipal Corporation</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  circle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: 'white',
    fontWeight: '800',
    letterSpacing: 2,
  },
  appName: {
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subName: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
});
