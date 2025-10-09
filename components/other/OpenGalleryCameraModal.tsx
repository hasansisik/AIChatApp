import React from "react";
import { View, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import OpenGalleryCamera from "@/components/other/OpenGalleryCamera";
import ReusableButton from "@/components/ui/ReusableButton";
import { Colors } from "@/hooks/useThemeColor";

interface OpenGalleryCameraModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
}

const OpenGalleryCameraModal: React.FC<OpenGalleryCameraModalProps> = ({
  isVisible,
  onClose,
  onUploadComplete,
}) => {
  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        <ReusableButton
          btnText={"Vazgeç"}
          height={48}
          width={150}
          borderRadius={25}
          borderWidth={1}
          borderColor={Colors.gray}
          textColor={Colors.black}
          onPress={onClose}
        />
        <OpenGalleryCamera onUploadComplete={onUploadComplete} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
});

export default OpenGalleryCameraModal;
