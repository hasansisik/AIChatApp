import { View, ScrollView, StyleSheet } from "react-native";
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
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
import * as Yup from 'yup';
import { useTranslation } from "react-i18next";

const PasswordChange: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Current password, Step 2: New password

  // Password validation schema
  const passwordSchema = Yup.object().shape({
    newPassword: Yup.string()
      .min(6, t('validation.passwordMinLength'))
      .required(t('validation.passwordRequired')),
    confirmNewPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], t('validation.passwordsNotMatch'))
      .required(t('validation.confirmPasswordRequired')),
  });

  // Handle current password verification
  const handleCurrentPasswordSubmit = async () => {
    const values = currentPasswordFormik.values;
    
    if (!values.currentPassword) {
      return;
    }
    
    setLoading(true);
    
    // Simulate password verification
    setTimeout(() => {
      // Simulate successful verification
      setStep(2);
      setLoading(false);
    }, 1000);
  };

  // Handle new password submission
  const handleNewPasswordSubmit = async () => {
    try {
      await passwordSchema.validate(newPasswordFormik.values);
      
      const values = newPasswordFormik.values;
      
      if (values.newPassword !== values.confirmNewPassword) {
        return;
      }
      
      setLoading(true);
      
      // Simulate password change
      setTimeout(() => {
        setTimeout(() => {
          router.back();
        }, 2000);
        setLoading(false);
      }, 1000);
      
    } catch (error: any) {
      // Handle error silently
    }
  };

  // Current password form
  const currentPasswordFormik = useFormik({
    initialValues: {
      currentPassword: "",
    },
    onSubmit: handleCurrentPasswordSubmit,
  });

  // New password form
  const newPasswordFormik = useFormik({
    initialValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
    validationSchema: passwordSchema,
    onSubmit: handleNewPasswordSubmit,
  });

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
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? (
            // Current Password Section
            <View>
              <View style={{ paddingBottom: 15 }}>
                <ReusableText
                  text={t('profile.currentPassword')}
                  family={"bold"}
                  size={FontSizes.large}
                  color={Colors.black}
                />
                <ReusableText
                  text={t('profile.enterCurrentPasswordDescription')}
                  family={"regular"}
                  size={FontSizes.small}
                  color={Colors.gray}
                />
              </View>
              <ReusableInput
                label={t('profile.currentPassword')}
                labelColor={Colors.black}
                value={currentPasswordFormik.values.currentPassword}
                onChangeText={currentPasswordFormik.handleChange(
                  "currentPassword"
                )}
                touched={currentPasswordFormik.touched.currentPassword}
                error={currentPasswordFormik.errors.currentPassword}
                secureTextEntry
              />

              <View style={styles.btnContainer}>
                <ReusableButton
                  btnText={t('common.confirm')}
                  width={Sizes.screenWidth - 40}
                  height={46}
                  borderRadius={Sizes.small}
                  backgroundColor={Colors.lightBlack}
                  textColor={Colors.lightWhite}
                  textFontSize={FontSizes.small}
                  textFontFamily={"medium"}
                  disable={loading}
                  onPress={currentPasswordFormik.handleSubmit}
                  loading={loading}
                />
              </View>
            </View>
          ) : (
            // New Password Section
            <View>
                <View style={{ paddingBottom: 15 }}>
                <ReusableText
                  text={t('profile.newPassword')}
                  family={"bold"}
                  size={FontSizes.large}
                  color={Colors.black}
                />
                <ReusableText
                  text={t('profile.setNewPassword')}
                  family={"regular"}
                  size={FontSizes.small}
                  color={Colors.gray}
                />
              </View>
              <ReusableInput
                label={t('profile.password')}
                labelColor={Colors.black}
                value={newPasswordFormik.values.newPassword}
                onChangeText={newPasswordFormik.handleChange("newPassword")}
                touched={newPasswordFormik.touched.newPassword}
                error={newPasswordFormik.errors.newPassword}
                secureTextEntry
              />
              <ReusableInput
                label={t('profile.confirmPassword')}
                labelColor={Colors.black}
                value={newPasswordFormik.values.confirmNewPassword}
                onChangeText={newPasswordFormik.handleChange(
                  "confirmNewPassword"
                )}
                touched={newPasswordFormik.touched.confirmNewPassword}
                error={newPasswordFormik.errors.confirmNewPassword}
                secureTextEntry
              />

              <View style={styles.btnContainer}>
                <ReusableButton
                  btnText={t('profile.changePassword')}
                  width={Sizes.screenWidth - 40}
                  height={50}
                  borderRadius={Sizes.small}
                  backgroundColor={Colors.lightBlack}
                  textColor={Colors.lightWhite}
                  textFontSize={FontSizes.small}
                  textFontFamily={"medium"}
                  disable={loading}
                  onPress={newPasswordFormik.handleSubmit}
                  loading={loading}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 20,
  },
  btnContainer: {
    marginTop: 30,
    alignItems: "center",
  },
});

export default PasswordChange;
