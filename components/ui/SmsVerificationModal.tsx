import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import ReusableText from '@/components/ui/ReusableText';
import { useTranslation } from 'react-i18next';

interface SmsVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SmsVerificationModal: React.FC<SmsVerificationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t('messages.error'), t('messages.enterPhoneNumber'));
      return;
    }

    // Format phone number to ensure it starts with 5 and has correct format
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.length !== 10 || !formattedPhone.startsWith('5')) {
      Alert.alert(t('messages.error'), t('messages.invalidPhoneFormat'));
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement SMS sending logic here
      // For now, just simulate success
      setTimeout(() => {
        setStep('code');
        Alert.alert(t('messages.success'), t('messages.smsCodeSent'));
        setLoading(false);
      }, 1000);
    } catch (error) {
      Alert.alert(t('messages.error'), t('messages.smsCodeSendError'));
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert(t('messages.error'), t('messages.enterVerificationCode'));
      return;
    }

    if (verificationCode.length !== 4) {
      Alert.alert(t('messages.error'), t('messages.invalidCodeFormat'));
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement SMS verification logic here
      // For now, just simulate success
      setTimeout(() => {
        Alert.alert(t('messages.success'), t('messages.phoneVerified'), [
          {
            text: t('messages.ok'),
            onPress: () => {
              handleClose();
              onSuccess();
            }
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      Alert.alert(t('messages.error'), t('messages.codeVerificationError'));
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    setLoading(false);
    onClose();
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    
    // Format as 5XX XXX XX XX
    if (limited.length >= 7) {
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 8)} ${limited.slice(8, 10)}`;
    } else if (limited.length >= 4) {
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
    } else {
      return limited;
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <ReusableText
              text={step === 'phone' ? t('messages.phoneVerification') : t('messages.enterVerificationCode')}
              family="bold"
              size={FontSizes.large}
              color={Colors.text}
            />
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {step === 'phone' ? (
              <>
                <ReusableText
                  text={t('messages.phoneVerificationDesc')}
                  family="regular"
                  size={FontSizes.small}
                  color={Colors.description}
                  align="center"
                />
                
                <View style={styles.inputContainer}>
                  <View style={styles.phoneInputWrapper}>
                    <ReusableText
                      text="+90"
                      family="medium"
                      size={FontSizes.medium}
                      color={Colors.text}
                    />
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="5XX XXX XX XX"
                      placeholderTextColor={Colors.description}
                      value={phoneNumber}
                      onChangeText={handlePhoneNumberChange}
                      keyboardType="numeric"
                      maxLength={13} // Formatted length
                      editable={!loading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.lightWhite} />
                  ) : (
                    <ReusableText
                      text={t('messages.sendCode')}
                      family="medium"
                      size={FontSizes.medium}
                      color={Colors.lightWhite}
                    />
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ReusableText
                  text={t('messages.codeVerificationDesc')}
                  family="regular"
                  size={FontSizes.small}
                  color={Colors.description}
                  align="center"
                />
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="1234"
                    placeholderTextColor={Colors.description}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="numeric"
                    maxLength={4}
                    textAlign="center"
                    editable={!loading}
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setStep('phone')}
                    disabled={loading}
                  >
                    <ReusableText
                      text={t('messages.back')}
                      family="medium"
                      size={FontSizes.medium}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.verifyButton, loading && styles.buttonDisabled]}
                    onPress={handleVerifyCode}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={Colors.lightWhite} />
                    ) : (
                      <ReusableText
                        text={t('messages.verify')}
                        family="medium"
                        size={FontSizes.medium}
                        color={Colors.lightWhite}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  modalContainer: {
    backgroundColor: Colors.lightWhite,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
    marginVertical: 20,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  phoneInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: FontSizes.medium,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },
  codeInput: {
    backgroundColor: Colors.lightInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    fontSize: FontSizes.xLarge,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    letterSpacing: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  backButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    flex: 1,
  },
  verifyButton: {
    flex: 1,
  },
});

export default SmsVerificationModal; 