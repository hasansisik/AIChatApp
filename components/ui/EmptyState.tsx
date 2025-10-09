import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReusableText from './ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';

interface EmptyStateProps {
  text: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  textColor?: string;
  textSize?: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  text,
  iconName = 'document-outline',
  iconSize = 40,
  iconColor = Colors.gray,
  textColor = Colors.gray,
  textSize = FontSizes.medium,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons 
        name={iconName} 
        size={iconSize} 
        color={iconColor} 
        style={styles.icon}
      />
      <ReusableText 
        text={text}
        size={textSize}
        color={textColor}
        align="center"
        style={styles.text}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  icon: {
    marginBottom: 16,
  },
  text: {
    lineHeight: 22,
  },
});

export default EmptyState;
