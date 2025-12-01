import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import ReusableText from '@/components/ui/ReusableText';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { validateCoupon } from '@/redux/actions/couponActions';
import { loadUser } from '@/redux/actions/userActions';

interface CouponModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CouponModal: React.FC<CouponModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert(t('common.error'), t('coupon.enterCode'));
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(validateCoupon(couponCode.trim().toUpperCase()) as any);
      
      if (validateCoupon.fulfilled.match(result)) {
        // Reload user data to get updated coupon status
        await dispatch(loadUser() as any);
        
        Alert.alert(
          t('common.success'),
          result.payload.message || t('coupon.success'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                setCouponCode('');
                onClose();
                if (onSuccess) {
                  onSuccess();
                }
              }
            }
          ]
        );
      } else if (validateCoupon.rejected.match(result)) {
        Alert.alert(
          t('common.error'),
          result.payload as string || t('coupon.error')
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCouponCode('');
    setLoading(false);
    onClose();
  };

  return (
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
              text={t('coupon.title')}
              family="bold"
              size={FontSizes.large}
              color={Colors.text}
            />
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ReusableText
              text={t('coupon.description')}
              family="regular"
              size={FontSizes.medium}
              color={Colors.text}
              align="center"
            />

            {/* Coupon Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder={t('coupon.placeholder')}
                placeholderTextColor={Colors.description}
                value={couponCode}
                onChangeText={(text) => setCouponCode(text.toUpperCase())}
                autoCapitalize="characters"
                editable={!loading}
                maxLength={10}
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
                  text={t('common.cancel')}
                  family="medium"
                  size={FontSizes.medium}
                  color={Colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleValidateCoupon}
                disabled={loading || !couponCode.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.lightWhite} />
                ) : (
                  <ReusableText
                    text={t('coupon.submit')}
                    family="medium"
                    size={FontSizes.medium}
                    color={Colors.lightWhite}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  },
  modalContainer: {
    backgroundColor: Colors.lightWhite,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    width: '90%',
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
    gap: 20,
  },
  inputContainer: {
    marginVertical: 10,
  },
  couponInput: {
    backgroundColor: Colors.lightInput,
    borderRadius: 12,
    padding: 15,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.medium,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
});

export default CouponModal;

