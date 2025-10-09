import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Colors } from "@/hooks/useThemeColor";
import ReusableText from "../ui/ReusableText";
import { FontSizes } from "@/constants/Fonts";
import { useTranslation } from "react-i18next";

const GenderSelectionStep = () => {
  const [selectedMood, setSelectedMood] = useState("");
  const { viewStyles, textStyles } = createStyles();
  const { t } = useTranslation();

  const moods = [
    { id: "men", name: "start.men" },
    { id: "women", name: "start.women" },

  ];

  return (
    <View style={viewStyles.moodContainer}>
      {moods.map((mood) => (
        <TouchableOpacity
          key={mood.id}
          style={[
            viewStyles.moodCircle,
            selectedMood === mood.id && viewStyles.selectedMood,
          ]}
          onPress={() => setSelectedMood(mood.id)}
        >
           <ReusableText
            text={t(mood.name)}
            family="medium"
            size={FontSizes.small}
            color={Colors.black}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const createStyles = () => {
  const viewStyles = StyleSheet.create<Record<string, ViewStyle>>({
    moodContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 20,
    },
    moodCircle: {
      borderWidth: 4,
      borderRadius: 50,
      width: 100,
      height: 100,
      alignItems: "center",
      justifyContent: "center",
      borderColor: Colors.lightGray,
    },
    selectedMood: {
      borderColor: Colors.primary,
    },
  });

  const textStyles = StyleSheet.create<Record<string, TextStyle>>({
    moodText: {
      fontSize: 16,
      color: Colors.text,
    },
  });

  return { viewStyles, textStyles };
};

export default GenderSelectionStep; 