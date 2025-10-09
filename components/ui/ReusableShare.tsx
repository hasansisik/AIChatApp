import React from "react";
import { View, TouchableOpacity, Image, StyleSheet, Share, Clipboard, Alert } from "react-native";
import ReusableText from "./ReusableText";
import { FontSizes } from "@/constants/Fonts";
import { Colors } from "@/hooks/useThemeColor";

interface ReusableShareProps {
  titleText: string;
  subtitleText: string;
  buttonText: string;
  shareMessage: string;
  shareUrl?: string;
  onShareComplete?: (status: 'success' | 'error', message: string) => void;
  imageSource?: any;
}

const ReusableShare: React.FC<ReusableShareProps> = ({
  titleText,
  subtitleText,
  buttonText,
  shareMessage,
  shareUrl = "https://Uygulama.com",
  onShareComplete,
  imageSource = require("@/assets/images/main/share.png"),
}) => {
  
  const handleShare = async () => {
    try {
      // Copy text to clipboard
      Clipboard.setString(shareMessage);

      // Share message with link
      const result = await Share.share({
        message: shareMessage,
        url: shareUrl,
      });

      if (result.action === Share.sharedAction) {
        if (onShareComplete) {
          onShareComplete("success", "Sharing completed successfully");
        }
      }
    } catch (error) {
      if (onShareComplete) {
        onShareComplete("error", "Failed to share content");
      }
    }
  };

  return (
    <TouchableOpacity style={styles.container}>
      <View style={styles.textContainer}>
        <ReusableText
          text={titleText}
          family={"bold"}
          size={FontSizes.medium}
          color={Colors.black}
        />
        <ReusableText
          text={subtitleText}
          family={"regular"}
          size={FontSizes.xSmall}
          color={Colors.black}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleShare}
        >
          <ReusableText
            text={buttonText}
            family={"medium"}
            size={FontSizes.xSmall}
            color={Colors.lightWhite}
          />
        </TouchableOpacity>
      </View>
      <Image
        source={imageSource}
        style={styles.image}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    marginVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    gap: 15,
  },
  button: {
    borderRadius: 12,
    backgroundColor: Colors.black,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  image: {
    width: 150,
    height: 120,
  },
});

export default ReusableShare; 