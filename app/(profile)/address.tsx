import { View, ScrollView, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
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
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

// List of provinces in Turkey (İller)
const turkishProvinces = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
  "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye",
  "Düzce"
];

// Example user data for testing
const exampleUser = {
  address: {
    street: "Örnek Mahallesi, Örnek Sokak No:1",
    city: "Kadıköy", // district
    state: "İstanbul", // province
    postalCode: "34710",
    country: "Turkey"
  }
};

const AddressPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState(exampleUser);
  const [loading, setLoading] = useState(false);
  const [showProvincePicker, setShowProvincePicker] = useState(false);

  // Initialize form with existing address data
  useEffect(() => {
    if (user && user.address) {
      formik.setValues({
        street: user.address.street || "",
        district: user.address.city || "", // city in backend is actually district (ilçe)
        province: user.address.state || "", // state in backend is actually province (il)
        postalCode: user.address.postalCode || "",
      });
    }
  }, [user]);

  interface AddressFormValues {
    street: string;
    district: string;
    province: string;
    postalCode: string;
  }

  const validationSchema = Yup.object({
    street: Yup.string().required(t("validation.streetRequired")),
    district: Yup.string().required(t("validation.districtRequired")),
    province: Yup.string().required(t("validation.provinceRequired")),
    postalCode: Yup.string(),
  });

  const submitHandler = async (values: AddressFormValues): Promise<void> => {
    setLoading(true);
    try {
      // Simulate successful update
      setUser(prev => ({
        ...prev,
        address: {
          street: values.street,
          city: values.district, // Backend expects district in city field
          state: values.province, // Backend expects province in state field
          postalCode: values.postalCode || "",
          country: "Turkey" // Default value
        }
      }));

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik<AddressFormValues>({
    initialValues: {
      street: "",
      district: "",
      province: "",
      postalCode: "",
    },
    validationSchema,
    onSubmit: submitHandler,
    validateOnChange: true,
    validateOnBlur: true,
  });

  const handleProvinceSelect = (province: string) => {
    formik.setFieldValue("province", province);
    setShowProvincePicker(false);
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
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingBottom: 20 }}>
            <ReusableText
              text={t("profile.address.title")}
              family={"bold"}
              size={FontSizes.large}
              color={Colors.black}
            />
              <ReusableText
              text={t("profile.address.description")}
              family={"regular"}
              size={FontSizes.small}
              color={Colors.description}
            />
          </View>
          <ReusableInput
            label={t("profile.address.street")}
            value={formik.values.street}
            onChangeText={formik.handleChange("street")}
            touched={formik.touched.street}
            error={formik.errors.street}
            labelColor={Colors.black}
          />
          <ReusableInput
            label={t("profile.address.district")}
            value={formik.values.district}
            onChangeText={formik.handleChange("district")}
            touched={formik.touched.district}
            error={formik.errors.district}
            labelColor={Colors.black}
          />
          <ReusableInput
            label={t("profile.address.postalCode")}
            value={formik.values.postalCode}
            onChangeText={formik.handleChange("postalCode")}
            touched={formik.touched.postalCode}
            error={formik.errors.postalCode}
            labelColor={Colors.black}
          />
          
          {/* Province (İl) Selector */}
          <View style={styles.inputLabelContainer}>
            <ReusableText
              text={t("profile.address.province")}
              family={"regular"}
              size={FontSizes.small}
              color={Colors.black}
            />
          </View>
          <TouchableOpacity 
            style={styles.dropdownSelector}
            onPress={() => setShowProvincePicker(true)}
          >
            <ReusableText
              text={formik.values.province || t("profile.address.selectProvince")}
              family={"regular"}
              size={FontSizes.small}
              color={formik.values.province ? Colors.black : Colors.gray}
            />
            <Ionicons name="chevron-down" size={20} color={Colors.gray} />
          </TouchableOpacity>
          {formik.touched.province && formik.errors.province && (
            <ReusableText
              text={formik.errors.province}
              family={"regular"}
              size={FontSizes.xSmall}
              color={Colors.error}
            />
          )}
          
          {/* Province Picker Modal */}
          <Modal
            visible={showProvincePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowProvincePicker(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ReusableText
                    text={t("profile.address.selectProvince")}
                    family={"bold"}
                    size={FontSizes.medium}
                    color={Colors.black}
                  />
                  <TouchableOpacity onPress={() => setShowProvincePicker(false)}>
                    <Ionicons name="close" size={24} color={Colors.black} />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={turkishProvinces}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.cityItem}
                      onPress={() => handleProvinceSelect(item)}
                    >
                      <ReusableText
                        text={item}
                        family={"regular"}
                        size={FontSizes.small}
                        color={Colors.black}
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
          
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
  inputLabelContainer: {
    marginTop: 15,
    marginBottom: 5,
  },
  dropdownSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.white,
    width: "90%",
    maxHeight: "70%",
    borderRadius: 15,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  cityItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  btnContainer: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: "center",
  },
});

export default AddressPage;
