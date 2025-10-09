import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Sizes } from "@/constants/Sizes";
import { FontSizes } from "@/constants/Fonts";
import { Colors } from "@/hooks/useThemeColor";
import ReusableText from "@/components/ui/ReusableText";
import AppBar from "@/components/ui/AppBar";
import { useRouter } from "expo-router";
import { RefundPolicies } from '../../../data/RefundPolicies';
import { useTranslation } from "react-i18next";

type RefundPolicyScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const RefundPolicyScreen: React.FC<RefundPolicyScreenProps> = () => {
  const router = useRouter();
  const { i18n } = useTranslation();
  
  // Get the current language's refund policy
  const refundPolicy = RefundPolicies[i18n.language as keyof typeof RefundPolicies] || RefundPolicies.en;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppBar
        top={0}
        left={20}
        right={20}
        color={Colors.white}
        onPress={() => router.back()}
      />
      {/* Scrollable Content */}
      <ScrollView style={styles.textContainer}>
        <ReusableText
          text={refundPolicy}
          family={"medium"}
          size={FontSizes.xSmall}
          color={Colors.black}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  textContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
});

export default RefundPolicyScreen;
