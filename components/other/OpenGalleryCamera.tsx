import React, { useState, useEffect } from "react";
import { Image, View, Text, TouchableOpacity, Platform, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker"; 
import { storage } from "@/config"; 
import { useSelector } from "react-redux";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Colors } from "@/hooks/useThemeColor";
interface OpenGalleryCameraProps {
  onUploadComplete: (url: string) => void;
}

export default function OpenGalleryCamera({ onUploadComplete }: OpenGalleryCameraProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useSelector((state: any) => state.user);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Üzgünüz, galeri erişim izni gerekiyor!");
        }
      }
    })();
  }, []);

  const uploadImage = async (uri: string, user: any) => {
    try {
      setLoading(true);
      const response = await fetch(uri);
      const blob = await response.blob();

      const date = new Date();
      const formattedDate = date.toISOString().split(".")[0].replace("T", "-");

      const filename = `${user.name}-${formattedDate}.jpg`;

      const storageRef = ref(storage, `UygulamaProfilePhoto/${filename}`);

      await uploadBytes(storageRef, blob);

      const url = await getDownloadURL(storageRef);

      onUploadComplete(url);
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (result && !result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      await uploadImage(uri, user); 
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={pickImage}
        style={{
          width: 150,
          borderRadius: 30,
          paddingHorizontal: 30,
          paddingVertical: 15,
          marginVertical: 20,
          backgroundColor: Colors.primary,
          alignItems: "center",
        }}
        disabled={loading}
      >
        <Text style={{ color: Colors.lightWhite }}>
          {loading ? "Yükleniyor..." : "Galeriyi Aç"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
