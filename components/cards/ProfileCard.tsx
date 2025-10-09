import {
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
  View,
} from "react-native";
import React from "react";
import global from "@/constants/Styles";
import { Feather, Ionicons } from "@expo/vector-icons";
import ReusableText from "../ui/ReusableText";
import { Colors } from "@/hooks/useThemeColor";import { FontSizes } from "@/constants/Fonts";

interface ProfileCardProps {
  title: string;
  icon: string;
  onPress: (event: GestureResponderEvent) => void;
  color?: string;
  titleColor?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ title, onPress, icon, color = Colors.black, titleColor = Colors.black }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.row}>
        <View style={styles.box}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <ReusableText
          text={title}
          family={"regular"}
          size={FontSizes.small}
          color={titleColor}
        />
      </View>

      <View style={styles.box}>
        <Feather name="chevron-right" size={20} />
      </View>
    </TouchableOpacity>
  );
};

export default ProfileCard;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  box: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.lightInput,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
