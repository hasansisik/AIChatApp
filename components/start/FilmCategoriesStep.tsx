import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Colors } from "@/hooks/useThemeColor";
import { useTranslation } from "react-i18next";
import ReusableText from "../ui/ReusableText";
import { FontSizes } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";

const FilmCategoriesStep = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { viewStyles, textStyles } = createStyles();
  const { t } = useTranslation();

  const categories = [
    { id: "action", name: "start.category.action" },
    { id: "adventure", name: "start.category.adventure" },
    { id: "animation", name: "start.category.animation" },
    { id: "comedy", name: "start.category.comedy" },
    { id: "crime", name: "start.category.crime" },
    { id: "drama", name: "start.category.drama" },
    { id: "fantasy", name: "start.category.fantasy" },
    { id: "horror", name: "start.category.horror" },
    { id: "mystery", name: "start.category.mystery" },
    { id: "romance", name: "start.category.romance" },
    { id: "sci-fi", name: "start.category.sci-fi" },
    { id: "thriller", name: "start.category.thriller" },
    { id: "documentary", name: "start.category.documentary" },
    { id: "historical", name: "start.category.historical" },
    { id: "musical", name: "start.category.musical" },
    { id: "western", name: "start.category.western" },
  ];

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  return (
    <View style={viewStyles.categoriesContainer}>
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              viewStyles.categoryButton,
              isSelected && viewStyles.selectedCategory,
            ]}
            onPress={() => toggleCategory(category.id)}
          >
            <View style={viewStyles.categoryContent}>
            {isSelected && (
                <Ionicons 
                  name="checkmark" 
                  size={20} 
                  color={Colors.primary} 
                  style={{marginRight: 5}} 
                />
              )}
              <ReusableText
                text={t(category.name)}
                family="regular"
                size={FontSizes.small}
                color={Colors.black}
              />
             
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = () => {
  const viewStyles = StyleSheet.create<Record<string, ViewStyle>>({
    categoriesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 12,
    },
    categoryButton: {
      borderWidth: 2,
      borderRadius: 24,
      paddingVertical: 12,
      paddingHorizontal: 20,
      minWidth: 100,
      alignItems: "center",
      borderColor: Colors.lightGray,
    },
    selectedCategory: {
      borderColor: Colors.primary,
    },
    categoryContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
  });

  const textStyles = StyleSheet.create<Record<string, TextStyle>>({
    categoryText: {
      fontSize: 16,
      color: Colors.text,
    },
  });

  return { viewStyles, textStyles };
};

export default FilmCategoriesStep; 