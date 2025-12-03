import React, { useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import { Colors } from "@/hooks/useThemeColor";

interface ReusableInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  touched?: boolean;
  error?: string;
  secureTextEntry?: boolean;
  labelColor?: string;
  [key: string]: any;
}

const ReusableInput: React.FC<ReusableInputProps> = ({
  label,
  value,
  onChangeText,
  touched,
  error,
  secureTextEntry,
  labelColor = Colors.black,
  ...props
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <View>
      <View style={inputContainerStyle(!!error, isFocused)}>
        <TextInput
          underlineStyle={{ display: "none" }}
          style={styles.input}
          label={label}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !passwordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textColor={Colors.black}
          textContentType={secureTextEntry ? "none" : undefined}
          autoComplete={secureTextEntry ? "off" : undefined}
          theme={{ 
            colors: { 
              primary: Colors.black,
              onSurfaceVariant: labelColor,
            } 
          }}
          right={
            secureTextEntry ? (
              <TextInput.Icon
                icon={passwordVisible ? "eye" : "eye-off"}
                onPress={togglePasswordVisibility}
                color={Colors.icon}
              />
            ) : null
          }
          {...props}
        />
      </View>
      <HelperText type="error" visible={touched && Boolean(error)}>
        {error}
      </HelperText>
    </View>
  );
};

const inputContainerStyle = (error: boolean, isFocused: boolean): ViewStyle => ({
  borderWidth: isFocused ? 2 : 1,
  borderRadius: 30,
  borderColor: error ? Colors.error : isFocused ? Colors.black : Colors.gray,
  overflow: "hidden",
});

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.background,
  },
});

export default ReusableInput;
