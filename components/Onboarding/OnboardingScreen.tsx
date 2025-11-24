import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import ReusableText from '@/components/ui/ReusableText';
import ReusableButton from '@/components/ui/ReusableButton';
import { Colors } from '@/constants/Colors';
import { Sizes } from '@/constants/Sizes';
import { Fonts } from '@/constants/Fonts';
import { onboardingData, OnboardingSlide } from '@/data/OnboardingData';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      onComplete();
    }
  };


  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slideContainer}>
      {/* Photo removed from scrollable area */}
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex ? Colors.light.white : Colors.light.gray,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Video
        source={require('@/assets/video/onboarding.mp4')}
        style={styles.videoBackground}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />

      <View style={styles.contentContainer}>
        {renderDots()}
        
        <View style={styles.textContainer}>
          <ReusableText
            text={onboardingData[currentIndex].title}
            family="bold"
            size={24}
            color={Colors.light.white}
            align="center"
            style={styles.title}
          />
          
          <ReusableText
            text={onboardingData[currentIndex].description}
            family="regular"
            size={16}
            color={Colors.light.lightGray}
            align="center"
            style={styles.description}
          />
        </View>

        <View style={styles.buttonContainer}>
          <ReusableButton
            onPress={handleNext}
            btnText={currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
            textColor={Colors.light.black}
            textFontSize={16}
            textFontFamily="bold"
            height={50}
            width={Sizes.screenWidth - 40}
            backgroundColor={Colors.light.white}
            borderRadius={25}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  slideContainer: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  textContainer: {
    marginBottom: 40,
  },
  title: {
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: 'center',
  },
});

export default OnboardingScreen;
