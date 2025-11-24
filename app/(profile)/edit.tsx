import { View, ScrollView, Text, StyleSheet, Modal, Image, TouchableOpacity, Alert, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from 'yup';
import { useSelector, useDispatch } from "react-redux";
import AppBar from "@/components/ui/AppBar";
import { Colors } from "@/hooks/useThemeColor";
import { Sizes } from "@/constants/Sizes";
import { FontSizes } from "@/constants/Fonts";
import ReusableInput from "@/components/ui/ReusableInput";
import ReusableButton from "@/components/ui/ReusableButton";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import global from "@/constants/Styles";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReusableText from "@/components/ui/ReusableText";
import * as ImagePicker from "expo-image-picker";
import OpenGalleryCameraModal from "@/components/other/OpenGalleryCameraModal";
import { useTranslation } from "react-i18next";
import { loadUser, editProfile } from "@/redux/actions/userActions";
import Toast from "@/components/ui/Toast";

const ProfileDetails: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.user);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const toastRef = React.useRef<any>(null);

  // Request gallery permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
    })();
  }, []);

  // Load user data on component mount
  useEffect(() => {
    dispatch<any>(loadUser());
  }, [dispatch]);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      formik.setValues({
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        picture: user.profile?.picture || "",
      });
    }
  }, [user]);

  // Show toast messages
  useEffect(() => {
    if (status && message) {
      toastRef.current?.show({
        type: status,
        text: message,
        duration: 3000,
      });
    }
  }, [status, message]);

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);
      const actionResult = await dispatch<any>(editProfile({ picture: uri }));
      
      if (editProfile.fulfilled.match(actionResult)) {
        formik.setFieldValue("picture", uri);
        setStatus("success");
        setMessage(t("profile.profilePictureSuccess"));
        // Reload user data to get updated profile
        dispatch<any>(loadUser());
      } else {
        setStatus("error");
        setMessage(actionResult.payload as string);
      }
    } catch (error) {
      setStatus("error");
      setMessage(t("profile.profilePictureError"));
    } finally {
      setLoading(false);
    }
  };

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().min(2, t('validation.nameMinLength')),
    surname: Yup.string().min(2, t('validation.surnameMinLength')),
    email: Yup.string().email(t('validation.invalidEmail')),
    password: Yup.string()
      .min(6, t('validation.passwordMinLength'))
      .test('password-match', t('validation.passwordsNotMatch'), function (value) {
        return !value || value === this.parent.confirmPassword;
      }),
    confirmPassword: Yup.string()
      .test('passwords-match', t('validation.passwordsNotMatch'), function (value) {
        return !this.parent.password || value === this.parent.password;
      }),
  });

  const submitHandler = async (): Promise<void> => {
    setLoading(true);
    const values = formik.values;
    
    try {
      // Prepare data for backend
      const updateData: any = {};
      
      // Only include fields that have values
      if (values.name && values.name !== user?.name) {
        updateData.name = values.name;
      }
      if (values.surname && values.surname !== user?.surname) {
        updateData.surname = values.surname;
      }
      if (values.email && values.email !== user?.email) {
        updateData.email = values.email;
      }
      if (values.password) {
        updateData.password = values.password;
        updateData.currentPassword = values.password; // For verification
      }

      // Only send request if there are changes
      if (Object.keys(updateData).length > 0) {
        const actionResult = await dispatch<any>(editProfile(updateData));
        
        if (editProfile.fulfilled.match(actionResult)) {
          setStatus("success");
          setMessage(t("profile.edit.updateSuccess"));
          
          // Reload user data
          dispatch<any>(loadUser());
          
          // If email was updated, navigate to verification
          if (values.email && values.email !== user?.email) {
            setTimeout(() => {
              router.push({
                pathname: "/(auth)/verify",
                params: { email: values.email },
              });
            }, 2000);
          } else {
            // Navigate back after successful update
            setTimeout(() => {
              router.back();
            }, 1500);
          }
        } else {
          setStatus("error");
          setMessage(actionResult.payload as string);
        }
      } else {
        setStatus("info");
        setMessage(t("profile.edit.noChangesMade"));
      }
    } catch (error) {
      setStatus("error");
      setMessage(t("profile.edit.updateError"));
    } finally {
      setLoading(false);
    }
  };

  const formik: any = useFormik<{
    name: string;
    surname: string;
    email: string;
    password: string;
    confirmPassword: string;
    picture: string;
  }>({
    initialValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
      picture: "",
    },
    validationSchema,
    onSubmit: submitHandler,
  });

  const handleImageSelected = (url: string) => {
    uploadImage(url);
    setModalVisible(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={global.flex}>
        <View style={{ paddingHorizontal: 15 }}>
          <Toast ref={toastRef} />
        </View>
        <AppBar
          top={0}
          left={20}
          right={20}
          onPress={() => router.back()}
          color={Colors.light}
          />
        <ScrollView 
          style={styles.profileInputs}
          showsVerticalScrollIndicator={false}
        >
          {/* Kişisel Bilgiler Başlığı */}
          <View style={{ paddingBottom: 15 }}>
            <ReusableText
              text={t("profile.edit.title")}
              family={"bold"}
              size={FontSizes.large}
              color={Colors.black}
            />
          </View>

          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={
                  formik.values.picture
                    ? { uri: formik.values.picture }
                    : require("../../assets/images/main/user.png")
                }
                style={styles.profileImage}
              />
              <TouchableOpacity 
                style={styles.cameraOverlay} 
                onPress={() => setModalVisible(true)}
                disabled={loading}
              >
                <Text style={styles.cameraText}>
                  {loading ? t('profile.edit.uploading') : t('profile.edit.change')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* İsim Soyisim */}
          <ReusableText
            text={t("profile.edit.name")}
            family={"medium"}
            size={FontSizes.small}
            color={Colors.black}
          />
          <ReusableInput
            label={t("profile.edit.name")}
            value={formik.values.name}
            onChangeText={formik.handleChange("name")}
            touched={formik.touched.name}
            error={formik.errors.name}
            labelColor={Colors.black}
          />

          <ReusableText
            text={t("profile.edit.surname")}
            family={"medium"}
            size={FontSizes.small}
            color={Colors.black}
          />
          <ReusableInput
            label={t("profile.edit.surname")}
            value={formik.values.surname}
            onChangeText={formik.handleChange("surname")}
            touched={formik.touched.surname}
            error={formik.errors.surname}
            labelColor={Colors.black}
          />

          {/* Email */}
          <ReusableText
            text={t("profile.edit.email")}
            family={"medium"}
            size={FontSizes.small}
            color={Colors.black}
          />
          <ReusableInput
            label={t("profile.edit.email")}
            value={formik.values.email}
            onChangeText={formik.handleChange("email")}
            touched={formik.touched.email}
            error={formik.errors.email}
            labelColor={Colors.black}
            keyboardType="email-address"
          />


          {/* Password Section */}
          <ReusableText
            text={t("profile.edit.password")}
            family={"medium"}
            size={FontSizes.small}
            color={Colors.black}
          />
          <ReusableInput
            label={t("profile.edit.password")}
            value={formik.values.password}
            onChangeText={formik.handleChange("password")}
            touched={formik.touched.password}
            error={formik.errors.password}
            labelColor={Colors.black}
            secureTextEntry
            placeholder={t("profile.edit.passwordPlaceholder")}
          />

          <ReusableText
            text={t("profile.edit.confirmPassword")}
            family={"medium"}
            size={FontSizes.small}
            color={Colors.black}
          />
          <ReusableInput
            label={t("profile.edit.confirmPassword")}
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange("confirmPassword")}
            touched={formik.touched.confirmPassword}
            error={formik.errors.confirmPassword}
            labelColor={Colors.black}
            secureTextEntry
            placeholder={t("profile.edit.confirmPasswordPlaceholder")}
          />

          {/* Submit Button */}
          <View style={styles.btnContainer}>
            <ReusableButton
              btnText={t("common.save")}
              width={Sizes.screenWidth - 40}
              height={50}
              borderRadius={Sizes.small}
              backgroundColor={Colors.lightBlack}
              textColor={Colors.lightWhite}
              textFontSize={FontSizes.small}
              textFontFamily={"medium"}
              disable={loading}
              onPress={formik.handleSubmit}
              loading={loading}
            />
          </View>
        </ScrollView>

        {/* Image Selection Modal */}
        <Modal visible={modalVisible} transparent={true}>
          <OpenGalleryCameraModal
            isVisible={modalVisible}
            onClose={() => setModalVisible(false)}
            onUploadComplete={handleImageSelected}
          />
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  profileInputs: {
    paddingVertical: 20,
    marginHorizontal: 20,
    gap: 20,
  },
  profilePictureSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGray,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingVertical: 8,
    alignItems: "center",
  },
  cameraText: {
    color: Colors.white,
    fontSize: FontSizes.xSmall,
    fontFamily: "medium",
  },
  btnContainer: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: "center",
  },
});

export default ProfileDetails;
