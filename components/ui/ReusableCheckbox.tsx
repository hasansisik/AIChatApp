import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AntDesignIconNames = any;

interface ReusableCheckboxProps {
  isChecked: boolean;
  onCheck: () => void;
  text?: string;
  initialIcon?: AntDesignIconNames;
  swappedIcon?: AntDesignIconNames;
  width?: number;
  height?: number;
  borderWidth?: number;
  borderRadius?: number;
  initialBorderColor?: string;
  swappedBorderColor?: string;
  initialColor?: string;
  swappedColor?: string;
  initialBackgroundColor?: string;
  swappedBackgroundColor?: string;
}

const ReusableCheckbox: React.FC<ReusableCheckboxProps> = ({
  isChecked,
  onCheck,
  text,
  initialIcon = "square-outline",
  swappedIcon = "checkbox",
  initialBorderColor = "black",
  swappedBorderColor = "black",
  initialColor = "black",
  swappedColor = "black",
  initialBackgroundColor = "white",
  swappedBackgroundColor = "white",
}) => {
  const color = isChecked ? swappedColor : initialColor;
  const backgroundColor = isChecked ? swappedBackgroundColor : initialBackgroundColor;
  const borderColor = isChecked ? swappedBorderColor : initialBorderColor;
  const iconName = isChecked ? swappedIcon : initialIcon;

  return (
    <TouchableOpacity
      style={{
        backgroundColor: backgroundColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: text ? 5 : 0,
      }}
      onPress={onCheck}
    >
      {iconName && <Ionicons name={iconName} size={22} color={color} />}
      {text && <Text style={{ color: color }}>{text}</Text>}
    </TouchableOpacity>
  );
};

export default ReusableCheckbox;