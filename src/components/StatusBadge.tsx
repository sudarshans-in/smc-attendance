import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';

interface Props {
  present: boolean;
}

export default function StatusBadge({ present }: Props) {
  return (
    <Chip
      mode="flat"
      style={[styles.chip, present ? styles.present : styles.absent]}
      textStyle={[styles.text, present ? styles.presentText : styles.absentText]}
      compact
      accessibilityLabel={present ? Strings.present : Strings.absent}
    >
      {present ? Strings.present : Strings.absent}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 28,
  },
  present: {
    backgroundColor: Colors.successContainer,
  },
  absent: {
    backgroundColor: Colors.errorContainer,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  presentText: {
    color: Colors.success,
  },
  absentText: {
    color: Colors.error,
  },
});
