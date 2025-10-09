import { View, FlatList, StyleSheet } from "react-native";
import React from "react";
import { List } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/hooks/useThemeColor";
import AppBar from "@/components/ui/AppBar";
import { useRouter } from "expo-router";
import { FontSizes } from "@/constants/Fonts";
import ReusableText from "@/components/ui/ReusableText";
import { useTranslation } from "react-i18next";

const Faqs = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const faqs = [
    {
      question: t("profile.faq.question1"),
      answer: t("profile.faq.answer1"),
    },
    {
      question: t("profile.faq.question2"),
      answer: t("profile.faq.answer2"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppBar
        top={0}
        left={20}
        right={20}
        color={Colors.white}
        onPress={() => router.back()}
      />
      <View style={styles.faqcontent}>
        <ReusableText
          text={t("profile.faq.title")}
          family={"bold"}
          size={FontSizes.large}
          color={Colors.black}
        />
        <FlatList
          data={faqs}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <List.Accordion
              titleNumberOfLines={2}
              titleStyle={{ fontSize: FontSizes.small, color: Colors.black }}
              title={item.question}
              style={[styles.listHeader, { backgroundColor: Colors.backgroundBox }]}
              theme={{ colors: { background: Colors.dark } }}
            >
              <List.Item
                titleNumberOfLines={3}
                title={item.answer}
                style={[styles.listItem, { backgroundColor: Colors.dark }]}
                titleStyle={{ color: Colors.black }}
              />
            </List.Accordion>
          )}
        />
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
  profileInputs: {
    paddingVertical: 20,
    marginHorizontal: 10,
    gap: 20,
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
    gap: 10,
  },
  faqcontent: {
    paddingVertical: 15,
    marginHorizontal: 20,
    gap: 20,
  },
  listItem: {
    marginBottom: 10,
    borderRadius: 10,
  },
  listHeader: {
    marginBottom: 10,
    borderRadius: 10,
  },
  body: {
    margin: 20,
  },
});

export default Faqs;
