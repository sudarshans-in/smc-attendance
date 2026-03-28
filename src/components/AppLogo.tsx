import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/colors';

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
    <View style={styles.wrapper}>
      {/* Outer badge — dark green rounded square */}
      <View
        style={[
          styles.badge,
          {
            width: d.badge,
            height: d.badge,
            borderRadius: d.badge * 0.26,
          },
        ]}
      >
        {/* White inner circle */}
        <View
          style={[
            styles.circle,
            {
              width: d.circle,
              height: d.circle,
              borderRadius: d.circle / 2,
            },
          ]}
        >
          {/* Location-check icon — GPS attendance */}
          <MaterialCommunityIcons
            name="map-marker-check"
            size={d.icon}
            color={Colors.primary}
          />
        </View>

        {/* SMC label inside badge */}
        <Text style={[styles.smcLabel, { fontSize: d.label }]}>SMC</Text>
      </View>

      {/* Full name below badge */}
      {size !== 'small' && (
        <View style={styles.nameBlock}>
          <Text style={[styles.appName, { fontSize: d.sub + 4 }]}>
            SMC Karmachari
          </Text>
          <Text style={[styles.appSub, { fontSize: d.sub }]}>
            Silchar Municipal Corporation
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: Colors.primaryDark,
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
    backgroundColor: Colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smcLabel: {
    color: Colors.onPrimary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  nameBlock: {
    alignItems: 'center',
    gap: 2,
  },
  appName: {
    color: Colors.onPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appSub: {
    color: Colors.primaryContainer,
    letterSpacing: 0.3,
  },
});
