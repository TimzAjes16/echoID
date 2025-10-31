import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Alert} from 'react-native';
import QRCodeSvg from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';

interface QRCodeViewProps {
  value: string;
  size?: number;
  showFullValue?: boolean;
  onShare?: () => void;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 200,
  showFullValue = false,
  onShare,
}) => {
  const handleCopy = () => {
    Clipboard.setString(value);
    Alert.alert('Copied', 'QR code data copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCodeSvg
          value={value}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
          logoMargin={2}
          logoSize={size * 0.2}
          logoBackgroundColor="transparent"
        />
      </View>
      {showFullValue && (
        <View style={styles.valueContainer}>
          <Text style={styles.valueText} numberOfLines={2} ellipsizeMode="middle">
            {value}
          </Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}
      {onShare && (
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>Share QR Code</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  valueContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
  },
  copyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  shareButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
