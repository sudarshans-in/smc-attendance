import { useCallback } from 'react';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
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

async function requestStoragePermission(): Promise<boolean> {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    {
      title: 'Gallery Permission Required',
      message: 'Gallery access is needed to select work photos. Please allow it.',
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

  const pickFromGallery = useCallback(async (): Promise<string | null> => {
    const granted = await requestStoragePermission();
    if (!granted) {
      Alert.alert(
        'Gallery Permission Required',
        'Gallery access is needed to select work photos. Please allow it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return null;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: false,
    });

    if (result.didCancel || !result.assets?.length) return null;
    return result.assets[0].uri ?? null;
  }, []);

  return { takePicture, pickFromGallery };
}
