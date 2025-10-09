import { View, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from "react-native";
import React from "react";
import { Feather, Ionicons, AntDesign } from "@expo/vector-icons";
import ReusableText from "./ReusableText";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/hooks/useThemeColor";
import { FontSizes } from "@/constants/Fonts";

interface Language {
  code: string;
  flag: ImageSourcePropType;
}

interface ReusableSettingsProps {
  icon: string;
  title: string;
  onPress?: () => void;
  iconColor?: string;
  textColor?: string;
  iconType?: "Ionicons" | "AntDesign";
}

interface ReusableLanguageSettingsProps extends Omit<ReusableSettingsProps, 'onPress'> {}

const ReusableSettings: React.FC<ReusableSettingsProps> = ({
  icon,
  title,
  onPress,
  iconColor = Colors.black,
  textColor = Colors.black,
  iconType = "Ionicons",
}) => {
  const IconComponent = iconType === "AntDesign" ? AntDesign : Ionicons;

  return (
    <TouchableOpacity onPress={onPress} style={styles.box}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <View
          style={{
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            padding: 8,
            backgroundColor: Colors.lightInput,
          }}
        >
          <IconComponent name={icon} size={22} color={iconColor} />
        </View>
        <ReusableText
          text={title}
          family={"regular"}
          size={FontSizes.small}
          color={textColor}
        />
      </View>
      <Feather name="chevron-right" size={20} color={iconColor} />
    </TouchableOpacity>
  );
};

const ReusableLanguageSettings: React.FC<ReusableLanguageSettingsProps> = ({
  icon,
  title,
  iconColor = Colors.black,
  textColor = Colors.black,
  iconType = "Ionicons",
}) => {
  const { i18n } = useTranslation();
  const IconComponent = iconType === "AntDesign" ? AntDesign : Ionicons;

  const languages: Language[] = [
    { code: "tr", flag: require("@/assets/images/main/tr.png") },
    { code: "az", flag: require("@/assets/images/main/az.png") },
    { code: "en", flag: require("@/assets/images/main/en.png") },
    { code: "ru", flag: require("@/assets/images/main/ru.png") },
    { code: "de", flag: require("@/assets/images/main/de.png") },
    { code: "fr", flag: require("@/assets/images/main/fr.png") },
  ];

  const changeLanguage = async (): Promise<void> => {
    const currentIndex = languages.findIndex(
      (lang) => lang.code === i18n.language
    );
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLanguage = languages[nextIndex].code;
    await AsyncStorage.setItem("language", nextLanguage);
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <TouchableOpacity onPress={changeLanguage} style={styles.box}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <View
          style={{
            borderWidth: 1,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            padding: 5,
          }}
        >
          <IconComponent name={icon} size={22} color={iconColor} />
        </View>
        <ReusableText
          text={title}
          family={"regular"}
          size={FontSizes.medium}
          color={textColor}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        {languages.map((lang) => (
          <Image
            key={lang.code}
            source={lang.flag}
            style={[
              { width: 20, height: 15 },
              i18n.language === lang.code && {
                borderWidth: 2,
                borderColor: Colors.black,
              },
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
});

export { ReusableSettings, ReusableLanguageSettings };