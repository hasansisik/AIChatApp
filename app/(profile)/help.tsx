import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import AppBar from "@/components/ui/AppBar";
import { Colors } from "@/hooks/useThemeColor";
import { SafeAreaView } from "react-native-safe-area-context";
import HelpersAbout from "@/data/HelpersAbout";
import HelpersContact from "@/data/HelpersContact";
import ReusableText from "@/components/ui/ReusableText";
import { FontSizes } from "@/constants/Fonts";
import { useTranslation } from "react-i18next";

const Help = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(t("profile.help.aboutUs"));

  const renderContent = () => {
    switch (selectedTab) {
      case t("profile.help.aboutUs"):
        return <HelpersAbout />;
      case t("profile.help.contact"):
        return <HelpersContact />;
      default:
        return <HelpersAbout />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppBar
        top={0}
        left={20}
        right={20}
        color={Colors.light}
        onPress={() => router.back()}
      />
      {/* Body */}
      <View style={styles.helpcontent}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === t("profile.help.aboutUs") && styles.activeTab,
            ]}
            onPress={() => setSelectedTab(t("profile.help.aboutUs"))}
          >
            <ReusableText
              text={t("profile.help.aboutUs")}
              family={"medium"}
              size={FontSizes.small}
              color={Colors.black}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === t("profile.help.contact") && styles.activeTab]}
            onPress={() => setSelectedTab(t("profile.help.contact"))}
          >
            <ReusableText
              text={t("profile.help.contact")}
              family={"medium"}
              size={FontSizes.small}
              color={Colors.black}
            />
          </TouchableOpacity>
        </View>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    height: 60,
    margin: 20,
  },
  btn: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginHorizontal: 20,
  },
  input: {
    backgroundColor: Colors.white,
    color: Colors.dark,
  },
  helpcontent: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 10,
    gap: 10,
  },
  faqcontent: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 7,
    backgroundColor: Colors.white,
  },
  listItem: {
    backgroundColor: Colors.white,
  },
  body: {
    margin: 20,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    backgroundColor: Colors.white,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.dark,
  },
});

export default Help;
