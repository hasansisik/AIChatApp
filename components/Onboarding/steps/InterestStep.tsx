import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { Sizes } from '@/constants/Sizes';
import { FontSizes } from '@/constants/Fonts';

interface InterestStepProps {
  data: {
    interest: string;
  };
  onUpdate: (key: string, value: any) => void;
}

const InterestStep: React.FC<InterestStepProps> = ({ data, onUpdate }) => {
  const { t } = useTranslation();
  
  const interests = [
    { id: 'dil-ogrenmek', title: t('onboarding.interestStep.options.dil-ogrenmek'), emoji: '📚' },
    { id: 'sohbet', title: t('onboarding.interestStep.options.sohbet'), emoji: '💬' },
  ];

  const handleSelect = (interest: string) => {
    onUpdate('interest', interest);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ReusableText
          text={t('onboarding.interestStep.title')}
          family="bold"
          size={24}
          color={Colors.black}
          align="left"
          style={styles.title}
        />
        <ReusableText
          text={t('onboarding.interestStep.subtitle')}
          family="regular"
          size={16}
          color={Colors.gray}
          align="left"
          style={styles.subtitle}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {interests.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.optionButton,
              data.interest === interest.id && styles.optionButtonSelected,
            ]}
            onPress={() => handleSelect(interest.id)}
          >
            <ReusableText
              text={interest.emoji}
              family="regular"
              size={32}
              align="center"
              style={styles.emoji}
            />
            <ReusableText
              text={interest.title}
              family="medium"
              size={FontSizes.xSmall}
              color={data.interest === interest.id ? Colors.white : Colors.black}
              align="center"
              style={styles.optionText}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  optionButton: {
    width: (Sizes.screenWidth - 80) / 2,
    height: 120,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emoji: {
    marginBottom: 8,
  },
  optionText: {
    lineHeight: 20,
  },
});

export default InterestStep;
