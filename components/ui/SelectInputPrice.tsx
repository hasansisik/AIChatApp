import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import SelectModal from './SelectModal';

interface Option {
  id: string;
  label: string;
}

interface SelectInputPriceProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const SelectInputPrice: React.FC<SelectInputPriceProps> = ({
  label,
  placeholder = 'TL',
  options,
  value,
  onChange,
  required = false,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = options.find(option => option.id === value);

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
          disabled && styles.disabledInput
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[
          styles.value,
          !selectedOption && styles.placeholder,
          disabled && styles.disabledText
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color={disabled ? Colors.lightGray : Colors.description} 
        />
      </TouchableOpacity>

      <SelectModal
        visible={modalVisible}
        title={label || 'Para Birimi'}
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
    // No margin for compact design
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
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 12,
    backgroundColor: Colors.lightWhite,
    minWidth: 80,
  },
  disabledInput: {
    backgroundColor: Colors.lightGray,
    borderColor: Colors.lightGray,
  },
  value: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    color: Colors.description,
  },
  disabledText: {
    color: Colors.gray,
  },
});

export default SelectInputPrice; 