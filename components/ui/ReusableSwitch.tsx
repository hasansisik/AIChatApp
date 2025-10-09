import React from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';

interface ReusableSwitchProps {
  onToggle?: (event?: GestureResponderEvent) => void;
}

const ReusableSwitch: React.FC<ReusableSwitchProps> = ({ onToggle }) => {
  const { isDark, colors, toggleTheme } = useTheme();
  const translateX = React.useRef(new Animated.Value(isDark ? 28 : 0)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isDark ? 28 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const toggleSwitch = (event?: GestureResponderEvent) => {
    // Toggle theme using the global theme context
    toggleTheme();
    
    if (onToggle) {
      onToggle(event);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleSwitch}
      style={[
        styles.switchContainer,
        { backgroundColor: isDark ? colors.background : colors.lightInput }
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="sunny" size={18} color={!isDark ? colors.blue : colors.gray} />
        <Ionicons name="moon" size={18} color={isDark ? colors.blue : colors.gray} />
      </View>
      <Animated.View
        style={[
          styles.thumb,
          { 
            transform: [{ translateX }],
            backgroundColor: isDark ? colors.blue : Colors.lightWhite,
          }
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    width: 60,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 2,
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 6,
  },
});

export default ReusableSwitch; 