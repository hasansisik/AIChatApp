import { View, TouchableOpacity, StyleSheet } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import OTPTextInput from "react-native-otp-textinput";
import Toast from "@/components/ui/Toast";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppBar from "@/components/ui/AppBar";
import { Colors } from "@/hooks/useThemeColor";
import { useTranslation } from "react-i18next";

import { FontSizes } from "@/constants/Fonts";
import { Sizes } from "@/constants/Sizes";
import HeightSpacer from "@/components/ui/HeightSpacer";
import ReusableText from "@/components/ui/ReusableText";
import ReusableButton from "@/components/ui/ReusableButton";
import { useDispatch } from "react-redux";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { againEmail, verifyEmail, loadUser } from "@/redux/actions/userActions";

const Verify: React.FC = () => {
  const dispatch = useDispatch();
  const { email } = useLocalSearchParams();
  const emailString = Array.isArray(email) ? email[0] : email;
  const router = useRouter();
  const { t } = useTranslation();

  const [verificationCode, setVerificationCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const submitHandler = async () => {
    setIsLoading(true);
    try {
      const actionResult = await dispatch(
        verifyEmail({ email: emailString, verificationCode }) as any
      );
      if (verifyEmail.fulfilled.match(actionResult)) {
        setStatus("success");
        setMessage(t("auth.verify.success"));
        // Verify email already returns user data, no need to call loadUser
        // Onboarding'e yönlendir
        setTimeout(() => {
          router.push({
            pathname: "/onboarding-demo",
          });
        }, 2000);
      } else if (verifyEmail.rejected.match(actionResult)) {
        setStatus("error");
        setMessage((actionResult.payload as string) || t("auth.verify.error"));
      }
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const resendHandler = () => {
    dispatch(againEmail({ email: emailString }) as any);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Toast ref={toastRef} />
        <View>
          {/* Header */}
          <View style={{ height: 80 }}>
            <AppBar
              top={20}
              left={0}
              right={20}
              color={Colors.light}
              onPress={() => router.back()}
            />
          </View>
          <HeightSpacer height={10} />
          {/* Text */}
          <View>
            <ReusableText
              text={t("auth.verify.title")}
              family={"bold"}
              size={FontSizes.xLarge}
              color={Colors.black}
            />
            <ReusableText
              text={t("auth.verify.description")}
              family={"regular"}
              size={FontSizes.small}
              color={Colors.description}
            />
          </View>
          <HeightSpacer height={50} />
          {/* OTP Input */}
          <OTPTextInput
            handleTextChange={setVerificationCode}
            inputCount={4}
            keyboardType="numeric"
            tintColor="#000000"
            offTintColor="#BBBCBE"
            textInputStyle={styles.textInputStyle}
            containerStyle={styles.containerStyle}
          />
          <HeightSpacer height={50} />
          {/* Login Button */}
          <ReusableButton
            btnText={isLoading ? t("auth.verify.verifying") : t("auth.verify.verifyButton")}
            width={Sizes.screenWidth - 40}
            height={55}
            borderRadius={Sizes.xxlarge}
            backgroundColor={Colors.purple}
            textColor={Colors.lightWhite}
            textFontFamily={"regular"}
            onPress={submitHandler}
            disable={isLoading}
          />
        </View>
        <View style={styles.footer}>
          <ReusableText
            text={t("auth.verify.noCode")}
            family={"regular"}
            size={FontSizes.small}
            color={Colors.description}
          />
          <TouchableOpacity onPress={resendHandler}>
            <ReusableText
              text={t("auth.verify.resend")}
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
    backgroundColor: Colors.white,
    justifyContent: 'space-between'
  },
  wrapper: {
    marginBottom: 20
  },
  label: {
    fontFamily: 'regular',
    color: Colors.description,
    fontSize: Sizes.small,
    marginTop: 10,
    marginBottom: 5,
    marginEnd: 5,
    textAlign: "right"
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: Colors.white,
    color: Colors.dark,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottomWidth: 1
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

export default Verify;