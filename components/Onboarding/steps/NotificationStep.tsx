import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReusableText from '@/components/ui/ReusableText';
import ReusableButton from '@/components/ui/ReusableButton';
import { Colors } from '@/hooks/useThemeColor';
import { Sizes } from '@/constants/Sizes';

interface NotificationStepProps {
  data: {
    notificationsEnabled: boolean;
  };
  onUpdate: (key: string, value: any) => void;
}

const NotificationStep: React.FC<NotificationStepProps> = ({ data, onUpdate }) => {
  const handleEnable = () => {
    onUpdate('notificationsEnabled', true);
  };

  const handleDisable = () => {
    onUpdate('notificationsEnabled', false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name="notifications-outline" 
            size={80} 
            color={Colors.primary} 
          />
        </View>
        
        <ReusableText
          text="Bildirimlere izin ver"
          family="bold"
          size={24}
          color={Colors.black}
          align="center"
          style={styles.title}
        />
        <ReusableText
          text="Günlük hatırlatmalar ve önemli güncellemeler için bildirimleri etkinleştirin"
          family="regular"
          size={16}
          color={Colors.gray}
          align="center"
          style={styles.subtitle}
        />
      </View>

      <View style={styles.buttonContainer}>
        <ReusableButton
          onPress={handleEnable}
          btnText="Bildirimleri Etkinleştir"
          textColor={Colors.white}
          textFontSize={16}
          textFontFamily="bold"
          height={50}
          width={Sizes.screenWidth - 40}
          backgroundColor={Colors.primary}
          borderRadius={25}
        />
        
        <TouchableOpacity 
          onPress={handleDisable}
          style={styles.skipButton}
        >
          <ReusableText
            text="Şimdi değil"
            family="medium"
            size={16}
            color={Colors.gray}
            align="center"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundBox,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    marginBottom: 16,
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  skipButton: {
    padding: 12,
    marginTop: 20,
  },
});

export default NotificationStep;
