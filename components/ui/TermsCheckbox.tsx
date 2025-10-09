import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import CustomCheckbox from './CustomCheckbox';
import TermsModal from './TermsModal';

interface TermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  linkText?: string;
  acceptanceText?: string;
  linkColor?: string;
}

const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  checked,
  onCheckedChange,
  linkText = "Üyelik sözleşmesini",
  acceptanceText = "okudum ve kabul ediyorum.",
  linkColor = Colors.primary
}) => {
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <CustomCheckbox 
          checked={checked}
          onPress={() => {
            // Only allow unchecking directly
            if (checked) {
              onCheckedChange(false);
            } else {
              // If trying to check, open the modal instead
              setTermsModalVisible(true);
            }
          }}
          size={22}
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.fullText}>
            <Text 
              style={[styles.linkText, { color: linkColor }]}
              onPress={() => setTermsModalVisible(true)}
            >
              {linkText}
            </Text>
            <Text style={styles.normalText}>
              {" " + acceptanceText}
            </Text>
          </Text>
        </View>
      </View>

      {/* Terms Modal */}
      <TermsModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
        onAccept={() => {
          onCheckedChange(true);
          setTermsModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  fullText: {
    fontSize: FontSizes.small,
    lineHeight: 20,
  },
  linkText: {
    fontWeight: 'bold',
  },
  normalText: {
    color: Colors.description,
  },
});

export default TermsCheckbox; 