import { Text, View, TouchableOpacity } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { login } from "@/redux/actions/userActions";
import { useFormik } from "formik";
import { FontSizes } from "@/constants/Fonts";
import { Sizes } from "@/constants/Sizes";
import HeightSpacer from "@/components/ui/HeightSpacer";
import ReusableText from "@/components/ui/ReusableText";
import ReusableInput from "@/components/ui/ReusableInput";
import ReusableButton from "@/components/ui/ReusableButton";
import styles from "@/constants/Styles";
import { useRouter } from "expo-router";
import Toast from "@/components/ui/Toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppBar from "@/components/ui/AppBar";
import { Colors } from "@/hooks/useThemeColor";
import { useTranslation } from "react-i18next";

interface LoginProps {
  navigation: any;
}

const Login: React.FC<LoginProps> = () => {
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
    initialValues: { email: "", password: "" },
    onSubmit: async (values) => {
      const actionResult = await dispatch(login(values) as any);
      if (login.fulfilled.match(actionResult)) {
        setStatus("success");
        setMessage(t("auth.login.success"));
        router.replace("/");
      } else if (login.rejected.match(actionResult)) {
        setStatus("error");
        setMessage((actionResult.payload as string) || t("auth.login.error"));
      }
      setTimeout(() => setStatus(null), 5000);
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, styles.statusBar]}>
        <Toast ref={toastRef} />
        <View>
          <AppBar
            top={0}
            left={0}
            right={20}
            onPress={() => router.back()}
            color={Colors.white}
          />
          <HeightSpacer height={15} />
          {/* Text */}
          <ReusableText
            text={t("auth.login.title")}
            family={"bold"}
            size={FontSizes.xLarge}
            color={Colors.black}
          />
          <HeightSpacer height={20} />
          {/* Email Input */}
          <ReusableInput
            label={t("auth.login.email")}
            value={formik.values.email}
            onChangeText={formik.handleChange("email")}
            touched={formik.touched.password}
            error={formik.errors.email}
            loading={formik.isSubmitting}
            labelColor={Colors.black}
          />
          {/* Password Input */}
          <ReusableInput
            label={t("auth.login.password")}
            secureTextEntry={true}
            value={formik.values.password}
            onChangeText={formik.handleChange("password")}
            touched={formik.touched.password}
            error={formik.errors.password}
          />
          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgotpassword")}
          >
            <Text style={{ ...styles.label, textDecorationLine: "underline" }}>
              {t("auth.login.forgotPassword")}
            </Text>
          </TouchableOpacity>
          <HeightSpacer height={20} />
          {/* Login Button */}
          <ReusableButton
            btnText={t("auth.login.loginButton")}
            width={Sizes.screenWidth - 40}
            height={45}
            borderRadius={Sizes.small}
            backgroundColor={Colors.lightBlack}
            textColor={Colors.lightWhite}
            onPress={formik.handleSubmit}
          />
        </View>
        <HeightSpacer height={30} />
        <View style={styles.footer}>
          <ReusableText
            text={t("auth.login.noAccount")}
            family={"regular"}
            size={FontSizes.small}
            color={Colors.description}
          />
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <ReusableText
              text={t("auth.login.register")}
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

export default Login;
