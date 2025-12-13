import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { updateOnboardingData, loadUser } from '@/redux/actions/userActions';
import InterestStep from './steps/InterestStep';
import MainGoalStep from './steps/MainGoalStep';
import ReasonStep from './steps/ReasonStep';
import FavoriteStep from './steps/FavoriteStep';


interface StepOnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingData {
  interest: string;
  mainGoal: string;
  reason: string;
  favorites: string[];
}

const StepOnboardingScreen: React.FC<StepOnboardingScreenProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    interest: '',
    mainGoal: '',
    reason: '',
    favorites: [],
  });

  const steps = [
    { id: 0, title: t('onboarding.steps.interest'), component: InterestStep },
    { id: 1, title: t('onboarding.steps.mainGoal'), component: MainGoalStep },
    { id: 2, title: t('onboarding.steps.reason'), component: ReasonStep },
    { id: 3, title: t('onboarding.steps.favorites'), component: FavoriteStep },
  ];

  const totalSteps = steps.length;

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save onboarding data when completing the favorites step (step 3)
      if (currentStep === 3) {
        setIsLoading(true);
        try {
          const actionResult = await dispatch(updateOnboardingData({
            interest: onboardingData.interest,
            mainGoal: onboardingData.mainGoal,
            reason: onboardingData.reason,
            favorites: onboardingData.favorites,
          }) as any);
          
          if (updateOnboardingData.fulfilled.match(actionResult)) {
          } else {
            console.error('Failed to save onboarding data:', actionResult.payload);
          }
        } catch (error) {
          console.error('Error saving onboarding data:', error);
        } finally {
          setIsLoading(false);
        }
      }
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // User skipped onboarding, don't save anything
    // isOnboardingCompleted will remain false, so onboarding will show again on page refresh
    onComplete();
  };

  const updateData = (key: string, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderProgressDots = () => {
    return (
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index <= currentStep ? Colors.purple : Colors.lightGray,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={Colors.black} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <ReusableText
            text={currentStep === totalSteps - 1 ? t('start.finish') : t('onboarding.skip')}
            family="medium"
            size={16}
            color={Colors.gray}
          />
        </TouchableOpacity>
      </View>

      {/* Step Content */}
      <View style={styles.contentContainer}>
        <CurrentStepComponent
          data={onboardingData}
          onUpdate={updateData}
        />
      </View>

      {/* Navigation Buttons with Progress Dots */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          disabled={currentStep === 0}
        >
          <Ionicons 
            name="chevron-back-outline" 
            size={24} 
            color={currentStep === 0 ? Colors.lightGray : Colors.black} 
          />
        </TouchableOpacity>

        {/* Progress Dots in the center */}
        {renderProgressDots()}

        <TouchableOpacity 
          onPress={handleNext} 
          style={[styles.navButton, isLoading && styles.navButtonDisabled]}
        >
          <Ionicons 
            name="chevron-forward-outline" 
            size={24} 
            color={isLoading ? Colors.lightGray : Colors.black} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  skipButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 30,
    height: 4,
    borderRadius: 5,
    marginHorizontal: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  navButton: {
    padding: 10,
    borderRadius: 30,
    backgroundColor: Colors.backgroundBox,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: Colors.lightInput,
  },
});

export default StepOnboardingScreen;
