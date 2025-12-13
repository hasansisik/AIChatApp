import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  ScrollView
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import { FontSizes } from "@/constants/Fonts";
import { Sizes } from "@/constants/Sizes";
import HeightSpacer from "@/components/ui/HeightSpacer";
import ReusableText from "@/components/ui/ReusableText";
import ReusableInput from "@/components/ui/ReusableInput";
import ReusableButton from "@/components/ui/ReusableButton";
import AppBar from "@/components/ui/AppBar";
import { useRouter } from "expo-router";
import Toast from "@/components/ui/Toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { register, loadUser } from "@/redux/actions/userActions";
import { Colors } from "@/hooks/useThemeColor";
import { useTranslation } from "react-i18next";
import { registerSchema } from "@/utils/validation";

const Register = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();

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
    initialValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
      complianceModal: false,
    },
    validationSchema: registerSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      const actionResult = await dispatch(
        register({
          name: values.name,
          surname: values.surname,
          email: values.email,
          password: values.password,
        }) as any
      );
      if (register.fulfilled.match(actionResult)) {
        // Load user data after successful registration
        await dispatch(loadUser() as any);
        router.push({
          pathname: "/(auth)/verify",
          params: { email: values.email },
        });
        setStatus("success");
        setMessage(t("auth.register.success"));
      } else if (register.rejected.match(actionResult)) {
        setStatus("error");
        setMessage((actionResult.payload as string) || t("auth.register.error"));
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
      <GestureHandlerRootView style={registerStyles.container}>

        <View style={[styles.container]}>
          <Toast ref={toastRef} />
          <AppBar
            top={10}
            left={20}
            right={20}
            onPress={() => router.back()}
            color={Colors.light}
          />

          {/* Content Container */}
          <Animated.View
            style={[
              registerStyles.contentContainer,
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
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={registerStyles.scrollContent}
            >
              {/* Text */}
              <ReusableText
                text={t("auth.register.title")}
                family={"bold"}
                size={FontSizes.xLarge}
                color={Colors.black}
                align={"center"}
              />
              <HeightSpacer height={20} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 5 }}>
                  <ReusableInput
                    label={t("auth.register.name")}
                    labelColor={Colors.black}
                    value={formik.values.name}
                    onChangeText={formik.handleChange("name")}
                    touched={formik.touched.name}
                    error={formik.errors.name}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                  <ReusableInput
                    label={t("auth.register.surname")}
                    labelColor={Colors.black}
                    value={formik.values.surname}
                    onChangeText={formik.handleChange("surname")}
                    touched={formik.touched.surname}
                    error={formik.errors.surname}
                  />
                </View>
              </View>
              <ReusableInput
                label={t("auth.register.email")}
                labelColor={Colors.black}
                value={formik.values.email}
                onChangeText={formik.handleChange("email")}
                touched={formik.touched.email}
                error={formik.errors.email}
              />
              <ReusableInput
                label={t("auth.register.password")}
                secureTextEntry={true}
                labelColor={Colors.black}
                value={formik.values.password}
                onChangeText={formik.handleChange("password")}
                touched={formik.touched.password}
                error={formik.errors.password}
                textContentType="oneTimeCode"
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
              />
              <ReusableInput
                label={t("auth.register.confirmPassword")}
                secureTextEntry={true}
                labelColor={Colors.black}
                value={formik.values.confirmPassword}
                onChangeText={formik.handleChange("confirmPassword")}
                touched={formik.touched.confirmPassword}
                error={formik.errors.confirmPassword}
                textContentType="oneTimeCode"
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
              />
              <HeightSpacer height={20} />
              <ReusableButton
                btnText={formik.isSubmitting ? t("auth.register.registering") : t("auth.register.registerButton")}
                width={Sizes.screenWidth - 42}
                height={55}
                borderRadius={Sizes.xxlarge}
                backgroundColor={Colors.purple}
                textColor={Colors.lightWhite}
                textFontFamily={"regular"}
                onPress={formik.handleSubmit}
                disable={formik.isSubmitting}
              />

            </ScrollView>
          </Animated.View>
        </View>
        {!isKeyboardVisible && (
          <View style={styles.footer}>
            <ReusableText
              text={t("auth.register.haveAccount")}
              family={"regular"}
              size={FontSizes.small}
              color={Colors.description}
            />
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <ReusableText
                text={t("auth.register.login")}
                family={"bold"}
                size={FontSizes.small}
                color={Colors.lightBlack}
              />
            </TouchableOpacity>
          </View>
        )}
      </GestureHandlerRootView>
    </KeyboardAvoidingView>
  );
};

const registerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: 20,
    paddingTop: 30,
    borderTopLeftRadius: Sizes.xxlarge,
    borderTopRightRadius: Sizes.xxlarge,
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 300,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: Colors.background,
  },
  wrapper: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "regular",
    color: Colors.description,
    fontSize: FontSizes.small,
    marginTop: 10,
    marginBottom: 5,
    marginEnd: 5,
    textAlign: "right",
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: Colors.lightGray,
    overflow: "hidden",
  },
  input: {
    backgroundColor: Colors.white,
    color: Colors.dark,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  containerStyle: {
    marginHorizontal: 30,
  },
  textInputStyle: {
    height: 50,
    width: 50,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    borderBottomWidth: 1,
  },
  modalContainer: {
    flexDirection: "column",
    marginBottom: 10,
  },
  check: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
});

export default Register;
