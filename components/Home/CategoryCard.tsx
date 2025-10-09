import React from 'react';
import { View, StyleSheet, TouchableOpacity, DimensionValue } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';

interface CategoryCardProps {
  title: string;
  icon: string;
  backgroundColor: string;
  iconBackgroundColor: string;
  onPress?: () => void;
  isLarge?: boolean;
  width?: DimensionValue;
  flex?: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  icon,
  backgroundColor,
  iconBackgroundColor,
  onPress,
  isLarge = false,
  width,
  flex,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          backgroundColor,
          width: width,
          flex: flex,
        },
        isLarge ? styles.largeCard : styles.smallCard,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        <Ionicons name={icon as any} size={isLarge ? 28 : 24} color={Colors.light} />
      </View>

      {/* Arrow Icon */}
      <View style={styles.arrowContainer}>
        <MaterialIcons name="arrow-outward" size={24} color={Colors.light} />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <ReusableText
          text={title}
          family="medium"
          size={isLarge ? 40 : 20}
          color={Colors.light}
          style={isLarge ? styles.titleLarge : styles.title}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 30,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  largeCard: {
    flex: 1,
  },
  smallCard: {
    flex: 1,
    minHeight: 90,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  arrowContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    minHeight: 30,
  },
  title: {
    flexWrap: 'wrap',
  },
  titleLarge: {
    flexWrap: 'wrap',
  },
});

export default CategoryCard;
