import {
  View,
  TouchableOpacity,
  Text,
  ViewStyle,
  FlexStyle,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import ReusableText from "./ReusableText";
import { Colors } from "@/hooks/useThemeColor";
import { FontSizes } from "@/constants/Fonts";

interface AppBarProps {
  color: string;
  title?: string;
  color1?: string;
  icon?: keyof typeof AntDesign.glyphMap;
  onPress: () => void;
  onPress1?: () => void;
  top: number;
  left: number;
  right: number;
  text1?: string;
  isAbsolute?: boolean; 
}

const AppBar: React.FC<AppBarProps> = ({
  color,
  title,
  color1,
  icon,
  onPress,
  onPress1,
  top,
  left,
  right,
  text1,
  isAbsolute, 
}) => {
  const color2 = color === Colors.light ? Colors.black : Colors.lightWhite;
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  // Update screen width when dimensions change (e.g., rotation)
  useEffect(() => {
    const updateWidth = () => {
      setScreenWidth(Dimensions.get('window').width);
    };
    
    const subscription = Dimensions.addEventListener('change', updateWidth);
    
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={overlayStyle(top, left, right, isAbsolute)}>
      <TouchableOpacity 
        style={[boxStyle(color), { position: 'absolute', left: 0, zIndex: 2 }]} 
        onPress={onPress}
      >
        <Ionicons name="arrow-back" size={25} color={color2} />
      </TouchableOpacity>

      {title && (
        <View style={{ 
          position: 'absolute',
          width: screenWidth - (left + right),
          left: 0,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}>
          <ReusableText
            text={title}
            family={"medium"}
            size={FontSizes.large}
            color={Colors.black}
            align="center"
          />
        </View>
      )}

      {icon && color1 && onPress1 && (
        <TouchableOpacity 
          style={[box1Style(color1), { position: 'absolute', right: 0, zIndex: 2 }]} 
          onPress={onPress1}
        >
          <AntDesign name={icon} size={25} />
          {text1 && <Text>{text1}</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AppBar;

const overlayStyle = (
  top: number,
  left: number,
  right: number,
  isAbsolute?: boolean
): ViewStyle => ({
  top: top,
  left: left,
  right: right,
  height: 50,
  justifyContent: "center",
  position: isAbsolute ? "absolute" : "relative", 
  zIndex: 100,
  flexDirection: "row",
  alignItems: "center",
});

const boxStyle = (color: string): ViewStyle => ({
  backgroundColor: color,
  width: 35,
  height: 35,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
});

const box1Style = (color1: string): ViewStyle => ({
  backgroundColor: color1,
  width: 35,
  height: 35,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
});
