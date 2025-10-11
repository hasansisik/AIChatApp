import {
  View,
  SafeAreaView,
  Platform,
  StatusBar,
  StyleSheet,
} from "react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import AppBar from "@/components/ui/AppBar";
import ReusableText from "@/components/ui/ReusableText";
import { Colors } from "@/hooks/useThemeColor";
import { FontSizes } from "@/constants/Fonts";
import { Sizes } from "@/constants/Sizes";
import { ReusableSettings } from "@/components/ui/ReusableSettings";

const Politcy = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === "ios" ? 20 : StatusBar.currentHeight },
      ]}
    >
      <AppBar
        top={0}
        left={15}
        right={20}
        color={Colors.light}
        onPress={() => router.back()}
      />
      <View
        style={{
          alignItems: "center",
          paddingBottom: 20,
        }}
      >
        <ReusableText
          text={t("profile.policies.title")}
          family={"bold"}
          size={FontSizes.large}
          color={Colors.black}
        />
      </View>
      <View>
        <ReusableSettings
          icon={"document"}
          title={t("profile.policies.privacy")}
          onPress={() =>
            router.push({
              pathname: "/(profile)/politicy/privacy",
            })
          }
        />
        <ReusableSettings
          icon={"documents"}
          title={t("profile.policies.terms")}
          onPress={() =>
            router.push({
              pathname: "/(profile)/politicy/terms",
            })
          }
        />
        <ReusableSettings
          icon={"newspaper"}
          title={t("profile.policies.refund")}
          onPress={() =>
            router.push({
              pathname: "/(profile)/politicy/refund",
            })
          }
        />
        <ReusableSettings
          icon={"card"}
          title={t("profile.policies.subscription")}
          onPress={() =>
            router.push({
              pathname: "/(profile)/politicy/pay",
            })
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default Politcy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    width: Sizes.screenWidth,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsBox: {
    backgroundColor: Colors.white,
  },
  box: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  switchContainer: {
    transform: [{ scaleX: 1 }, { scaleY: 1 }],
  },
});
