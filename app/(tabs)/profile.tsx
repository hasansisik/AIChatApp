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
import { editProfile, loadUser, logout, getFavoriteAIs, removeFavoriteAI, deleteAccount } from "@/redux/actions/userActions";
import { validateCoupon } from "@/redux/actions/couponActions";
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
import { TextInput, ActivityIndicator } from "react-native";

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const toastRef = useRef<any>(null);
  const favoritesLoadedRef = useRef(false);

  useEffect(() => {
    const loadUserData = async () => {
      const result = await dispatch<any>(loadUser());
      if (loadUser.rejected.match(result)) {
        router.replace("/(auth)/login");
      }
    };
    loadUserData();
  }, [dispatch, router]);

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

  const handleCodeSubmit = async () => {
    if (!courseCode.trim()) {
      setStatus("error");
      setMessage(t("coupon.enterCode"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch<any>(validateCoupon(courseCode.trim().toUpperCase()));
      if (validateCoupon.fulfilled.match(result)) {
        await dispatch<any>(loadUser());
        setCodeModalVisible(false);
        setCourseCode("");
        setStatus("success");
        setMessage(t("coupon.success"));
      } else {
        setStatus("error");
        setMessage(result.payload || t("coupon.error"));
      }
    } catch (error) {
      setStatus("error");
      setMessage(t("common.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmStep === 0) {
      // İlk onay: "Emin misiniz?"
      Alert.alert(
        t("profile.tabs.deleteAccountTitle"),
        t("profile.tabs.deleteAccountMessage"),
        [
          {
            text: t("common.cancel"),
            style: "cancel",
            onPress: () => setDeleteConfirmStep(0),
          },
          {
            text: t("common.continue"),
            style: "destructive",
            onPress: () => {
              setDeleteConfirmStep(1);
              // İkinci onay: "Geri alınamaz"
              setTimeout(() => {
                Alert.alert(
                  t("profile.tabs.deleteAccountTitle"),
                  t("profile.tabs.deleteAccountFinalWarning"),
                  [
                    {
                      text: t("common.cancel"),
                      style: "cancel",
                      onPress: () => setDeleteConfirmStep(0),
                    },
                    {
                      text: t("profile.tabs.delete"),
                      style: "destructive",
                      onPress: async () => {
                        try {
                          setIsSubmitting(true);
                          const result = await dispatch<any>(deleteAccount());
                          if (deleteAccount.fulfilled.match(result)) {
                            setStatus("success");
                            setMessage(result.payload || t("profile.tabs.deleteAccountSuccess"));
                            // Clear state and logout before redirect
                            await dispatch<any>(logout());
                            // Redirect to login after logout completes
                            setTimeout(() => {
                              router.replace("/(auth)/login");
                            }, 1000);
                          } else {
                            setStatus("error");
                            setMessage(result.payload || t("profile.tabs.deleteAccountError"));
                            setDeleteConfirmStep(0);
                          }
                        } catch (error) {
                          setStatus("error");
                          setMessage(t("profile.tabs.deleteAccountError"));
                          setDeleteConfirmStep(0);
                        } finally {
                          setIsSubmitting(false);
                        }
                      },
                    },
                  ]
                );
              }, 300);
            },
          },
        ]
      );
    }
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
            {/* Kupon Kodu - En üstte */}
            {user && (
              <View style={styles.couponCard}>
                <View style={styles.couponInfo}>
                  <Ionicons name="ticket" size={24} color={Colors.primary} />
                  <View style={styles.couponTextContainer}>
                    <ReusableText
                      text={t("profile.tabs.couponCode")}
                      family="medium"
                      size={FontSizes.small}
                      color={Colors.black}
                    />
                    {user?.activeCouponCode || user?.courseCode ? (
                      <ReusableText
                        text={user?.activeCouponCode || user?.courseCode || ""}
                        family="regular"
                        size={FontSizes.xSmall}
                        color={Colors.description}
                        style={styles.couponCodeText}
                      />
                    ) : (
                      <ReusableText
                        text={t("profile.tabs.noCouponCode")}
                        family="regular"
                        size={FontSizes.xSmall}
                        color={Colors.description}
                        style={styles.couponCodeText}
                      />
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => {
                    setCourseCode(user?.activeCouponCode || user?.courseCode || "");
                    setCodeModalVisible(true);
                  }}
                >
                  <ReusableText
                    text={t("common.change")}
                    family="medium"
                    size={FontSizes.xSmall}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            )}
            {/* Favori AI'lar */}
            {user && (
              <ProfileCard
                title={t("profile.tabs.favoriteAI")}
                icon={"heart"}
                onPress={() => router.push("/(profile)/favorite-ais")}
              />
            )}
            {/* Dil */}
            <ProfileCard
              title={t("profile.tabs.language")}
              icon={"language"}
              onPress={() => router.push("/(profile)/language")}
            />
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
                  onPress={handleDeleteAccount}
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

        {/* Code Change Modal */}
        <Modal
          visible={codeModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCodeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ReusableText
                text={t('profile.tabs.changeCouponCode')}
                family="bold"
                size={FontSizes.large}
                color={Colors.black}
              />
              <TextInput
                style={styles.codeInput}
                placeholder={t('profile.tabs.couponCodePlaceholder')}
                placeholderTextColor={Colors.lightGray}
                value={courseCode}
                onChangeText={setCourseCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setCodeModalVisible(false);
                    setCourseCode("");
                  }}
                >
                  <ReusableText
                    text={t('common.cancel')}
                    family="medium"
                    size={FontSizes.small}
                    color={Colors.black}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCodeSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <ReusableText
                      text={t('common.save')}
                      family="medium"
                      size={FontSizes.small}
                      color={Colors.white}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
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
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    marginBottom: 5,
  },
  couponInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  couponTextContainer: {
    flex: 1,
    gap: 4,
  },
  couponCodeText: {
    marginTop: 2,
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    gap: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: FontSizes.medium,
    color: Colors.black,
    backgroundColor: Colors.background,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.backgroundBox,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
});

export default Profile;
