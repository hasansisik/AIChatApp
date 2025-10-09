import { Text, TextStyle } from 'react-native';
import React from 'react';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/hooks/useThemeColor';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';

interface ReusableTextProps {
  text: string;
  family?: keyof typeof Fonts;
  size?: number;
  color?: string;
  align?: TextStyle['textAlign'];
  textDecorationLine?: TextStyle['textDecorationLine'];
  maxLength?: number;
  numberOfLines?: number;
  decodeHtml?: boolean; // New prop to control HTML entity decoding
  style?: TextStyle; // Add style prop
}

const ReusableText: React.FC<ReusableTextProps> = ({ text, family, size, color, align, textDecorationLine, maxLength, numberOfLines, decodeHtml = true, style }) => {
  const { colors } = useTheme();
  const textColor = color || colors.text;

  // Comprehensive validation of text prop
  let safeText = "";
  
  if (text === null || text === undefined) {
    safeText = "";
  } else if (typeof text === 'string') {
    safeText = text;
  } else if (typeof text === 'number') {
    safeText = String(text);
  } else if (typeof text === 'boolean') {
    safeText = String(text);
  } else {
    safeText = String(text);
  }

  // Decode HTML entities if enabled (default: true)
  const processedText = decodeHtml ? decodeHtmlEntities(safeText) : safeText;

  return (
    <Text style={[textStyle(family, size, textColor, align, textDecorationLine), style]} numberOfLines={numberOfLines || (maxLength ? 1 : undefined)} ellipsizeMode={maxLength || numberOfLines ? 'tail' : undefined}>
      {maxLength ? (processedText.length > maxLength ? processedText.slice(0, maxLength) + '...' : processedText) : processedText}
    </Text>
  );
};

export default ReusableText;

const textStyle = (family?: keyof typeof Fonts, size?: number, color?: string, align?: TextStyle['textAlign'], textDecorationLine?: TextStyle['textDecorationLine']): TextStyle => ({
  fontFamily: family ? Fonts[family] : undefined,
  fontSize: size,
  color: color,
  textAlign: align,
  textDecorationLine: textDecorationLine,
});