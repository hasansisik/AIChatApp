import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import ReusableText from '@/components/ui/ReusableText';
import { useTranslation } from 'react-i18next';

interface CouponSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onHasCoupon: () => void;
  onNoCoupon: () => void;
}

const CouponSelectionModal: React.FC<CouponSelectionModalProps> = ({
  visible,
  onClose,
  onHasCoupon,
  onNoCoupon,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <ReusableText
              text={t('coupon.selection.title')}
              family="bold"
              size={FontSizes.large}
              color={Colors.text}
            />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ReusableText
              text={t('coupon.selection.description')}
              family="regular"
              size={FontSizes.medium}
              color={Colors.text}
              align="center"
            />

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.yesButton}
                onPress={() => {
                  onClose();
                  onHasCoupon();
                }}
              >
                <Ionicons name="checkmark-circle" size={24} color={Colors.lightWhite} />
                <ReusableText
                  text={t('coupon.selection.hasCoupon')}
                  family="medium"
                  size={FontSizes.medium}
                  color={Colors.lightWhite}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.noButton}
                onPress={() => {
                  onClose();
                  onNoCoupon();
                }}
              >
                <Ionicons name="close-circle" size={24} color={Colors.primary} />
                <ReusableText
                  text={t('coupon.selection.noCoupon')}
                  family="medium"
                  size={FontSizes.medium}
                  color={Colors.primary}
                />
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, // Extra padding at bottom for keyboard
    width: '90%',
    maxWidth: 400,
    marginBottom: 20, // Extra margin for keyboard
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
    gap: 24,
  },
  buttonContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  yesButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  noButton: {
    flexDirection: 'row',
    backgroundColor: Colors.lightWhite,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});

export default CouponSelectionModal;

