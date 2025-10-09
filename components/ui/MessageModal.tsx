import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import ReusableText from '@/components/ui/ReusableText';
import { useTranslation } from 'react-i18next';
import SmsVerificationModal from './SmsVerificationModal';

interface MessageModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  listingData: {
    ilan_id: string;
    ilan_baslik: string;
    ilan_gorsel: string;
    diger_uye_id: string;
    diger_uye_adsoyad: string;
  };
}

const MessageModal: React.FC<MessageModalProps> = ({
  visible,
  onClose,
  onSuccess,
  listingData,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);


  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert(t('messages.error'), t('messages.enterMessage'));
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement message sending logic here
      // For now, just simulate success
      setTimeout(() => {
        Alert.alert(
          t('messages.success'),
          t('messages.messageSent'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                setMessage('');
                onClose();
                onSuccess();
              }
            }
          ]
        );
        setLoading(false);
      }, 1000);
    } catch (error) {
      Alert.alert(t('messages.error'), t('messages.sendError'));
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setLoading(false);
    onClose();
  };

  const handleSmsSuccess = () => {
    setShowSmsModal(false);
    // TODO: Implement SMS verification success logic
    // For now, just retry sending the message
    setTimeout(() => {
      handleSendMessage();
    }, 500);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <ReusableText
                text={t('messages.sendMessage')}
                family="bold"
                size={FontSizes.large}
                color={Colors.text}
              />
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Listing Info */}
            <View style={styles.listingInfo}>
              <Image
                source={{ uri: listingData.ilan_gorsel }}
                style={styles.listingImage}
                resizeMode="cover"
              />
              <View style={styles.listingDetails}>
                <ReusableText
                  text={listingData.ilan_baslik}
                  family="medium"
                  size={FontSizes.small}
                  color={Colors.text}
                  maxLength={60}
                />
                <ReusableText
                  text={t('messages.to') + ': ' + listingData.diger_uye_adsoyad}
                  family="regular"
                  size={FontSizes.xSmall}
                  color={Colors.description}
                />
              </View>
            </View>

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder={t('messages.typeMessage')}
                placeholderTextColor={Colors.description}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                editable={!loading}
              />
              <ReusableText
                text={`${message.length}/500`}
                family="regular"
                size={FontSizes.xxSmall}
                color={Colors.description}
                align="right"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={loading}
              >
                <ReusableText
                  text={t('messages.cancel')}
                  family="medium"
                  size={FontSizes.medium}
                  color={Colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={loading || !message.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.lightWhite} />
                ) : (
                  <ReusableText
                    text={t('messages.send')}
                    family="medium"
                    size={FontSizes.medium}
                    color={Colors.lightWhite}
                  />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* SMS Verification Modal */}
      <SmsVerificationModal
        visible={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        onSuccess={handleSmsSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.lightWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
    maxHeight: '70%',
    minHeight: 370,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  closeButton: {
    padding: 4,
  },
  listingInfo: {
    flexDirection: 'row',
    marginBottom: 15,
    padding: 12,
    backgroundColor: Colors.lightInput,
    borderRadius: 12,
  },
  listingImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  listingDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  messageInput: {
    backgroundColor: Colors.lightInput,
    borderRadius: 12,
    padding: 15,
    minHeight: 80,
    maxHeight: 120,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.small,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  sendButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
});

export default MessageModal;
