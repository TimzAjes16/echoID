import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import {useConsentStore} from '../state/useConsentStore';

interface Message {
  id: string;
  text: string;
  from: string;
  timestamp: number;
  encrypted: boolean;
}

interface ChatProps {
  consentId: string;
}

export const Chat: React.FC<ChatProps> = ({consentId}) => {
  const {getConsent, updateConsent, wallet} = useConsentStore();
  const consentData = getConsent(consentId);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (consentData?.localData?.chatHistory) {
      setMessages(consentData.localData.chatHistory);
    }
  }, [consentData]);

  const isUnlocked = consentData?.status === 'unlocked';

  const sendMessage = () => {
    if (!message.trim() || !isUnlocked || !wallet.address) {
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      from: wallet.address,
      timestamp: Date.now(),
      encrypted: false, // Will be encrypted before storage
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // Update consent with new message
    updateConsent(consentId, {
      localData: {
        ...consentData?.localData,
        chatHistory: updatedMessages,
      },
    });

    setMessage('');
  };

  if (!isUnlocked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>
          Chat is locked. Both parties must unlock this consent to access messages.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => {
          const isMine = item.from.toLowerCase() === wallet.address?.toLowerCase();
          return (
            <View style={[styles.messageContainer, isMine && styles.myMessage]}>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          );
        }}
        style={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockedText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  myMessageText: {
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
