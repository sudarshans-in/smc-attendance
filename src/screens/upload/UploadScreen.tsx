import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, Image, Dimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useCamera } from '../../hooks/useCamera';
import { useLocation } from '../../hooks/useLocation';
import { api } from '../../api';
import { sanitizeNotes } from '../../utils/sanitize';
import { Strings } from '../../constants/strings';
import { getTheme } from '../../constants/theme';
import PhotoCard from '../../components/PhotoCard';

const { width: SW, height: SH } = Dimensions.get('window');

export default function UploadScreen() {
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);
  const { todayPhotos, addPhoto, setTodayPhotos } = useAppContext();
  const { takePicture } = useCamera();
  const { coords, loading: locLoading, error: locError, fetchLocation, reset: resetLoc } = useLocation();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const canSubmit = !!imageUri && !!coords && !submitting && !locLoading;

  useFocusEffect(useCallback(() => {
    if (!user) return;
    api.getTodayPhotos(user.id).then(setTodayPhotos).catch(() => {});
  }, [user]));

  const handleCamera = async () => {
    const uri = await takePicture();
    if (uri) { setImageUri(uri); resetLoc(); fetchLocation(); }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user || !coords || !imageUri) return;
    setSubmitting(true);
    try {
      addPhoto(await api.uploadWorkPhoto(user.id, imageUri, sanitizeNotes(notes), coords));
      setSnackbar(Strings.uploadSuccess);
      setImageUri(null); setNotes(''); resetLoc();
    } catch { setSnackbar(Strings.uploadError); }
    finally { setSubmitting(false); }
  };

  const locColor = locLoading ? t.accent : locError ? t.errorColor : coords ? t.success : t.textMuted;
  const locIcon  = locLoading ? 'loading' : locError ? 'map-marker-off' : coords ? 'map-marker-check' : 'map-marker-question';
  const locLabel = locLoading ? Strings.locationFetching : locError ? Strings.locationFailed : coords ? Strings.locationReady : '';

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]} edges={['top']}>
      {/* Navbar */}
      <View style={[s.navbar, { backgroundColor: t.headerBg, borderBottomColor: t.headerBorder }]}>
        <MaterialCommunityIcons name="camera-plus-outline" size={20} color={t.primary} />
        <Text style={[s.navTitle, { color: t.text }]}>{Strings.uploadTitle}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Upload area card */}
          <View style={[s.uploadCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <TouchableOpacity style={[s.cameraBtn, { backgroundColor: t.primary, shadowColor: t.primary }]} onPress={handleCamera} disabled={submitting} activeOpacity={0.85}>
              <MaterialCommunityIcons name="camera-outline" size={20} color="#fff" />
              <Text style={s.cameraBtnText}>{Strings.takePhoto}</Text>
            </TouchableOpacity>

            {imageUri ? (
              <View style={[s.previewBox, { borderColor: t.border }]}>
                <Image source={{ uri: imageUri }} style={s.previewImg} resizeMode="cover" />
                {!!locLabel && (
                  <View style={[s.locBar, { backgroundColor: t.surfaceVar, borderTopColor: t.border }]}>
                    <MaterialCommunityIcons name={locIcon as any} size={13} color={locColor} />
                    <Text style={[s.locText, { color: locColor }]}>{locLabel}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[s.placeholder, { borderColor: t.border, backgroundColor: t.surfaceVar }]}>
                <MaterialCommunityIcons name="image-plus" size={36} color={t.textMuted} />
                <Text style={[s.placeholderText, { color: t.textMuted }]}>{Strings.noPhotoSelected}</Text>
              </View>
            )}

            {/* Notes */}
            <View style={s.field}>
              <Text style={[s.label, { color: t.textSub }]}>{Strings.notesLabel}</Text>
              <View style={[s.notesWrap, { backgroundColor: t.surface, borderColor: t.border }]}>
                <MaterialCommunityIcons name="text-box-outline" size={16} color={t.textSub} style={{ marginTop: 1 }} />
                <TextInput
                  style={[s.notesInput, { color: t.text }]}
                  placeholder={Strings.notesPlaceholder}
                  placeholderTextColor={t.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  editable={!submitting}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.submitBtn, canSubmit ? { backgroundColor: t.accent } : { backgroundColor: isDark ? t.surfaceVar : '#E9ECEF' }]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={16} color={canSubmit ? '#fff' : t.textMuted} />
                  <Text style={[s.submitText, { color: canSubmit ? '#fff' : t.textMuted }]}>{Strings.submitPhoto}</Text>
                </>
              )}
            </TouchableOpacity>

            {!imageUri && <Text style={[s.hint, { color: t.textMuted }]}>{Strings.uploadHint}</Text>}
            {imageUri && !coords && !locLoading && <Text style={[s.hint, { color: t.errorColor }]}>{Strings.locationRequiredHint}</Text>}
          </View>

          {/* Uploaded photos section */}
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: t.text }]}>{Strings.tabTodayPhotos}</Text>
            {todayPhotos.length > 0 && (
              <View style={[s.countPill, { backgroundColor: t.successBg }]}>
                <Text style={[s.countPillText, { color: t.successText }]}>{todayPhotos.length} uploaded</Text>
              </View>
            )}
          </View>

          {todayPhotos.length === 0 ? (
            <View style={[s.empty, { backgroundColor: t.surface, borderColor: t.border }]}>
              <MaterialCommunityIcons name="image-off-outline" size={36} color={t.textMuted} />
              <Text style={[s.emptyText, { color: t.textMuted }]}>{Strings.noPhotosToday}</Text>
            </View>
          ) : todayPhotos.map((p) => <PhotoCard key={p.id} photo={p} onPress={() => setPreviewUri(p.imageUri)} />)}
        </ScrollView>
      </KeyboardAvoidingView>

      {!!snackbar && (
        <View style={[s.snackbar, { backgroundColor: t.snackbar }]}>
          <Text style={s.snackMsg}>{snackbar}</Text>
          <TouchableOpacity onPress={() => setSnackbar('')}><Text style={[s.snackAction, { color: t.primaryLight }]}>OK</Text></TouchableOpacity>
        </View>
      )}

      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setPreviewUri(null)}>
          {previewUri && <Image source={{ uri: previewUri }} style={{ width: SW, height: SH * 0.8 }} resizeMode="contain" />}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1 },
  navbar:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
  navTitle:        { fontSize: 16, fontWeight: '700' },
  scroll:          { padding: 16, paddingBottom: 40, gap: 16 },
  uploadCard:      { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  cameraBtn:       { height: 52, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 3, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 },
  cameraBtnText:   { color: '#fff', fontSize: 15, fontWeight: '600' },
  previewBox:      { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  previewImg:      { width: '100%', height: 200 },
  locBar:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1 },
  locText:         { fontSize: 12, fontWeight: '500' },
  placeholder:     { height: 140, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { fontSize: 13 },
  field:           { gap: 6 },
  label:           { fontSize: 13, fontWeight: '600' },
  notesWrap:       { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingTop: 12, gap: 8, minHeight: 80, borderWidth: 1.5 },
  notesInput:      { flex: 1, fontSize: 14, paddingBottom: 12 },
  submitBtn:       { height: 52, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText:      { fontSize: 15, fontWeight: '600' },
  hint:            { fontSize: 12, textAlign: 'center' },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:    { fontSize: 15, fontWeight: '700' },
  countPill:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countPillText:   { fontSize: 12, fontWeight: '600' },
  empty:           { borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  emptyText:       { fontSize: 14 },
  snackbar:        { position: 'absolute', bottom: 16, left: 16, right: 16, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 8 },
  snackMsg:        { flex: 1, color: '#fff', fontSize: 14 },
  snackAction:     { fontSize: 13, fontWeight: '700' },
  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', alignItems: 'center', justifyContent: 'center' },
});
