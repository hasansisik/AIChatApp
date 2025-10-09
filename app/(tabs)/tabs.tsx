import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/hooks/useThemeColor";
import { StyleSheet, Image, View, Text } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Home from "@/app/(tabs)/home";
import Profile from "./profile";

const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: Colors.lightInput, 
    height: 70,
    paddingTop: 15,
    position: "absolute",
    borderRadius: 60,
    marginHorizontal: 100,
    marginBottom: 30,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabelStyle: {
    display: 'none',
  },
  activeTabContainer: {
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveTabContainer: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.tabBarInactiveBackground,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  profileImageInactive: {
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.7,
  },
});

const TabNavigation = () => {
  return (
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
                  color={Colors.light}
                  size={24}
                />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
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
                    name="view-grid"
                    color={Colors.white}
                    size={24}
                  />
                </LinearGradient>
              ) : (
                <MaterialCommunityIcons
                  name="view-grid-outline"
                  color={Colors.light}
                  size={24}
                />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
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
                  <Image
                    source={{ uri: 'https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGVyc29ufGVufDB8fDB8fHww' }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                </LinearGradient>
              ) : (
                <Image
                  source={{ uri: 'https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGVyc29ufGVufDB8fDB8fHww' }}
                  style={styles.profileImageInactive}
                  resizeMode="cover"
                />
              )}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigation;