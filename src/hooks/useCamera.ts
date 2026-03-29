import { useCallback } from 'react';
import { launchCamera } from 'react-native-image-picker';
import { Alert, Linking, PermissionsAndroid } from 'react-native';

async function requestCameraPermission(): Promise<boolean> {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera Permission Required',
      message: 'Camera access is needed to take work photos. Please allow it.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'Allow',
    }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function useCamera() {
  const takePicture = useCallback(async (): Promise<string | null> => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert(
        'Camera Permission Required',
        'Camera access is needed to take work photos. Please allow it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return null;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: false,
    });

    if (result.didCancel || !result.assets?.length) return null;
    return result.assets[0].uri ?? null;
  }, []);

  return { takePicture };
}
