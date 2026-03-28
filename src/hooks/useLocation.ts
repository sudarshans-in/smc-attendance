import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import { LocationCoords } from '../types';

type LocationState = {
  coords: LocationCoords | null;
  loading: boolean;
  error: string | null;
};

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coords: null,
    loading: false,
    error: null,
  });

  const fetchLocation = useCallback(async (): Promise<LocationCoords | null> => {
    setState({ coords: null, loading: true, error: null });

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
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

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: LocationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      setState({ coords, loading: false, error: null });
      return coords;
    } catch (err) {
      const message = 'Unable to fetch location. Please check GPS settings.';
      setState({ coords: null, loading: false, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ coords: null, loading: false, error: null });
  }, []);

  return { ...state, fetchLocation, reset };
}
