import { 
  Text, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Keyboard, 
  Animated 
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { login, loadUser } from "@/redux/actions/userActions";
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const toastRef = useRef<any>(null);
  const inputAnimation = useRef(new Animated.Value(0)).current;
  const textAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status && message) {
      toastRef.current?.show({
        type: status,
        text: message,
        duration: 3000,
      });
    }
  }, [status, message]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
        Animated.timing(inputAnimation, {
          toValue: 50,
          duration: 500,
          useNativeDriver: true,
        }).start();
        Animated.timing(textAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
        Animated.timing(inputAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
        Animated.timing(textAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [inputAnimation, textAnimation]);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    onSubmit: async (values) => {
      const actionResult = await dispatch(login(values) as any);
      if (login.fulfilled.match(actionResult)) {
        setStatus("success");
        setMessage(t("auth.login.success"));
        // Load user data after successful login
        await dispatch(loadUser() as any);
        router.replace("/");
      } else if (login.rejected.match(actionResult)) {
        setStatus("error");
        setMessage((actionResult.payload as string) || t("auth.login.error"));
      }
      setTimeout(() => setStatus(null), 5000);
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      style={{ flex: 1 }}
    >
      <GestureHandlerRootView style={loginStyles.container}>
        <View style={[styles.container, styles.statusBar, loginStyles.mainContainer]}>
          <Toast ref={toastRef} />

          
          {/* Video Background */}
          <Animated.View
            style={[
              loginStyles.videoContainer,
              {
                opacity: textAnimation,
                transform: [
                  {
                    translateY: textAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Video
              source={isDark ? require('@/assets/video/Tlogotm-dark.mp4') : require('@/assets/video/Tlogotm.mp4')}
              style={loginStyles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping
              isMuted
            />
          </Animated.View>
          
          {/* Content Container */}
          <Animated.View
            style={[
              loginStyles.contentContainer,
              {
                transform: [
                  {
                    translateY: inputAnimation,
                  },
                ],
                justifyContent: isKeyboardVisible ? 'flex-end' : 'center',
              },
            ]}
          >
            <View>
              {/* Text */}
              <ReusableText
                text={t("auth.login.title")}
                family={"bold"}
                size={FontSizes.xLarge}
                color={Colors.black}
                align={"center"}
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
                btnText={formik.isSubmitting ? "Giriş yapılıyor..." : t("auth.login.loginButton")}
                width={Sizes.screenWidth - 40}
                height={55}
                borderRadius={Sizes.xxlarge}
                backgroundColor={Colors.purple}
                textColor={Colors.lightWhite}
                onPress={formik.handleSubmit}
                disable={formik.isSubmitting}
              />
            </View>
            <HeightSpacer height={30} />
            {!isKeyboardVisible && (
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
            )}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </KeyboardAvoidingView>
  );
};

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainContainer: {
    justifyContent: 'flex-end',
    backgroundColor: Colors.background,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.background,
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
