import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';

interface CustomCheckboxProps {
  checked: boolean;
  onPress: () => void;
  size?: number;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onPress,
  size = 24
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.checkbox, 
        { width: size, height: size }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {checked && (
        <MaterialIcons name="check" size={size - 6} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 4,
    backgroundColor: Colors.lightWhite,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default CustomCheckbox; 