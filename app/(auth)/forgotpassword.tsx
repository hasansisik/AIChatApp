import {
  Text,
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
import { useRouter } from "expo-router";
import Toast from "@/components/ui/Toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { forgotPassword } from "@/redux/actions/userActions";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
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
    initialValues: { email: "" },
    onSubmit: async (values) => {
      const actionResult = await dispatch(forgotPassword(values.email) as any);
      if (forgotPassword.fulfilled.match(actionResult)) {
        router.push({
          pathname: "/(auth)/resetpassword",
          params: { email: values.email },
        });
        setStatus("success");
        setMessage(t("auth.forgotPassword.success"));
      } else if (forgotPassword.rejected.match(actionResult)) {
        setStatus("error");
        setMessage(actionResult.payload as string || t("auth.forgotPassword.error"));
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
            color={Colors.lightWhite}
            onPress={() => router.back()}
          />
          <HeightSpacer height={15} />
          <ReusableText
            text={t("auth.forgotPassword.title")}
            family={"bold"}
            size={FontSizes.xLarge}
            color={Colors.black}
          />
          <ReusableText
            text={t("auth.forgotPassword.description")}
            family={"regular"}
            size={FontSizes.small}
            color={Colors.description}
          />
          <HeightSpacer height={20} />
          <ReusableInput
            label={t("auth.forgotPassword.email")}
            labelColor={Colors.black}
            value={formik.values.email}
            onChangeText={formik.handleChange("email")}
            touched={formik.touched.email}
            error={formik.errors.email}
          />
          <HeightSpacer height={20} />
          <ReusableButton
            btnText={t("auth.forgotPassword.sendButton")}
            width={Sizes.screenWidth - 40}
            height={55}
            borderRadius={Sizes.xxlarge}
            backgroundColor={Colors.purple}
            textColor={Colors.lightWhite}
            textFontFamily={"regular"}
            onPress={formik.handleSubmit}
          />
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
});

export default ForgotPassword;