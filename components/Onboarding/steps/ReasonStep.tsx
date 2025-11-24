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

interface ReasonStepProps {
  data: {
    reason: string;
  };
  onUpdate: (key: string, value: any) => void;
}

const ReasonStep: React.FC<ReasonStepProps> = ({ data, onUpdate }) => {
  const { t } = useTranslation();
  
  const reasons = [
    { id: 'is', title: t('onboarding.reasonStep.options.is'), emoji: '💼' },
    { id: 'seyahat', title: t('onboarding.reasonStep.options.seyahat'), emoji: '✈️' },
    { id: 'okul', title: t('onboarding.reasonStep.options.okul'), emoji: '🎓' },
    { id: 'aile', title: t('onboarding.reasonStep.options.aile'), emoji: '👨‍👩‍👧‍👦' },
    { id: 'arkadas', title: t('onboarding.reasonStep.options.arkadas'), emoji: '👥' },
    { id: 'hobi', title: t('onboarding.reasonStep.options.hobi'), emoji: '🎨' },
  ];

  const handleSelect = (reason: string) => {
    onUpdate('reason', reason);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ReusableText
          text={t('onboarding.reasonStep.title')}
          family="bold"
          size={24}
          color={Colors.black}
          align="left"
          style={styles.title}
        />
        <ReusableText
          text={t('onboarding.reasonStep.subtitle')}
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
        {reasons.map((reason) => (
          <TouchableOpacity
            key={reason.id}
            style={[
              styles.optionButton,
              data.reason === reason.id && styles.optionButtonSelected,
            ]}
            onPress={() => handleSelect(reason.id)}
          >
            <ReusableText
              text={reason.emoji}
              family="regular"
              size={32}
              align="center"
              style={styles.emoji}
            />
            <ReusableText
              text={reason.title}
              family="medium"
              size={16}
              color={data.reason === reason.id ? Colors.white : Colors.black}
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
    height: 100,
    backgroundColor: Colors.white,
    borderRadius: 15, // Rounded rectangle
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emoji: {
    marginBottom: 8,
    fontSize: 28,
  },
  optionText: {
    lineHeight: 18,
    fontSize: 15,
  },
});

export default ReasonStep;
