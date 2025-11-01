import React, {useState, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {Audio} from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

interface RecorderProps {
  onRecordingComplete: (audioPath: string) => void;
  script: string;
}

export const Recorder: React.FC<RecorderProps> = ({onRecordingComplete, script}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPathRef = useRef<string>('');

  const startRecording = async () => {
    try {
      // Request permissions
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const {recording} = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      
      recordingRef.current = recording;
      
      // Save path
      const fileName = `recording_${Date.now()}.m4a`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      audioPathRef.current = fileUri;
      
      setIsRecording(true);
      setDuration(0);

      // Update duration every second
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
      console.error(error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) {
        return;
      }

      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (audioPathRef.current) {
        onRecordingComplete(audioPathRef.current);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
      console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.scriptText}>{script}</Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isRecording ? styles.stopButton : styles.recordButton]}
          onPress={isRecording ? stopRecording : startRecording}>
          <Text style={styles.buttonText}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>
        {isRecording && <Text style={styles.duration}>{formatTime(duration)}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  scriptText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  controls: {
    alignItems: 'center',
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    minWidth: 180,
    alignItems: 'center',
    ...shadows.sm,
  },
  recordButton: {
    backgroundColor: colors.primary,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  duration: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
  },
});

