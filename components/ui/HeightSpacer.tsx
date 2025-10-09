
import { View } from 'react-native';
import React from 'react';

interface HeightSpacerProps {
  height: number;
}

const HeightSpacer: React.FC<HeightSpacerProps> = ({ height }) => {
  return <View style={{ height: height }} />;
};

export default HeightSpacer;