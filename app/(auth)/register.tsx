import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
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
import { register } from "@/redux/actions/userActions";
import { Colors } from "@/hooks/useThemeColor";
import { useTranslation } from "react-i18next";

const Register = () => {
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
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
      complianceModal: false,
    },
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
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
          <ReusableText
            text={t("auth.register.title")}
            family={"bold"}
            size={FontSizes.xLarge}
            color={Colors.black}
          />
          <HeightSpacer height={15} />
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
          />
          <ReusableInput
            label={t("auth.register.confirmPassword")}
            secureTextEntry={true}
            labelColor={Colors.black}
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange("confirmPassword")}
            touched={formik.touched.confirmPassword}
            error={formik.errors.confirmPassword}
          />
          <ReusableButton
            btnText={t("auth.register.registerButton")}
            width={Sizes.screenWidth - 40}
            height={45}
            borderRadius={Sizes.small}
            backgroundColor={Colors.lightBlack}
            textColor={Colors.lightWhite}
            textFontFamily={"regular"}
            onPress={formik.handleSubmit}
          />
        </View>
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
