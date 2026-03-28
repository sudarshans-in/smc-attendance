import { useState, useCallback } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { LocationCoords } from '../types';

type LocationState = {
  coords: LocationCoords | null;
  loading: boolean;
  error: string | null;
};

async function requestAndroidPermission(): Promise<boolean> {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Required',
      message: 'Location access is needed to mark your attendance. Please allow location permission.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'Allow',
    }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coords: null,
    loading: false,
    error: null,
  });

  const fetchLocation = useCallback(async (): Promise<LocationCoords | null> => {
    setState({ coords: null, loading: true, error: null });

    try {
      if (Platform.OS === 'android') {
        const granted = await requestAndroidPermission();
        if (!granted) {
          Alert.alert(
            'Location Required',
            'Location access is needed to mark your attendance. Please allow location permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          setState({ coords: null, loading: false, error: 'Permission denied' });
          return null;
        }
      }

      const coords = await new Promise<LocationCoords>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => reject(error),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
      });

      setState({ coords, loading: false, error: null });
      return coords;
    } catch (err) {
      const message = 'Unable to fetch location. Please check that GPS is turned on and try again.';
      setState({ coords: null, loading: false, error: message });
      Alert.alert('Location Error', message, [{ text: 'OK' }]);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ coords: null, loading: false, error: null });
  }, []);

  return { ...state, fetchLocation, reset };
}
