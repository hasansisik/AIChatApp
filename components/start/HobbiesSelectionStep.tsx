import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors } from "@/hooks/useThemeColor";
import ReusableText from "../ui/ReusableText";
import { FontSizes } from "@/constants/Fonts";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Sizes } from "@/constants/Sizes";

const HobbiesSelectionStep = () => {
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const { viewStyles } = createStyles();
  const { t } = useTranslation();

  const hobbies = [
    { id: "reading", name: "start.hobby.reading" },
    { id: "gaming", name: "start.hobby.gaming" },
    { id: "sports", name: "start.hobby.sports" },
    { id: "music", name: "start.hobby.music" },
    { id: "traveling", name: "start.hobby.traveling" },
    { id: "cooking", name: "start.hobby.cooking" },
    { id: "painting", name: "start.hobby.painting" },
    { id: "dancing", name: "start.hobby.dancing" },
    { id: "coding", name: "start.hobby.coding" },
    { id: "fishing", name: "start.hobby.fishing" },
    { id: "yoga", name: "start.hobby.yoga" },
    { id: "movies", name: "start.hobby.movies" },
    { id: "astronomy", name: "start.hobby.astronomy" },
    { id: "hiking", name: "start.hobby.hiking" },
  ];

  const toggleHabit = (hobbyId: string) => {
    setSelectedHabits((prev) => {
      if (prev.includes(hobbyId)) {
        return prev.filter((id) => id !== hobbyId);
      } else {
        return [...prev, hobbyId];
      }
    });
  };

  return (
    <View style={viewStyles.outerContainer}>
      <View style={viewStyles.grid}>
        {hobbies.map((hobby) => {
          const isSelected = selectedHabits.includes(hobby.id);
          return (
            <TouchableOpacity
              key={hobby.id}
              style={[viewStyles.card, isSelected && viewStyles.selectedCard]}
              onPress={() => toggleHabit(hobby.id)}
              activeOpacity={0.7}
            >
              <ReusableText
                text={t(hobby.name)}
                family="regular"
                size={FontSizes.small}
                color={Colors.black}
              />

              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={22}
                  color={Colors.primary}
                  style={{ marginRight: 6 }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = () => {
  const viewStyles = StyleSheet.create<Record<string, ViewStyle>>({
    outerContainer: {
      width: "100%",
      paddingHorizontal: 10,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 10,
    },
    card: {
      width: Sizes.screenWidth * 0.45,
      backgroundColor: Colors.white,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Colors.lightGray,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    selectedCard: {
      borderColor: Colors.primary,
      backgroundColor: "rgba(0, 80, 255, 0.05)",
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: "#444",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
    },
    checkboxSelected: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    checkmark: {
      width: 12,
      height: 8,
      borderLeftWidth: 2,
      borderBottomWidth: 2,
      borderColor: "#fff",
      transform: [{ rotate: "-45deg" }],
      marginTop: -2,
    },
  });

  const textStyles = StyleSheet.create<Record<string, TextStyle>>({
    text: {
      fontSize: 16,
      color: Colors.text,
    },
  });

  return { viewStyles, textStyles };
};

export default HobbiesSelectionStep;
