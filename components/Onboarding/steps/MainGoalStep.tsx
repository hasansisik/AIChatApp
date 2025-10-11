import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { Sizes } from '@/constants/Sizes';

interface MainGoalStepProps {
  data: {
    mainGoal: string;
  };
  onUpdate: (key: string, value: any) => void;
}

const mainGoals = [
  { id: 'konusma', title: 'Konuşma', emoji: '🗣️' },
  { id: 'yazma', title: 'Yazma', emoji: '✍️' },
  { id: 'dinleme', title: 'Dinleme', emoji: '👂' },
  { id: 'okuma', title: 'Okuma', emoji: '📖' },
  { id: 'gramer', title: 'Gramer', emoji: '📝' },
  { id: 'kelime', title: 'Kelime', emoji: '📚' },
];

const MainGoalStep: React.FC<MainGoalStepProps> = ({ data, onUpdate }) => {
  const handleSelect = (goal: string) => {
    onUpdate('mainGoal', goal);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ReusableText
          text="Ana hedefiniz nedir?"
          family="bold"
          size={24}
          color={Colors.black}
          align="left"
          style={styles.title}
        />
        <ReusableText
          text="En az 1 hedef seçin"
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
        {mainGoals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.optionButton,
              data.mainGoal === goal.id && styles.optionButtonSelected,
            ]}
            onPress={() => handleSelect(goal.id)}
          >
            <ReusableText
              text={goal.emoji}
              family="regular"
              size={32}
              align="center"
              style={styles.emoji}
            />
            <ReusableText
              text={goal.title}
              family="medium"
              size={16}
              color={data.mainGoal === goal.id ? Colors.white : Colors.black}
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
    flexDirection: 'column',
    paddingHorizontal: 10,
    gap: 12,
  },
  optionButton: {
    width: '100%',
    height: 60,
    backgroundColor: Colors.white,
    borderRadius: 30, // Pill shape
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
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
    marginRight: 12,
    fontSize: 24,
  },
  optionText: {
    lineHeight: 20,
    fontSize: 16,
  },
});

export default MainGoalStep;
