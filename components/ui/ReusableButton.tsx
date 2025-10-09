import { StyleSheet, Text, TouchableOpacity, TextStyle, ViewStyle, ActivityIndicator, ColorValue } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/hooks/useThemeColor";
import { Fonts } from "@/constants/Fonts";

interface ReusableButtonProps {
  onPress: () => void;
  btnText: string;
  textColor?: string;
  textFontSize?: number;
  textFontFamily?: keyof typeof Fonts;
  height?: number;
  width?: number;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  underline?: boolean;
  loading?: boolean;
  disable?: boolean;
  gradient?: boolean;
  gradientColors?: ColorValue[];
}

const ReusableButton: React.FC<ReusableButtonProps> = ({
  onPress,
  btnText,
  textColor,
  textFontSize,
  textFontFamily,
  height,
  width,
  backgroundColor,
  borderWidth,
  borderColor,
  borderRadius,
  underline = false,
  loading = false,
  disable = false,
  gradient = false,
  gradientColors,
}) => {
  const finalTextColor = disable ? Colors.gray : textColor;
  const finalBackgroundColor = disable ? Colors.backgroundBox : backgroundColor;
  const finalBorderColor = disable ? Colors.gray : borderColor;
  const finalTextFontFamily = textFontFamily ? Fonts[textFontFamily] : Fonts.regular;

  // Default gradient colors matching the logo (purple to light blue to yellow to green to orange to purple)
  const defaultGradientColors: ColorValue[] = [
    '#673B8A', // Purple
    '#37B9C3', // Light Blue
    '#AECE3C', // Green
    '#E8393A', // Orange
    '#673B8A', // Purple (back to start)
  ];

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color={finalTextColor} />
      ) : (
        <Text style={btnTextStyle(finalTextColor, textFontSize, finalTextFontFamily, underline)}>{btnText}</Text>
      )}
    </>
  );

  if (gradient && !disable) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={btnStyle(width, height, 'transparent', borderWidth, finalBorderColor, borderRadius)}
        disabled={loading}
      >
        <LinearGradient
          colors={(gradientColors || defaultGradientColors) as [ColorValue, ColorValue, ...ColorValue[]]}
          style={[gradientStyle(width, height, borderRadius)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={btnStyle(width, height, finalBackgroundColor, borderWidth, finalBorderColor, borderRadius)}
      disabled={disable || loading}
    >
      {buttonContent}
    </TouchableOpacity>
  );
};

export default ReusableButton;

const btnTextStyle = (
  textColor?: string,
  textFontSize?: number,
  textFontFamily?: string,
  underline?: boolean
): TextStyle => ({
  fontFamily: textFontFamily,
  fontSize: textFontSize,
  color: textColor,
  textDecorationLine: underline ? "underline" : "none",
});

const btnStyle = (
  width?: number,
  height?: number,
  backgroundColor?: string,
  borderWidth?: number,
  borderColor?: string,
  borderRadius?: number
): ViewStyle => ({
  width: width,
  backgroundColor: backgroundColor,
  alignItems: "center",
  justifyContent: "center",
  height: height,
  borderRadius: borderRadius,
  borderColor: borderColor,
  borderWidth: borderWidth,
});

const gradientStyle = (
  width?: number,
  height?: number,
  borderRadius?: number
): ViewStyle => ({
  width: width,
  height: height,
  borderRadius: borderRadius,
  alignItems: "center",
  justifyContent: "center",
});