import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Colors } from "@/hooks/useThemeColor";

const AgeSelectionStep = () => {
  const [selectedTime, setSelectedTime] = useState("");
  const { viewStyles, textStyles } = createStyles();

  const times = [
    { id: "14-17", name: "14-17" },
    { id: "18-24", name: "18-24" },
    { id: "25-34", name: "25-34" },
    { id: "35-44", name: "35-44" },
    { id: "45-55", name: "45-55" },
    { id: "55+", name: "55+" },
  ];

  return (
    <View style={viewStyles.timeContainer}>
      {times.map((time) => (
        <TouchableOpacity
          key={time.id}
          style={[
            viewStyles.timeSlot,
            selectedTime === time.id && viewStyles.selectedTime,
          ]}
          onPress={() => setSelectedTime(time.id)}
        >
          <Text style={textStyles.timeText}>{time.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const createStyles = () => {
  const viewStyles = StyleSheet.create<Record<string, ViewStyle>>({
    timeContainer: {
      flexDirection: "column",
      gap: 16,
      width: "90%",
      alignSelf: "center",
    },
    timeSlot: {
      borderWidth: 2,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: "center",
      borderColor: Colors.lightGray,
    },
    selectedTime: {
      borderColor: Colors.primary,
    },
  });

  const textStyles = StyleSheet.create<Record<string, TextStyle>>({
    timeText: {
      fontSize: 16,
      color: Colors.text,
    },
  });

  return { viewStyles, textStyles };
};

export default AgeSelectionStep; 