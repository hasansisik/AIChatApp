import { View, ScrollView, Text, StyleSheet, Modal, Image, TouchableOpacity, Alert, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from 'yup';
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

// Example user data for testing
const exampleUser = {
  name: "Ahmet",
  surname: "Yılmaz",
  email: "ahmet.yilmaz@example.com",
  profile: {
    phoneNumber: "+90 555 123 4567",
    picture: null as string | null,
  },
  address: "Örnek Mahallesi, Örnek Sokak No:1"
};

const ProfileDetails: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState(exampleUser);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Request gallery permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      formik.setValues({
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        phoneNumber: user.profile?.phoneNumber || "",
        picture: user.profile?.picture || "",
        address: user.address || "",
        street: "",
        city: "",
        postalCode: "",
      });
    }
  }, [user]);

  const uploadImage = async (uri: string, user: any) => {
    try {
      // Simulate image upload - just use the local URI for demo
      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          picture: uri
        }
      }));
      formik.setFieldValue("picture", uri);
    } catch (error) {
      // Handle error silently
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
    phoneNumber: Yup.string().matches(/^\d+$/, t('validation.phoneNumberOnlyDigits'))
  });

  const submitHandler = async (): Promise<void> => {
    setLoading(true);
    const values = formik.values;
    
    // Simulate successful update
    try {
      // Update local user state with form values
      setUser(prev => ({
        ...prev,
        name: values.name || prev.name,
        surname: values.surname || prev.surname,
        email: values.email || prev.email,
        profile: {
          ...prev.profile,
          phoneNumber: values.phoneNumber || prev.profile?.phoneNumber,
        },
        address: values.address || prev.address
      }));

      // If email was updated, simulate navigation to verification
      if (values.email && values.email !== exampleUser.email) {
        setTimeout(() => {
          router.push({
            pathname: "/(auth)/verify",
            params: { email: values.email },
          });
        }, 2000);
      }
    } catch (error) {
      // Handle error silently
    }
    
    setLoading(false);
  };

  const formik: any = useFormik<{
    name: string;
    surname: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    picture: string;
    address: string;
    street: string;
    city: string;
    postalCode: string;
  }>({
    initialValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      picture: "",
      address: "",
      street: "",
      city: "",
      postalCode: "",
    },
    validationSchema,
    onSubmit: submitHandler,
  });

  const handleImageSelected = (url: string) => {
    formik.setFieldValue("picture", url);
    setModalVisible(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={global.flex}>
        <AppBar
          top={0}
          left={20}
          right={20}
          onPress={() => router.back()}
          color={Colors.white}
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

          {/* Phone Number */}
          <ReusableText
            text={t("profile.edit.phoneNumber")}
            family={"medium"}
            size={FontSizes.small}
            color={Colors.black}
          />
          <ReusableInput
            label={t("profile.edit.phoneNumber")}
            value={formik.values.phoneNumber}
            onChangeText={formik.handleChange("phoneNumber")}
            touched={formik.touched.phoneNumber}
            error={formik.errors.phoneNumber}
            labelColor={Colors.black}
            keyboardType="phone-pad"
          />

          {/* Address */}
          <ReusableText
            text={t("profile.edit.address")}
            family={"medium"}
            size={FontSizes.small}
            color={Colors.black}
          />
          <ReusableInput
            label={t("profile.edit.address")}
            value={formik.values.address}
            onChangeText={formik.handleChange("address")}
            touched={formik.touched.address}
            error={formik.errors.address}
            labelColor={Colors.black}
            multiline
            numberOfLines={3}
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
