import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Badge, Appbar, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { useLocation } from '../../hooks/useLocation';
import { useCamera } from '../../hooks/useCamera';
import { api } from '../../api';
import { Strings } from '../../constants/strings';
import { Colors } from '../../constants/colors';
import { AttendanceStatus } from '../../types';
import AttendanceCard from '../../components/AttendanceCard';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AppTabParamList } from '../../types';

type Props = {
  navigation: BottomTabNavigationProp<AppTabParamList, 'Home'>;
};

function getAttendanceStatus(attendance: ReturnType<typeof useAppContext>['todayAttendance']): AttendanceStatus {
  if (!attendance || !attendance.loginTime) return 'not_started';
  if (attendance.loginTime && !attendance.logoutTime) return 'logged_in';
  return 'completed';
}

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const {
    todayAttendance,
    todayPhotos,
    setTodayAttendance,
    setTodayPhotos,
  } = useAppContext();

  const { loading: locationLoading, fetchLocation } = useLocation();
  const { takePicture } = useCamera();
  const [snackbar, setSnackbar] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const status = getAttendanceStatus(todayAttendance);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      (async () => {
        try {
          const [att, photos] = await Promise.all([
            api.getTodayAttendance(user.id),
            api.getTodayPhotos(user.id),
          ]);
          setTodayAttendance(att);
          setTodayPhotos(photos);
        } catch {
          // silent fail on load
        }
      })();
    }, [user])
  );

  const handleMarkLogin = async () => {
    if (!user) return;

    // Step 1: capture check-in photo (required)
    const imageUri = await takePicture();
    if (!imageUri) {
      setSnackbar(Strings.checkinPhotoRequired);
      return;
    }

    // Step 2: get GPS location
    setActionLoading(true);
    const coords = await fetchLocation();
    if (!coords) {
      setSnackbar(Strings.locationError);
      setActionLoading(false);
      return;
    }

    // Step 3: record attendance with photo + location
    try {
      const record = await api.markAttendanceLogin(user.id, coords, imageUri);
      setTodayAttendance(record);
      setSnackbar(Strings.attendanceLoginDone);
    } catch {
      setSnackbar(Strings.errorGeneric);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkLogout = async () => {
    if (!user) return;

    // Step 1: capture check-out photo (required)
    const imageUri = await takePicture();
    if (!imageUri) {
      setSnackbar(Strings.checkinPhotoRequired);
      return;
    }

    // Step 2: get GPS location
    setActionLoading(true);
    const coords = await fetchLocation();
    if (!coords) {
      setSnackbar(Strings.locationError);
      setActionLoading(false);
      return;
    }

    // Step 3: record check-out with photo + location
    try {
      const record = await api.markAttendanceLogout(user.id, coords, imageUri);
      setTodayAttendance(record);
      setSnackbar(Strings.attendanceLogoutDone);
    } catch (err: any) {
      setSnackbar(err?.message ?? Strings.errorGeneric);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(Strings.logoutConfirmTitle, Strings.logoutConfirmMessage, [
      { text: Strings.cancel, style: 'cancel' },
      {
        text: Strings.confirm,
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Content
          title={Strings.greeting(user?.name ?? '')}
          titleStyle={styles.appbarTitle}
        />
        <Appbar.Action
          icon="logout"
          onPress={handleLogout}
          accessibilityLabel={Strings.logoutApp}
          color={Colors.onSurface}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodyMedium" style={styles.dateText}>
          {today}
        </Text>

        <AttendanceCard
          attendance={todayAttendance}
          status={status}
          onMarkLogin={handleMarkLogin}
          onMarkLogout={handleMarkLogout}
          loading={actionLoading || locationLoading}
        />

        <Card style={styles.photoCard} elevation={2}>
          <Card.Content>
            <View style={styles.photoCardHeader}>
              <MaterialCommunityIcons name="camera-outline" size={24} color={Colors.info} />
              <Text variant="titleMedium" style={styles.photoCardTitle}>
                Work Photos
              </Text>
              {todayPhotos.length > 0 && (
                <Badge style={styles.badge}>{todayPhotos.length}</Badge>
              )}
            </View>
            <Text variant="bodyMedium" style={styles.photoCountText}>
              {Strings.photosTodayCount(todayPhotos.length)}
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Upload')}
              style={[styles.actionButton, { backgroundColor: Colors.info }]}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.actionButtonLabel}
              icon="camera-plus"
              accessibilityLabel={Strings.uploadPhotoShortcut}
            >
              {Strings.uploadPhotoShortcut}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbar('') }}
      >
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  appbar: {
    backgroundColor: Colors.surface,
    elevation: 2,
  },
  appbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scroll: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  dateText: {
    color: Colors.onSurfaceVariant,
    marginBottom: 16,
  },
  photoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  photoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  photoCardTitle: {
    flex: 1,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  badge: {
    backgroundColor: Colors.info,
  },
  photoCountText: {
    color: Colors.onSurfaceVariant,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
  },
  actionButtonContent: {
    height: 56,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
