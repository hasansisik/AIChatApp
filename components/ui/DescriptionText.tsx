import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { FontSizes } from '@/constants/Fonts';

interface DescriptionTextProps {
  lines?: number;
  text: string;
}

const DescriptionText: React.FC<DescriptionTextProps> = ({ lines = 1, text }) => {
  return (
      <Text numberOfLines={lines} style={styles.description}>{text}</Text>
  )
}

export default DescriptionText

const styles = StyleSheet.create({
    description: {
        fontFamily: "regular",
        textAlign: "justify",
        fontSize: FontSizes.medium - 2,
        color: "#71727A"
    }
})
