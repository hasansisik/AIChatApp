import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Image, TouchableOpacity, Modal, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '@/hooks/useThemeColor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingItem {
  _id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  order: number;
}

interface OnboardingCarouselProps {
  onboardings: OnboardingItem[];
  visible: boolean;
  onClose: () => void;
  timerDuration?: number; // Timer süresi saniye cinsinden (varsayılan: 3)
}

const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ 
  onboardings, 
  visible, 
  onClose,
  timerDuration = 3 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(3);
  const [isCloseEnabled, setIsCloseEnabled] = useState(false);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sort onboardings by order
  const sortedOnboardings = [...onboardings].sort((a, b) => a.order - b.order);

  // Reset currentIndex when visible becomes true
  useEffect(() => {
    if (visible && sortedOnboardings.length > 0) {
      setCurrentIndex(0);
      setIsCloseEnabled(false);
      setTimeRemaining(3);
    }
  }, [visible, sortedOnboardings.length]);

  // Her slide için timer süresi: ilk slide 3 saniye, diğerleri 5 saniye
  const getTimerDuration = (index: number) => {
    return index === 0 ? 3 : 5;
  };

  // İlk açılışta ve her slide değiştiğinde timer'ı başlat
  useEffect(() => {
    if (!visible || sortedOnboardings.length === 0) {
      // Timer'ı temizle
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Önceki timer'ı temizle
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const duration = getTimerDuration(currentIndex);
    setTimeRemaining(duration);
    setIsCloseEnabled(false);

    // Timer'ı hemen başlat - ilk saniyeyi hemen say
    const tick = () => {
      setTimeRemaining((prev) => {
        const newValue = prev - 1;
        
        if (newValue <= 0) {
          // Timer bitti
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          
          // Bir sonraki slide'a geç veya kapat
          const isLast = currentIndex >= sortedOnboardings.length - 1;
          if (!isLast) {
            // Bir sonraki slide'a geç
            setCurrentIndex(prev => prev + 1);
          } else {
            // Son slide, çarpı ikonunu göster
            setIsCloseEnabled(true);
          }
          return 0;
        }
        
        return newValue;
      });
    };

    // İlk tick'i hemen çalıştır
    tick();
    
    // Sonraki tick'leri interval ile çalıştır
    timerIntervalRef.current = setInterval(tick, 1000);

    // Cleanup
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentIndex, visible, sortedOnboardings.length]);

  const handleClose = useCallback(() => {
    // Stop all videos
    Object.values(videoRefs.current).forEach((ref) => {
      ref?.pauseAsync();
    });
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex < sortedOnboardings.length - 1) {
        // Stop current video if exists
        const currentItem = sortedOnboardings[prevIndex];
        if (currentItem.mediaType === 'video' && videoRefs.current[currentItem._id]) {
          videoRefs.current[currentItem._id]?.pauseAsync();
        }
        return prevIndex + 1;
      } else {
        handleClose();
        return prevIndex;
      }
    });
  }, [sortedOnboardings, handleClose]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Stop current video if exists
      const currentItem = sortedOnboardings[currentIndex];
      if (currentItem.mediaType === 'video' && videoRefs.current[currentItem._id]) {
        videoRefs.current[currentItem._id]?.pauseAsync();
      }
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!visible || sortedOnboardings.length === 0) {
    return null;
  }

  const currentItem = sortedOnboardings[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sortedOnboardings.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Timer and Close button */}
        <View style={styles.timerContainer}>
          {!isCloseEnabled ? (
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{timeRemaining} saniye sonra geç</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <View style={styles.closeButtonContainer}>
                <View style={[
                  styles.closeButtonLine, 
                  { transform: [{ rotate: '45deg' }] }
                ]} />
                <View style={[
                  styles.closeButtonLine, 
                  { transform: [{ rotate: '-45deg' }] }
                ]} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Media content */}
        <View style={styles.mediaContainer}>
          {currentItem.mediaType === 'video' ? (
            <Video
              ref={(ref) => {
                videoRefs.current[currentItem._id] = ref;
              }}
              source={{ uri: currentItem.mediaUrl }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted={false}
            />
          ) : (
            <Image
              source={{ uri: currentItem.mediaUrl }}
              style={styles.media}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Navigation buttons */}
        {sortedOnboardings.length > 1 && (
          <View style={styles.navigationContainer}>
            {!isFirst && (
              <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                <View style={styles.navButtonContent}>
                  <View style={[styles.arrow, styles.arrowLeft]} />
                </View>
              </TouchableOpacity>
            )}
            
            {!isLast && (
              <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                <View style={styles.navButtonContent}>
                  <View style={[styles.arrow, styles.arrowRight]} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Dots indicator */}
        {sortedOnboardings.length > 1 && (
          <View style={styles.dotsContainer}>
            {sortedOnboardings.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButtonDisabled: {
    opacity: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  closeButtonContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonLine: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#000',
  },
  closeButtonLineDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  navButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 25,
  },
  navButtonContent: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
  },
  arrowLeft: {
    borderRightWidth: 12,
    borderRightColor: '#fff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  arrowRight: {
    borderLeftWidth: 12,
    borderLeftColor: '#fff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default OnboardingCarousel;

