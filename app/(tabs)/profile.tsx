import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { editProfile, loadUser, logout, getFavoriteAIs, removeFavoriteAI } from "@/redux/actions/userActions";
import AppBar from "@/components/ui/AppBar";
import { Colors } from "@/hooks/useThemeColor";
import ReusableText from "@/components/ui/ReusableText";
import { FontSizes } from "@/constants/Fonts";
import { Feather, Ionicons } from "@expo/vector-icons";
import Toast from "@/components/ui/Toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ProfileCard from "@/components/cards/ProfileCard";
import OpenGalleryCameraModal from "@/components/other/OpenGalleryCameraModal";
import { useTranslation } from "react-i18next";
import CouponModal from "@/components/ui/CouponModal";
import PurchaseModal from "@/components/ui/PurchaseModal";
import CouponSelectionModal from "@/components/ui/CouponSelectionModal";

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [couponSelectionModalVisible, setCouponSelectionModalVisible] = useState(false);
  const toastRef = useRef<any>(null);
  const favoritesLoadedRef = useRef(false);

  useEffect(() => {
    dispatch<any>(loadUser());
  }, [dispatch]);

  useEffect(() => {
    // User yüklendiğinde favorileri yükle (sadece bir kez)
    if (user && user._id) {
      // Eğer favoriteAIs yoksa veya daha önce yüklenmemişse yükle
      if (!favoritesLoadedRef.current) {
        favoritesLoadedRef.current = true;
        dispatch<any>(getFavoriteAIs());
      }
    } else {
      // User yoksa flag'i resetle
      favoritesLoadedRef.current = false;
    }
  }, [dispatch, user?._id]);

  useEffect(() => {
    if (status && message) {
      toastRef.current?.show({
        type: status,
        text: message,
        duration: 3000,
      });
    }
  }, [status, message]);

  const handleImageSelected = async (url: string) => {
    try {
      const actionResult = await dispatch<any>(editProfile({ picture: url }));

      if (editProfile.fulfilled.match(actionResult)) {
        setStatus("success");
        setMessage(t("profile.profilePictureSuccess"));
        dispatch<any>(loadUser()); // Reload user data
      } else if (editProfile.rejected.match(actionResult)) {
        setStatus("error");
        setMessage(actionResult.payload as string);
      }
    } catch (error) {
      setStatus("error");
      setMessage(t("profile.profilePictureError"));
    }
  };

  const logoutHandler = () => {
    dispatch<any>(logout());
    router.push("/(auth)/login");
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.flex}>
        <StatusBar barStyle="dark-content" />
        <View style={{ paddingHorizontal: 15 }}>
          <Toast ref={toastRef} />
        </View>
        <AppBar
          top={0}
          left={0}
          right={20}
          color={Colors.light}
          onPress={() => router.back()}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            style={styles.header}
            onPress={() =>
              user
                ? router.push("/(profile)/profile")
                : router.push("/(profile)/profile")
            }
          >
            <View style={styles.profile}>
              <View style={styles.imageContainer}>
                <Image
                  source={
                    user?.profile?.picture
                      ? { uri: user.profile.picture }
                      : require("@/assets/images/person.png")
                  }
                  style={styles.image}
                />
              </View>
              <View>
                <ReusableText
                  text={user?.name ? user?.name : t("profile.tabs.guest")}
                  family={"medium"}
                  size={FontSizes.small}
                  color={Colors.black}
                />
                <ReusableText
                  text={
                    user
                      ? t("profile.tabs.viewProfile")
                      : t("profile.tabs.loginOrRegister")
                  }
                  family={"regular"}
                  size={FontSizes.xSmall}
                  color={Colors.description}
                />
              </View>
            </View>
            <View style={styles.box}>
              <Feather name="chevron-right" size={20} />
            </View>
          </TouchableOpacity>

          {/* Menu */}
          <View style={styles.list}>
            <View style={styles.listHeader}>
              <Ionicons
                name="reorder-three-outline"
                size={30}
                color={Colors.lightGray}
              />
              <ReusableText
                text={t("profile.tabs.helpAndSupport")}
                family={"medium"}
                size={FontSizes.medium}
                color={Colors.black}
              />
            </View>
            {/* Favori AI'lar */}
            {user && (
              <ProfileCard
                title={t("profile.tabs.favoriteAI")}
                icon={"heart"}
                onPress={() => router.push("/(profile)/favorite-ais")}
              />
            )}
            {/* Menu3 */}
            <ProfileCard
              title={t("profile.tabs.language")}
              icon={"language"}
              onPress={() => router.push("/(profile)/language")}
            />
            {/* Kupon Kodu */}
            {user && (
              <ProfileCard
                title={t("profile.tabs.couponCode")}
                icon={"ticket"}
                onPress={() => {
                  // Show selection modal first
                  setCouponSelectionModalVisible(true);
                }}
              />
            )}
            {/* Menu4 */}
            <ProfileCard
              title={t("profile.tabs.policies")}
              icon={"document-text"}
              onPress={() => router.push("/(profile)/politicy/politcy")}
            />
            {/* Menu5 */}
            <ProfileCard
              title={t("profile.tabs.faq")}
              icon={"chatbubble-ellipses"}
              onPress={() => router.push("/(profile)/faq")}
            />
            {/* Menu6 */}
            <ProfileCard
              title={t("profile.tabs.help")}
              icon={"help-buoy"}
              onPress={() => router.push("/(profile)/help")}
            />
            {/* Menu7 */}
            {user ? (
              <>
                <ProfileCard
                  title={t("profile.tabs.deleteAccount")}
                  icon={"trash"}
                  onPress={() => {
                    Alert.alert(
                      t("profile.tabs.deleteAccountTitle"),
                      t("profile.tabs.deleteAccountMessage"),
                      [
                        {
                          text: t("common.cancel"),
                          style: "cancel"
                        },
                        {
                          text: t("profile.tabs.delete"),
                          style: "destructive",
                          onPress: () => {
                            // Here you would implement account deletion logic
                            // For now, just show a message
                            setStatus("info");
                            setMessage(t("profile.tabs.deleteAccountProcessing"));
                          }
                        }
                      ]
                    );
                  }}
                  color={Colors.red}
                  titleColor={Colors.red}
                />
                <ProfileCard
                  title={t("profile.tabs.logout")}
                  icon={"log-out"}
                  onPress={logoutHandler}
                  color={Colors.red}
                  titleColor={Colors.red}
                />
              </>
            ) : (
              <ProfileCard
                title={t("profile.tabs.login")}
                icon={"log-in"}
                onPress={() => router.push("/(auth)/login")}
                color={Colors.green}
                titleColor={Colors.green}
              />
            )}
          </View>
        </ScrollView>

        {/* Image Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <OpenGalleryCameraModal
            isVisible={modalVisible}
            onClose={() => setModalVisible(false)}
            onUploadComplete={handleImageSelected}
          />
        </Modal>

        {/* Coupon Selection Modal */}
        <CouponSelectionModal
          visible={couponSelectionModalVisible}
          onClose={() => setCouponSelectionModalVisible(false)}
          onHasCoupon={() => {
            setCouponSelectionModalVisible(false);
            setCouponModalVisible(true);
          }}
          onNoCoupon={() => {
            setCouponSelectionModalVisible(false);
            setPurchaseModalVisible(true);
          }}
        />

        {/* Purchase Modal */}
        <PurchaseModal
          visible={purchaseModalVisible}
          onClose={() => setPurchaseModalVisible(false)}
        />

        {/* Coupon Modal */}
        <CouponModal
          visible={couponModalVisible}
          onClose={() => setCouponModalVisible(false)}
          onSuccess={async () => {
            setCouponModalVisible(false);
            await dispatch<any>(loadUser());
            setStatus("success");
            setMessage(t("coupon.success"));
          }}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 25,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 25,
  },
  imageContainer: {
    position: "relative",
    width: 50,
    height: 50,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.backgroundBox,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 30,
  },
  box: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.backgroundBox,
  },
  list: {
    gap: 15,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
  },
  modalContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeButton: {
    padding: 10,
    backgroundColor: Colors.error,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
  },
});

export default Profile;
