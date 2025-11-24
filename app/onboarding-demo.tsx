import React from 'react';
import { View, StyleSheet } from 'react-native';
import StepOnboardingScreen from '@/components/Onboarding/StepOnboardingScreen';

interface OnboardingDemoProps {
  visible: boolean;
  onComplete: () => void;
}

const OnboardingDemo: React.FC<OnboardingDemoProps> = ({ visible, onComplete }) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StepOnboardingScreen onComplete={onComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OnboardingDemo;
