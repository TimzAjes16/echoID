import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import {CameraView, CameraType, useCameraPermissions} from 'expo-camera';

interface QRScannerProps {
  onScan: (data: string) => void;
  onCancel?: () => void;
  title?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onCancel,
  title = 'Scan QR Code',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cameraRef = React.useRef<CameraView>(null);

  // For MVP: Simplified QR scanning
  // In production with EAS Build, use expo-camera's barcode scanner
  const handleManualInput = () => {
    Alert.alert(
      'Manual Input',
      'QR scanning requires barcode scanner. For MVP, please use the handle or wallet address input methods.',
      [{text: 'OK'}],
    );
  };

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

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
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={CameraType.back}
        />
        <View style={styles.overlay}>
          <View style={styles.guideFrame} />
          <Text style={styles.instruction}>Position QR code within the frame</Text>
          <Text style={styles.note}>
            Note: QR scanning requires barcode scanner. For MVP, use manual input.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.manualButton} onPress={handleManualInput}>
        <Text style={styles.manualButtonText}>Enter QR Data Manually</Text>
      </TouchableOpacity>
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  instruction: {
    position: 'absolute',
    bottom: 100,
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
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
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    position: 'absolute',
    bottom: 150,
    color: '#FF9500',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
  },
  manualButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF9500',
    borderRadius: 8,
  },
  manualButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

