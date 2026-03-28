import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Button, TextInput, Snackbar, Appbar, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { sanitizeNotes } from '../../utils/sanitize';
import { useAppContext } from '../../context/AppContext';
import { useCamera } from '../../hooks/useCamera';
import { useLocation } from '../../hooks/useLocation';
import { api } from '../../api';
import { Strings } from '../../constants/strings';
import { Colors } from '../../constants/colors';
import PhotoCard from '../../components/PhotoCard';

export default function UploadScreen() {
  const { user } = useAuth();
  const { todayPhotos, addPhoto, setTodayPhotos } = useAppContext();
  const { takePicture } = useCamera();
  const { coords, loading: locationLoading, error: locationError, fetchLocation, reset: resetLocation } = useLocation();

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      (async () => {
        try {
          const photos = await api.getTodayPhotos(user.id);
          setTodayPhotos(photos);
        } catch {
          // silent fail
        }
      })();
    }, [user])
  );

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const canSubmit = !!imageUri && !!coords && !submitting && !locationLoading;

  const handleImageSelected = async (uri: string) => {
    setImageUri(uri);
    resetLocation();
    fetchLocation();
  };

  const handleCamera = async () => {
    const uri = await takePicture();
    if (uri) handleImageSelected(uri);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user || !coords || !imageUri) return;
    setSubmitting(true);
    try {
      const photo = await api.uploadWorkPhoto(user.id, imageUri, sanitizeNotes(notes), coords);
      addPhoto(photo);
      setSnackbar(Strings.uploadSuccess);
      setImageUri(null);
      setNotes('');
      resetLocation();
    } catch {
      setSnackbar(Strings.uploadError);
    } finally {
      setSubmitting(false);
    }
  };

  const locationStatusText = () => {
    if (locationLoading) return Strings.locationFetching;
    if (locationError) return Strings.locationFailed;
    if (coords) return Strings.locationReady;
    return '';
  };

  const locationStatusColor = () => {
    if (locationLoading) return Colors.info;
    if (locationError) return Colors.error;
    if (coords) return Colors.success;
    return Colors.onSurfaceVariant;
  };

  const locationIcon = () => {
    if (locationLoading) return 'loading';
    if (locationError) return 'map-marker-off';
    if (coords) return 'map-marker-check';
    return 'map-marker-question';
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Content title={Strings.uploadTitle} titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Camera button */}
          <Button
            mode="contained"
            onPress={handleCamera}
            style={[styles.cameraButton, { backgroundColor: Colors.primary }]}
            contentStyle={styles.cameraButtonContent}
            labelStyle={styles.cameraButtonLabel}
            icon="camera"
            disabled={submitting}
            accessibilityLabel={Strings.takePhoto}
          >
            {Strings.takePhoto}
          </Button>

          {/* Image preview */}
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.preview}
                resizeMode="cover"
                accessibilityLabel={Strings.photoPreviewAlt}
              />
              {locationStatusText() !== '' && (
                <Chip
                  icon={locationIcon()}
                  style={[styles.locationChip, { backgroundColor: locationStatusColor() + '20' }]}
                  textStyle={{ color: locationStatusColor(), fontSize: 12, fontWeight: '600' }}
                  compact
                >
                  {locationStatusText()}
                </Chip>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialCommunityIcons name="image-plus" size={48} color={Colors.outline} />
              <Text variant="bodyMedium" style={styles.placeholderText}>
                {Strings.noPhotoSelected}
              </Text>
            </View>
          )}

          {/* Notes */}
          <TextInput
            label={Strings.notesLabel}
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.notes}
            placeholder={Strings.notesPlaceholder}
            left={<TextInput.Icon icon="text" />}
            accessibilityLabel={Strings.notesLabel}
            disabled={submitting}
          />

          {/* Submit */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            style={[styles.submitButton, { backgroundColor: Colors.info }]}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonLabel}
            icon="cloud-upload"
            accessibilityLabel={Strings.submitPhoto}
          >
            {Strings.submitPhoto}
          </Button>

          {!imageUri && (
            <Text variant="bodySmall" style={styles.hint}>
              {Strings.uploadHint}
            </Text>
          )}
          {imageUri && !coords && !locationLoading && (
            <Text variant="bodySmall" style={styles.hintError}>
              {Strings.locationRequiredHint}
            </Text>
          )}

          {/* Uploaded work photos */}
          <Divider style={styles.divider} />
          <View style={styles.photosHeader}>
            <MaterialCommunityIcons name="camera-outline" size={20} color={Colors.onSurface} />
            <Text variant="titleSmall" style={styles.photosTitle}>
              {Strings.tabTodayPhotos}
            </Text>
            {todayPhotos.length > 0 && (
              <Text variant="bodySmall" style={styles.photosCount}>
                {Strings.photosTodayCount(todayPhotos.length)}
              </Text>
            )}
          </View>
          {todayPhotos.length === 0 ? (
            <View style={styles.emptyPhotos}>
              <MaterialCommunityIcons name="image-off-outline" size={36} color={Colors.outline} />
              <Text variant="bodyMedium" style={styles.emptyPhotosText}>
                {Strings.noPhotosToday}
              </Text>
            </View>
          ) : (
            todayPhotos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onPress={() => setPreviewUri(photo.imageUri)} />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbar('') }}
      >
        {snackbar}
      </Snackbar>

      {/* Fullscreen photo preview modal */}
      <Modal
        visible={!!previewUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPreviewUri(null)}
        >
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  appbar: { backgroundColor: Colors.surface },
  appbarTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  cameraButton: {
    borderRadius: 8,
    marginBottom: 16,
  },
  cameraButtonContent: { height: 56 },
  cameraButtonLabel: { fontSize: 16, fontWeight: '700' },
  previewContainer: {
    marginBottom: 16,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  locationChip: {
    margin: 8,
    alignSelf: 'flex-start',
  },
  placeholderContainer: {
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: Colors.surfaceVariant,
    gap: 8,
  },
  placeholderText: {
    color: Colors.outline,
  },
  notes: {
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 8,
    marginBottom: 8,
  },
  submitButtonContent: { height: 56 },
  submitButtonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  hint: {
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  hintError: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    marginTop: 24,
    marginBottom: 20,
  },
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  photosTitle: {
    flex: 1,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  photosCount: {
    color: Colors.onSurfaceVariant,
  },
  emptyPhotos: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyPhotosText: {
    color: Colors.onSurfaceVariant,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
});
