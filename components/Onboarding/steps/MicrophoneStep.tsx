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

interface MicrophoneStepProps {
  data: {
    microphoneEnabled: boolean;
  };
  onUpdate: (key: string, value: any) => void;
}

const MicrophoneStep: React.FC<MicrophoneStepProps> = ({ data, onUpdate }) => {
  const handleEnable = () => {
    onUpdate('microphoneEnabled', true);
  };

  const handleDisable = () => {
    onUpdate('microphoneEnabled', false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name="mic-outline" 
            size={80} 
            color={Colors.primary} 
          />
        </View>
        
        <ReusableText
          text="Mikrofona izin ver"
          family="bold"
          size={24}
          color={Colors.black}
          align="center"
          style={styles.title}
        />
        <ReusableText
          text="Telaffuz pratiği ve konuşma egzersizleri için mikrofon erişimine izin verin"
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
          btnText="Mikrofonu Etkinleştir"
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

export default MicrophoneStep;
