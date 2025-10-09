import { Dimensions } from 'react-native';
const { height, width } = Dimensions.get('window');

export const Sizes = {
  xsmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 40,
  screenWidth: width,
  screenHeight: height,
};

