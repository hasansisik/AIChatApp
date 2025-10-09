import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import SelectModal from './SelectModal';

interface Option {
  id: string;
  label: string;
}

interface SelectInputProps {
  label: string;
  placeholder?: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
}

const SelectInput: React.FC<SelectInputProps> = ({
  label,
  placeholder = 'Seçiniz',
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  paddingHorizontal = 15,
  paddingVertical = 20,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = options.find(option => option.id === value);
  const isCompact = !label; // Compact mode when no label

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.inputContainer,
          isCompact && styles.compactInputContainer,
          disabled && styles.disabledInput,
          { paddingHorizontal, paddingVertical }
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[
          styles.value,
          isCompact && styles.compactValue,
          !selectedOption && styles.placeholder,
          disabled && styles.disabledText
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={isCompact ? 16 : 20} 
          color={disabled ? Colors.lightGray : Colors.description} 
        />
      </TouchableOpacity>

      <SelectModal
        visible={modalVisible}
        title={label || 'Seçim'}
        options={options}
        selectedValue={value}
        onSelect={onChange}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.black,
  },
  required: {
    color: Colors.lightRed,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 10,
    backgroundColor: Colors.lightWhite,
  },
  disabledInput: {
  },
  value: {
    fontSize: 16,
    color: Colors.black,
    flex: 1,
  },
  placeholder: {
    color: Colors.description,
  },
  disabledText: {
    color: Colors.gray,
  },
  compactInputContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  compactValue: {
    fontSize: 14,
  },
});

export default SelectInput; 