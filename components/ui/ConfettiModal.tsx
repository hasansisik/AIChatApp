import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import ConfettiCannon from "react-native-confetti-cannon";
import { useRouter } from "expo-router";
import ReusableText from "./ReusableText";
import ReusableButton from "./ReusableButton";
import { Colors } from "@/hooks/useThemeColor";

import { FontSizes } from "@/constants/Fonts";

const ConfettiModal: React.FC<{ isVisible: boolean; onClose: () => void }> = ({
  isVisible,
  onClose,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
    }
  }, [isVisible]);

  const navigateToOrder = () => {
    onClose();
    router.push("/");
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      {showConfetti && (
        <ConfettiCannon
          count={350}
          origin={{ x: -10, y: 0 }}
          fallSpeed={2000}
        />
      )}
      <View style={styles.modalContent}>
        <ReusableText
          text={"TEBRİKLER! \nBaşarılı şekilde kayıtınızı tamamladınız."}
          family={"bold"}
          size={FontSizes.large}
          color={Colors.black}
          align="center"
        />
        <ReusableText
          text={
            "En kısa zamanda kayıt olduğunuz sürücü kursu tarafından aranacaksınız lütfen bekleyin, Bu süreci Kurs Kayıt Durumu sayfasından takip edebilirsiniz."
          }
          family={"regular"}
          size={FontSizes.small}
          color={Colors.description}
        />
        <View style={styles.modalButtons}>
          <ReusableButton
            btnText={"Vazgeç"}
            height={48}
            width={125}
            borderRadius={25}
            borderWidth={1}
            borderColor={Colors.gray}
            textColor={Colors.black}
            onPress={onClose}
          />
          <ReusableButton
            btnText={"Kurs Kayıt Durumu"}
            height={48}
            width={175}
            backgroundColor={Colors.primary}
            borderRadius={25}
            textColor={Colors.lightWhite}
            textFontFamily="medium"
            onPress={navigateToOrder}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    padding: 20,
    backgroundColor: Colors.lightWhite,
    borderRadius: 10,
    alignItems: "center",
    gap:15
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
});

export default ConfettiModal;
