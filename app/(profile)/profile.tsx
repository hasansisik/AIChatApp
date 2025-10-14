import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Modal,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { Colors } from "@/hooks/useThemeColor";
import { FontSizes } from "@/constants/Fonts";
import AppBar from "@/components/ui/AppBar";
import ReusableText from "@/components/ui/ReusableText";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import OpenGalleryCameraModal from "@/components/other/OpenGalleryCameraModal";
import { useTranslation } from "react-i18next";
import { loadUser, editProfile } from "@/redux/actions/userActions";

const Profile = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.user);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch<any>(loadUser());
  }, [dispatch]);

  const handleUploadComplete = async (url: string) => {
    try {
      const actionResult = await dispatch<any>(editProfile({ picture: url }));
      
      if (editProfile.fulfilled.match(actionResult)) {
        // Reload user data to get updated profile
        dispatch<any>(loadUser());
        setModalVisible(false);
      } else {
        console.error('Failed to update profile picture:', actionResult.payload);
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      setModalVisible(false);
    }
  };

  // Request gallery permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
    })();
  }, []);

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);
      const actionResult = await dispatch<any>(editProfile({ picture: uri }));
      
      if (editProfile.fulfilled.match(actionResult)) {
        // Reload user data to get updated profile
        dispatch<any>(loadUser());
      } else {
        console.error('Failed to update profile picture:', actionResult.payload);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (result && !result.canceled) {
      const uri = result.assets[0].uri;
      await uploadImage(uri); 
    }
  };

  const profileItems = [
    { label: t("profile.email"), value: user?.email || "-", icon: "mail" as const },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
        <AppBar
            top={0}
            left={0}
            right={20}
            onPress={() => router.back()}
            color={Colors.light}
            />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/(profile)/edit")}
          >
            <ReusableText
              text={t("common.edit")}
              family={"medium"}
              size={FontSizes.small}
              color={Colors.black}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <Image
                source={
                  user?.profile?.picture
                    ? { uri: user.profile.picture }
                    : require("../../assets/images/main/user.png")
                }
                style={styles.profileImage}
              />
              <TouchableOpacity 
                style={styles.statusIndicator} 
                onPress={openGallery}
                disabled={loading}
              >
                <Ionicons name="camera" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <ReusableText
              text={`${user?.name || ''} ${user?.surname || ''}`.trim() || 'User'}
              family={"bold"}
              size={FontSizes.large}
              color={Colors.lightBlack}
            />
            <ReusableText
              text={user?.email || ""}
              family={"regular"}
              size={FontSizes.xSmall}
              color={Colors.gray}
            />
          </View>

          <View style={styles.profileDetails}>
            {profileItems.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <View style={styles.detailItemIcon}>
                  <View style={styles.box}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={Colors.black}
                    />
                  </View>
                  <ReusableText
                    text={item.label}
                    family={"medium"}
                    size={FontSizes.small}
                    color={Colors.black}
                  />
                </View>

                <ReusableText
                  text={item.value}
                  family={"regular"}
                  size={FontSizes.small}
                  color={Colors.description}
                />
              </View>
            ))}
          </View>
          <View style={styles.detailPassword}>
            <View style={styles.detailItemIcon}>
              <View style={styles.box}>
                <Ionicons name={"key" as const} size={22} color={Colors.black} />
              </View>
              <ReusableText
                text={t("profile.password")}
                family={"medium"}
                size={FontSizes.small}
                color={Colors.black}
              />
            </View>

            <TouchableOpacity onPress={() => router.push("/(profile)/password")}>
              <ReusableText
                text={t("profile.changePassword")}
                family={"medium"}
                size={FontSizes.xSmall}
                color={Colors.black}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal for image selection */}
        <Modal visible={modalVisible} transparent={true}>
          <OpenGalleryCameraModal
            isVisible={modalVisible}
            onClose={() => setModalVisible(false)}
            onUploadComplete={handleUploadComplete}
          />
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  editButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: Colors.lightInput,
    borderRadius: 20,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 30,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightGray,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: Colors.black,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileDetails: {
    marginTop: 20,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightInput,
  },
  detailItemIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  box: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightInput,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  detailPassword: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
});

export default Profile;
