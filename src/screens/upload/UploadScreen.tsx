import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Button, TextInput, Snackbar, Appbar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { sanitizeNotes } from '../../utils/sanitize';
import { useAppContext } from '../../context/AppContext';
import { useCamera } from '../../hooks/useCamera';
import { useLocation } from '../../hooks/useLocation';
import { api } from '../../api';
import { Strings } from '../../constants/strings';
import { Colors } from '../../constants/colors';

export default function UploadScreen() {
  const { user } = useAuth();
  const { addPhoto } = useAppContext();
  const { takePicture, pickFromGallery } = useCamera();
  const { coords, loading: locationLoading, error: locationError, fetchLocation, reset: resetLocation } = useLocation();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState('');

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

  const handleGallery = async () => {
    const uri = await pickFromGallery();
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
    <SafeAreaView style={styles.safe} edges={['top']}>
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
          {/* Photo source buttons */}
          <View style={styles.photoButtons}>
            <Button
              mode="contained"
              onPress={handleCamera}
              style={[styles.photoButton, { backgroundColor: Colors.primary }]}
              contentStyle={styles.photoButtonContent}
              labelStyle={styles.photoButtonLabel}
              icon="camera"
              disabled={submitting}
              accessibilityLabel={Strings.takePhoto}
            >
              {Strings.takePhoto}
            </Button>
            <View style={styles.buttonGap} />
            <Button
              mode="outlined"
              onPress={handleGallery}
              style={styles.photoButton}
              contentStyle={styles.photoButtonContent}
              labelStyle={styles.photoButtonLabel}
              icon="image"
              disabled={submitting}
              accessibilityLabel={Strings.chooseGallery}
            >
              {Strings.chooseGallery}
            </Button>
          </View>

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
              Take a photo or choose from gallery, then tap Submit
            </Text>
          )}
          {imageUri && !coords && !locationLoading && (
            <Text variant="bodySmall" style={styles.hintError}>
              Location required. Tap Retry to fetch GPS.
            </Text>
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
  photoButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    borderRadius: 8,
  },
  photoButtonContent: { height: 56 },
  photoButtonLabel: { fontSize: 15, fontWeight: '700' },
  buttonGap: { width: 12 },
  previewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Colors.surfaceVariant,
  },
  preview: {
    width: '100%',
    height: 220,
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
});
