import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import { Colors } from "@/hooks/useThemeColor";
import { FontSizes } from "@/constants/Fonts";
import { Sizes } from "@/constants/Sizes";
import HeightSpacer from "@/components/ui/HeightSpacer";
import ReusableText from "@/components/ui/ReusableText";
import ReusableInput from "@/components/ui/ReusableInput";
import ReusableButton from "@/components/ui/ReusableButton";
import AppBar from "@/components/ui/AppBar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { resetPasswordSchema } from "@/utils/validation"; 
import Toast from "@/components/ui/Toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { resetPassword } from "@/redux/actions/userActions";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const toastRef = useRef<any>(null);

  useEffect(() => {
    if (status && message) {
      toastRef.current?.show({
        type: status,
        text: message,
        duration: 3000,
      });
    }
  }, [status, message]);

  const formik = useFormik({
    initialValues: {
      email: email as string,
      passwordToken: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      const actionResult = await dispatch(resetPassword(values) as any);
      if (resetPassword.fulfilled.match(actionResult)) {
        router.push("/(auth)/login");
        setStatus("success");
        setMessage(t("auth.resetPassword.success"));
      } else if (resetPassword.rejected.match(actionResult)) {
        setStatus("error");
        setMessage(actionResult.payload as string || t("auth.resetPassword.error"));
      }
      setTimeout(() => setStatus(null), 5000);
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Toast ref={toastRef} />
        <View>
          <AppBar
            top={10}
            left={0}
            right={20}
            onPress={() => router.back()}
            color={Colors.light}
          />
          <HeightSpacer height={15} />
          <ReusableText
            text={t("auth.resetPassword.title")}
            family={"bold"}
            size={FontSizes.xLarge}
            color={Colors.black}
          />
          <ReusableText
            text={t("auth.resetPassword.description")}
            family={"regular"}
            size={FontSizes.small}
            color={Colors.description}
          />
          <HeightSpacer height={20} />
          <ReusableInput
            label={t("auth.resetPassword.code")}
            labelColor={Colors.black}
            value={formik.values.passwordToken.toString()}
            onChangeText={(value) =>
              formik.setFieldValue("passwordToken", Number(value))
            }
            touched={formik.touched.passwordToken}
            error={formik.errors.passwordToken}
            keyboardType="numeric"
          />
          <ReusableInput
            label={t("auth.resetPassword.newPassword")}
            labelColor={Colors.black}
            value={formik.values.newPassword}
            onChangeText={formik.handleChange("newPassword")}
            touched={formik.touched.newPassword}
            error={formik.errors.newPassword}
          />
          <ReusableInput
            label={t("auth.resetPassword.confirmPassword")}
            labelColor={Colors.black}
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange("confirmPassword")}
            touched={formik.touched.confirmPassword}
            error={formik.errors.confirmPassword}
          />
          <HeightSpacer height={20} />
          <ReusableButton
            btnText={t("auth.resetPassword.resetButton")}
            width={Sizes.screenWidth - 40}
            height={55}
            borderRadius={Sizes.xxlarge}
            backgroundColor={Colors.purple}
            textColor={Colors.lightWhite}
            textFontFamily={"regular"}
            onPress={formik.handleSubmit}
          />
        </View>
        <HeightSpacer height={30} />
        <View style={styles.footer}>
          <ReusableText
            text={t("auth.resetPassword.noAccount")}
            family={"regular"}
            size={FontSizes.small}
            color={Colors.description}
          />
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <ReusableText
              text={t("auth.resetPassword.register")}
              family={"bold"}
              size={FontSizes.small}
              color={Colors.lightBlack}
            />
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: Colors.white,
    justifyContent: "space-between",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
});

export default ResetPassword;