import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAutoDetectPress: () => void;
  onHandDetectPress: () => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  onClose,
  onAutoDetectPress,
  onHandDetectPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.reactionModalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.reactionIconsContainer}>
            <TouchableOpacity 
              style={styles.reactionIcon}
              onPress={onAutoDetectPress}
            >
              <View style={[styles.reactionIconBackground, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="mic" size={24} color="white" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reactionIcon}
              onPress={onHandDetectPress}
            >
              <View style={[styles.reactionIconBackground, { backgroundColor: '#34C759' }]}>
                <Ionicons name="hand-left" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionModalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'absolute',
    bottom: 125,
    left: 125,
    right: 125,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  reactionIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  reactionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionIconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SelectionModal;
