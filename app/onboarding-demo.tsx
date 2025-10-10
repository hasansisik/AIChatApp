import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingScreen from '@/components/Onboarding/OnboardingScreen';
import TabNavigation from './(tabs)/tabs';

const OnboardingDemo = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <TabNavigation />;
};

export default OnboardingDemo;
