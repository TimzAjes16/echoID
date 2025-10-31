import React, {useState, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';

interface SelfieCaptureProps {
  onCaptureComplete: (imagePath: string) => void;
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({onCaptureComplete}) => {
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);

  const [isReady, setIsReady] = useState(false);

  const handleCapture = async () => {
    if (!camera.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
      });
      onCaptureComplete(photo.path);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error(error);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        onInitialized={() => setIsReady(true)}
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
