import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
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
import { Video, ResizeMode } from "expo-av";
import { useTheme } from "@/hooks/useThemeColor";

interface LoginProps {
  navigation: any;
}

const Login: React.FC<LoginProps> = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isDark } = useTheme();

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
    <GestureHandlerRootView style={loginStyles.container}>
      <View style={[styles.container, styles.statusBar, loginStyles.mainContainer]}>
        <Toast ref={toastRef} />
        <AppBar
          top={0}
          left={0}
          right={20}
          onPress={() => router.back()}
          color={Colors.white}
        />
        
        {/* Video Background */}
        <View style={loginStyles.videoContainer}>
          <Video
            source={isDark ? require('@/assets/video/Tlogotm-dark.mp4') : require('@/assets/video/Tlogotm.mp4')}
            style={loginStyles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            isMuted
          />
        </View>
        
        <View style={loginStyles.contentContainer}>
          <View>
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
              <Text style={[styles.label, loginStyles.forgotPasswordText]}>
                {t("auth.login.forgotPassword")}
              </Text>
            </TouchableOpacity>
            <HeightSpacer height={20} />
            {/* Login Button */}
            <ReusableButton
              btnText={t("auth.login.loginButton")}
              width={Sizes.screenWidth - 40}
              height={55}
              borderRadius={Sizes.xxlarge}
              backgroundColor={Colors.purple}
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
      </View>
    </GestureHandlerRootView>
  );
};

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightWhite,
  },
  mainContainer: {
    justifyContent: 'flex-end',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.lightWhite,
  },
  video: {
    width: '100%',
    height: '100%',
    maxHeight: 300,
  },
  contentContainer: {
    justifyContent: 'flex-end',
    paddingBottom: 100,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: 20,
    paddingTop: 30,
    borderTopLeftRadius: Sizes.xxlarge,
    borderTopRightRadius: Sizes.xxlarge,
  },
  forgotPasswordText: {
    textDecorationLine: "underline",
  },
});

export default Login;
