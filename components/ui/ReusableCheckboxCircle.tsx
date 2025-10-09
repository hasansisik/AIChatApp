import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Fontisto, Ionicons } from "@expo/vector-icons";

interface ReusableCheckboxCircleProps {
  isChecked: boolean;
  onCheck: () => void;
  text?: string;
  initialIcon?: keyof typeof Ionicons.glyphMap;
  swappedIcon?: keyof typeof Ionicons.glyphMap;
  width: number;
  height: number;
  iconSize: number;
  borderWidth: number;
  borderRadius: number;
  initialBorderColor: string;
  swappedBorderColor: string;
  initialColor: string;
  swappedColor: string;
  initialBackgroundColor: string;
  swappedBackgroundColor: string;
}

const ReusableCheckboxCircle: React.FC<ReusableCheckboxCircleProps> = ({
  isChecked,
  onCheck,
  text,
  initialIcon = "checkmark",
  swappedIcon = "checkmark",
  width,
  height,
  iconSize,
  borderWidth,
  borderRadius,
  initialBorderColor,
  swappedBorderColor,
  initialColor,
  swappedColor,
  initialBackgroundColor,
  swappedBackgroundColor,
}) => {
  const color = isChecked ? swappedColor : initialColor;
  const backgroundColor = isChecked
    ? swappedBackgroundColor
    : initialBackgroundColor;
  const borderColor = isChecked ? swappedBorderColor : initialBorderColor;
  const iconName = isChecked ? swappedIcon : initialIcon;

  return (
    <TouchableOpacity
      style={{
        width: width,
        height: height,
        borderColor: borderColor,
        borderWidth: borderWidth,
        borderRadius: borderRadius,
        backgroundColor: backgroundColor,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
      }}
      onPress={onCheck}
    >
      <Ionicons name={iconName} size={iconSize} color={color} />
      <Text style={{ color: color }}>{text}</Text>
    </TouchableOpacity>
  );
};

export default ReusableCheckboxCircle;
