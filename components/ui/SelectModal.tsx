import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  FlatList,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Option {
  id: string;
  label: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options: Option[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const SelectModal: React.FC<SelectModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContainer}>
          <SafeAreaView>
            <View style={styles.handle} />
            
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedValue === item.id && styles.selectedOptionItem
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    selectedValue === item.id && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                  
                  {selectedValue === item.id && (
                    <Ionicons name="checkmark" size={20} color="#1877F2" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
              contentContainerStyle={styles.optionsListContent}
            />
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: Colors.lightWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    shadowColor: 'Colors.black',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: Colors.black,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: Colors.lightWhite,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    paddingBottom: 20,
  },
  optionsListContent: {
    paddingBottom: 40,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  selectedOptionItem: {
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
  },
  optionText: {
    fontSize: FontSizes.small,
    color: Colors.black,
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#1877F2',
  },
});

export default SelectModal; 