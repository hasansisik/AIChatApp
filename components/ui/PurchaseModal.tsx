import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import ReusableText from '@/components/ui/ReusableText';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { getPublicSettings } from '@/redux/actions/settingsActions';
import { RootState } from '@/redux/store';
import HeightSpacer from './HeightSpacer';

interface PurchaseModalProps {
  visible: boolean;
  onClose: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { publicSettings, loading } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    if (visible && !publicSettings && !loading) {
      dispatch(getPublicSettings() as any);
    }
  }, [visible, publicSettings, loading, dispatch]);

  const contactInfo = publicSettings ? {
    whatsapp: publicSettings.contactWhatsapp,
    phone: publicSettings.contactPhone,
    whatsappMessage: publicSettings.contactWhatsappMessage
  } : {
    whatsapp: "+908503074191",
    phone: "+90 850 307 4195",
    whatsappMessage: "Merhaba, EnglishCard satın almak istiyorum."
  };

  const handleWhatsApp = async () => {
    
    try {
      // WhatsApp numarasını temizle (sadece rakamlar)
      const cleanPhone = contactInfo.whatsapp.replace(/[^0-9]/g, '');
      
      // Önce WhatsApp uygulamasını açmayı dene
      const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(contactInfo.whatsappMessage)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        // WhatsApp uygulaması yüklü, aç
        await Linking.openURL(whatsappUrl);
      } else {
        // WhatsApp uygulaması yok, web WhatsApp'ı aç
        const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(contactInfo.whatsappMessage)}`;
        await Linking.openURL(webUrl);
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('common.cannotOpenWhatsApp'));
    }
  };

  const handlePhoneCall = async () => {
    
    try {
      // Telefon numarasını temizle (sadece rakamlar ve +)
      const phoneNumber = contactInfo.phone.replace(/[^0-9+]/g, '');
      
      // iOS için telprompt (onay ister), Android için tel (direkt arar)
      const url = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
      
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('common.cannotMakeCall'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('common.cannotMakeCall'));
    }
  };

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
              text={t('purchase.title')}
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
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <ReusableText
                  text={t('common.loading')}
                  family="regular"
                  size={FontSizes.small}
                  color={Colors.description}
                />
              </View>
            ) : (
              <>
                <ReusableText
                  text={t('purchase.description')}
                  family="regular"
                  size={FontSizes.medium}
                  color={Colors.text}
                  align="center"
                />
                
                <View style={styles.contactInfo}>
                  <ReusableText
                    text={t('purchase.contactUs')}
                    family="medium"
                    size={FontSizes.medium}
                    color={Colors.text}
                    align="center"
                  />
                  <ReusableText
                    text={contactInfo?.phone || ""}
                    family="regular"
                    size={FontSizes.small}
                    color={Colors.description}
                    align="center"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={handleWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={24} color={Colors.lightWhite} />
                <ReusableText
                  text={t('purchase.contactWhatsApp')}
                  family="medium"
                  size={FontSizes.medium}
                  color={Colors.lightWhite}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.phoneButton}
                onPress={handlePhoneCall}
              >
                <Ionicons name="call" size={24} color={Colors.primary} />
                <ReusableText
                  text={t('purchase.contactPhone')}
                  family="medium"
                  size={FontSizes.medium}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>

                <ReusableText
                  text={t('purchase.note')}
                  family="regular"
                  size={FontSizes.xSmall}
                  color={Colors.description}
                  align="center"
                />
                <HeightSpacer height={5} />
              </>
            )}
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
    backgroundColor: Colors.background,
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
    gap: 20,
  },
  contactInfo: {
    gap: 8,
    paddingVertical: 10,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  buttonContainer: {
    gap: 12,
    
  },
  whatsappButton: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  phoneButton: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    
  },
});

export default PurchaseModal;

