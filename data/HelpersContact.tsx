import { StyleSheet, View, ScrollView } from "react-native";
import React from "react";
import { Colors } from "@/hooks/useThemeColor";
import ReusableText from "@/components/ui/ReusableText";
import { useTranslation } from "react-i18next";

const HelpersContact: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.helpcontent}>
        <ReusableText text={t("profile.help.contact")} family="bold" size={24} color={Colors.black} />
        <ReusableText
          text={t("profile.help.contactText")}
          size={14}
        />
        
        <ReusableText text={t("profile.help.contactInfo")} family="bold" size={18} color={Colors.black} />
        <ReusableText text={t("profile.help.email")} size={14} />
        <ReusableText text={t("profile.help.phone")} size={14} />
        <ReusableText text={t("profile.help.address")} size={14} />
        
        <ReusableText text={t("profile.help.workingHours")} family="bold" size={18} color={Colors.black} />
        <ReusableText text={t("profile.help.mondayToFriday")} size={14} />
        <ReusableText text={t("profile.help.saturday")} size={14} />
        <ReusableText text={t("profile.help.sunday")} size={14} />
        
        <ReusableText text={t("profile.help.socialMedia")} family="bold" size={18} color={Colors.black} />
        <ReusableText text={t("profile.help.instagram")} size={14} />
        <ReusableText text={t("profile.help.twitter")} size={14} />
        <ReusableText text={t("profile.help.facebook")} size={14} />
        
        <ReusableText text={t("profile.help.support")} family="bold" size={18} color={Colors.black} />
        <ReusableText
          text={t("profile.help.supportText")}
          size={14}
        />
      </View>
    </ScrollView>
  );
};

export default HelpersContact;

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
