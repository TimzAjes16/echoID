import React, {useState, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {CameraView, CameraType, useCameraPermissions} from 'expo-camera';

interface SelfieCaptureProps {
  onCaptureComplete: (imagePath: string) => void;
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({onCaptureComplete}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isReady, setIsReady] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      onCaptureComplete(photo.uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error(error);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={CameraType.front}
        onCameraReady={() => setIsReady(true)}
      />
      <View style={styles.overlay}>
        <View style={styles.guideFrame} />
        <TouchableOpacity
          style={[styles.captureButton, !isReady && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={!isReady}>
          <Text style={styles.captureButtonText}>Capture</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: 250,
    height: 300,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  captureButtonDisabled: {
    backgroundColor: '#999',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

