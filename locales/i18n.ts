import 'intl-pluralrules'; 

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import trTranslation from "./tr/translation.json";
import enTranslation from "./en/translation.json";

const getSavedLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem("language");
    return savedLanguage || getLocales()[0]?.languageCode || "tr";
  } catch (error) {
    return getLocales()[0]?.languageCode || "tr";
  }
};

getSavedLanguage().then((lng: string) => {
  i18n.use(initReactI18next).init({
    resources: {
      tr: { translation: trTranslation },
      en: { translation: enTranslation },
    },
    lng,
    fallbackLng: "tr", 
    interpolation: {
      escapeValue: false,
    },
  });
});

export default i18n;