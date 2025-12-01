import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import ReusableText from './ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { AICategory } from '@/data/AICategories';

interface BottomTextContentProps {
  item: AICategory;
  isVisible: boolean;
  opacity: Animated.Value;
  onStartPress: () => void;
  buttonText?: string; // Optional custom button text
}

const BottomTextContent: React.FC<BottomTextContentProps> = ({
  item,
  isVisible,
  opacity,
  onStartPress,
  buttonText,
}) => {
  const { t } = useTranslation();
  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.bottomTextContainer, { opacity }]}>
      <ReusableText
        text={t(item.category)}
        family="light"
        size={16}
        color={Colors.lightWhite}
        style={styles.categoryText}
      />
      <ReusableText
        text={item.title}
        family="bold"
        size={24}
        color={Colors.lightWhite}
        style={styles.nameText}
      />
      <ReusableText
        text={t(item.description)}
        family="regular"
        size={14}
        color={Colors.lightWhite}
        style={styles.descriptionText}
      />
      
      {/* Start Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={onStartPress}
        activeOpacity={0.8}
      >
        <ReusableText
          text={buttonText || t('ai.startButton')}
          family="medium"
          size={16}
          color={Colors.lightWhite}
          style={styles.startButtonText}
        />
        <View style={styles.startButtonIconContainer}>
          <MaterialIcons 
            name="arrow-outward" 
            size={24} 
            color="white" 
            style={styles.startButtonIcon}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomTextContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  categoryText: {
    marginBottom: 4,
    textAlign: 'center',
  },
  nameText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 18,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 2,
    paddingLeft: 15,
    paddingVertical: 2,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.lightWhite,
  },
  startButtonText: {
    marginRight: 8,
  },
  startButtonIconContainer: {
    borderWidth: 2,
    borderColor: Colors.lightWhite,
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonIcon: {
    // Icon styling
  },
});

export default BottomTextContent;
