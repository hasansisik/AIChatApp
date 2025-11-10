import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, useTheme } from "@/hooks/useThemeColor";
import { StyleSheet, Image, View, Text, Modal, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import Home from "@/app/(tabs)/home";
import List from "@/app/(tabs)/list";
import Profile from "./profile";
import Edu from "@/app/(tabs)/edu";
import { updateCourseCode } from "@/redux/actions/eduActions";
import { loadUser } from "@/redux/actions/userActions";
import ReusableText from "@/components/ui/ReusableText";
import { FontSizes } from "@/constants/Fonts";
import ChatBot from "@/components/ChatBot/ChatBot";

const Tab = createBottomTabNavigator();

// Boş bir component - Chat tab'ı için
const ChatPlaceholder = () => {
  return null;
};

const TabNavigation = () => {
  const { isDark } = useTheme();
  const { user } = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatBotVisible, setChatBotVisible] = useState(false);
  
  useEffect(() => {
    // Check if user has courseCode when Edu tab is accessed
    // This will be handled in the Edu component itself
  }, [user]);

  const handleCodeSubmit = async () => {
    if (!courseCode.trim()) {
      Alert.alert("Hata", "Lütfen kurs kodunu girin");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch<any>(updateCourseCode(courseCode.trim().toUpperCase()));
      if (updateCourseCode.fulfilled.match(result)) {
        await dispatch<any>(loadUser());
        setCodeModalVisible(false);
        setCourseCode("");
        Alert.alert("Başarılı", "Kurs kodu başarıyla güncellendi");
      } else {
        Alert.alert("Hata", result.payload || "Kod güncellenemedi");
      }
    } catch (error) {
      Alert.alert("Hata", "Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const styles = StyleSheet.create({
    tabBarStyle: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.6)', 
      height: 70,
      paddingTop: 15,
      position: "absolute",
      borderRadius: 60,
      marginHorizontal: 60,
      marginBottom: 30,
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabBarLabelStyle: {
      display: 'none',
    },
    activeTabContainer: {
      width: 65,
      height: 65,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inactiveTabContainer: {
      width: 60,
      height: 60,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.tabBarBackground,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 35,
    },
    profileImageInactive: {
      width: 60,
      height: 60,
      borderRadius: 35,
      opacity: 0.7,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: Colors.white,
      borderRadius: 20,
      padding: 24,
      width: "85%",
      maxWidth: 400,
      gap: 20,
    },
    codeInput: {
      borderWidth: 1,
      borderColor: Colors.lightGray,
      borderRadius: 12,
      padding: 16,
      fontSize: FontSizes.medium,
      color: Colors.black,
      backgroundColor: Colors.background,
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      justifyContent: "flex-end",
    },
    modalButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      minWidth: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButton: {
      backgroundColor: Colors.backgroundBox,
    },
    submitButton: {
      backgroundColor: Colors.primary,
    },
  });
  return (
    <>
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarStyle: styles.tabBarStyle, 
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.light,
        tabBarInactiveTintColor: Colors.light,
        tabBarLabelStyle: styles.tabBarLabelStyle,
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}  
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.inactiveTabContainer}>
              {focused ? (
                <LinearGradient
                  colors={[Colors.tabBarGradientStart, Colors.tabBarGradientEnd]}
                  style={styles.activeTabContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="home-variant"
                    color={Colors.white}
                    size={24}
                  />
                </LinearGradient>
              ) : (
                <MaterialCommunityIcons
                  name="home-variant-outline"
                  color={Colors.black}
                  size={24}
                />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="List"
        component={List}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.inactiveTabContainer}>
              {focused ? (
                <LinearGradient
                  colors={[Colors.tabBarGradientStart, Colors.tabBarGradientEnd]}
                  style={styles.activeTabContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="view-list"
                    color={Colors.white}
                    size={24}
                  />
                </LinearGradient>
              ) : (
                <MaterialCommunityIcons
                  name="view-list-outline"
                  color={Colors.black}
                  size={24}
                />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Edu"
        component={Edu}
        listeners={{
          tabPress: (e) => {
            if (!user?.courseCode) {
              e.preventDefault();
              setCodeModalVisible(true);
            }
          },
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.inactiveTabContainer}>
              {focused ? (
                <LinearGradient
                  colors={[Colors.tabBarGradientStart, Colors.tabBarGradientEnd]}
                  style={styles.activeTabContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="school"
                    color={Colors.white}
                    size={24}
                  />
                </LinearGradient>
              ) : (
                <MaterialCommunityIcons
                  name="school-outline"
                  color={Colors.black}
                  size={24}
                />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatPlaceholder}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/example');
          },
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.inactiveTabContainer}>
              {focused ? (
                <LinearGradient
                  colors={[Colors.tabBarGradientStart, Colors.tabBarGradientEnd]}
                  style={styles.activeTabContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="message-text"
                    color={Colors.white}
                    size={24}
                  />
                </LinearGradient>
              ) : (
                <MaterialCommunityIcons
                  name="message-text-outline"
                  color={Colors.black}
                  size={24}
                />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.inactiveTabContainer}>
              {focused ? (
                <LinearGradient
                  colors={[Colors.tabBarGradientStart, Colors.tabBarGradientEnd]}
                  style={styles.activeTabContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Image
                    source={
                      user?.profile?.picture
                        ? { uri: user.profile.picture }
                        : require("@/assets/images/person.png")
                    }
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                </LinearGradient>
              ) : (
                <Image
                  source={
                    user?.profile?.picture
                      ? { uri: user.profile.picture }
                      : require("@/assets/images/person.png")
                  }
                  style={styles.profileImageInactive}
                  resizeMode="cover"
                />
              )}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
    {codeModalVisible && (
      <Modal
        visible={codeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ReusableText
              text="Kurs Kodu Girin"
              family="bold"
              size={FontSizes.large}
              color={Colors.black}
            />
            <TextInput
              style={styles.codeInput}
              placeholder="Kurs kodunu girin (örn: KMY43465)"
              placeholderTextColor={Colors.lightGray}
              value={courseCode}
              onChangeText={setCourseCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setCodeModalVisible(false);
                  setCourseCode("");
                }}
              >
                <ReusableText
                  text="İptal"
                  family="medium"
                  size={FontSizes.small}
                  color={Colors.black}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleCodeSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <ReusableText
                    text="Kaydet"
                    family="medium"
                    size={FontSizes.small}
                    color={Colors.white}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )}
    {/* Chat Bot Modal */}
    <ChatBot
      visible={chatBotVisible}
      onClose={() => setChatBotVisible(false)}
    />
    </>
  );
};

export default TabNavigation;