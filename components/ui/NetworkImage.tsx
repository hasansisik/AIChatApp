import { StyleSheet, Image, ImageStyle } from 'react-native'
import React from 'react'

interface NetworkImageProps {
  source: string;
  width: number;
  height: number;
  radius: number;
  resizeMode: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  borderWidth?: number; 
  borderColor?: string; 
}

const NetworkImage: React.FC<NetworkImageProps> = ({ source, width, height, radius, resizeMode, borderWidth, borderColor }) => {
  return (
    <Image
      source={{ uri: source }}
      style={[styles.image, { width, height, borderRadius: radius, borderWidth, borderColor }]} // Yeni stil ekleme
      resizeMode={resizeMode}
    />
  )
}

export default NetworkImage

const styles = StyleSheet.create({
  image: {
    width: undefined,
    height: undefined,
    borderRadius: undefined,
    borderWidth: undefined, // Yeni stil
    borderColor: undefined, // Yeni stil
  } as ImageStyle,
})
