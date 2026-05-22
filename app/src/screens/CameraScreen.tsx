import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import CameraGuide from '../components/CameraGuide';
import LoadingOverlay from '../components/LoadingOverlay';
import { extractSalesData } from '../services/ocrService';
import { saveSalesData } from '../services/storageService';
import { RootStackParamList } from '../types';

type CameraNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function CameraScreen() {
  const navigation = useNavigation<CameraNavProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Failed to take picture. Please try again.');
    }
  }, []);

  const retake = useCallback(() => {
    setCapturedUri(null);
  }, []);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setCapturedUri(result.assets[0].uri);
    }
  }, []);

  const usePhoto = useCallback(async () => {
    if (!capturedUri) return;
    setIsProcessing(true);

    try {
      // Compress and resize the image for efficient upload
      const manipulated = await ImageManipulator.manipulateAsync(
        capturedUri,
        [{ resize: { width: 1600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Read as base64
      const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to backend for OCR extraction
      const salesData = await extractSalesData(base64, capturedUri, 'image/jpeg');

      // Persist to local storage
      await saveSalesData(salesData);

      // Navigate to review screen
      setCapturedUri(null);
      navigation.navigate('Review', { salesData });
    } catch (err) {
      const error = err as Error;
      Alert.alert(
        'Processing Failed',
        error.message || 'Could not extract payment data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [capturedUri, navigation]);

  // Permission not yet determined
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Sales Capture needs access to your camera to photograph sales records.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Preview captured image
  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedUri }} style={styles.preview} resizeMode="contain" />

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={retake} activeOpacity={0.8}>
            <Text style={styles.retakeButtonIcon}>🔄</Text>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.usePhotoButton} onPress={usePhoto} activeOpacity={0.85}>
            <Text style={styles.usePhotoButtonIcon}>✓</Text>
            <Text style={styles.usePhotoButtonText}>Use Photo</Text>
          </TouchableOpacity>
        </View>

        <LoadingOverlay visible={isProcessing} message="Extracting payment data..." />
      </View>
    );
  }

  // Live camera view
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        {/* Camera guide overlay */}
        <CameraGuide hint="Align your sales record within the frame" />

        {/* Top controls */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash} activeOpacity={0.7}>
            <Text style={styles.controlButtonText}>{flash === 'off' ? '⚡' : '⚡'}</Text>
            <Text style={styles.controlLabel}>{flash === 'off' ? 'Flash Off' : 'Flash On'}</Text>
          </TouchableOpacity>

          <View style={styles.topSpacer} />

          <TouchableOpacity style={styles.controlButton} onPress={toggleFacing} activeOpacity={0.7}>
            <Text style={styles.controlButtonText}>🔄</Text>
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Bottom capture area */}
        <View style={styles.bottomControls}>
          <View style={styles.captureRow}>
            {/* Gallery button */}
            <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery} activeOpacity={0.7}>
              <Text style={styles.galleryButtonText}>🖼️</Text>
              <Text style={styles.controlLabel}>Gallery</Text>
            </TouchableOpacity>

            {/* Capture button */}
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Flash indicator */}
            <View style={styles.flashIndicator}>
              {flash === 'on' && <View style={styles.flashOnDot} />}
            </View>
          </View>

          <Text style={styles.captureHint}>Tap to capture</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 8,
  },
  topSpacer: {
    flex: 1,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  controlButtonText: {
    fontSize: 18,
  },
  controlLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  bottomControls: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 16,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  flashIndicator: {
    width: 60,
    alignItems: 'center',
  },
  galleryButton: {
    width: 60,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  galleryButtonText: {
    fontSize: 22,
  },
  flashOnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    marginHorizontal: 20,
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ffffff',
  },
  captureHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  // Preview styles
  preview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewActions: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 20,
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  retakeButtonIcon: {
    fontSize: 18,
  },
  retakeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  usePhotoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  usePhotoButtonIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  usePhotoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Permission styles
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIcon: {
    fontSize: 56,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
