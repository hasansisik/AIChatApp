import { View } from "react-native";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import ReusableText from "./ReusableText";
import { Colors } from "@/hooks/useThemeColor";

import global from "@/constants/Styles";
import { FontSizes } from "@/constants/Fonts";

interface RatingProps {
  rating: number;
}

const Rating: React.FC<RatingProps> = ({ rating }) => {
  return (
    <View style={global.rowsGapFlexStart}>
      {/* Star Icon */}
      <FontAwesome
        name={rating > 0 ? "star" : "star-o"}
        size={15}
        color={rating > 0 ? Colors.black : Colors.gray}
      />
      <ReusableText
        text={rating.toString()}
        family={"regular"}
        size={FontSizes.small}
        color={rating > 0 ? Colors.black : Colors.gray}
      />
    </View>
  );
};

export default Rating;
