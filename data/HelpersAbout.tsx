import { StyleSheet, View, ScrollView } from "react-native";
import React from "react";
import { Colors } from "@/hooks/useThemeColor";
import ReusableText from "@/components/ui/ReusableText";
import { useTranslation } from "react-i18next";

const HelpersAbout: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.helpcontent}>
        <ReusableText text={t("profile.help.aboutUs")} family="bold" size={24} color={Colors.black} />
        <ReusableText
          text={t("profile.help.aboutUsText")}
          size={14}
        />
        
        <ReusableText text={t("profile.help.vision")} family="bold" size={18} color={Colors.black} />
        <ReusableText
          text={t("profile.help.visionText")}
          size={14}
        />
        
        <ReusableText text={t("profile.help.values")} family="bold" size={18} color={Colors.black} />
        <ReusableText text={t("profile.help.value1")} size={14} />
        <ReusableText text={t("profile.help.value2")} size={14} />
        <ReusableText text={t("profile.help.value3")} size={14} />
        <ReusableText text={t("profile.help.value4")} size={14} />
        <ReusableText text={t("profile.help.value5")} size={14} />
        
        <ReusableText text={t("profile.help.team")} family="bold" size={18} color={Colors.black} />
        <ReusableText
          text={t("profile.help.teamText")}
          size={14}
        />
        
        <ReusableText text={t("profile.help.achievements")} family="bold" size={18} color={Colors.black} />
        <ReusableText text={t("profile.help.achievement1")} size={14} />
        <ReusableText text={t("profile.help.achievement2")} size={14} />
        <ReusableText text={t("profile.help.achievement3")} size={14} />
        <ReusableText text={t("profile.help.achievement4")} size={14} />
        
        <ReusableText text={t("profile.help.sustainability")} family="bold" size={18} color={Colors.black} />
        <ReusableText
          text={t("profile.help.sustainabilityText")}
          size={14}
        />
      </View>
    </ScrollView>
  );
};

export default HelpersAbout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    height: 60,
    margin: 20,
  },
  helpcontent: {
    flex: 1,
    margin: 15,
    gap: 10,
  },
});
