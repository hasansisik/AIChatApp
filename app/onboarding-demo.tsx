import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import StepOnboardingScreen from '@/components/Onboarding/StepOnboardingScreen';
import TabNavigation from './(tabs)/tabs';

const OnboardingDemo = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <StepOnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <TabNavigation />;
};

export default OnboardingDemo;
