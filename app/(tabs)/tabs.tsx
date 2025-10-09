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
    backgroundColor: Colors.tabBarBackground, 
    height: 80,
    paddingTop: 20,
    position: "absolute",
    borderRadius: 60,
    marginHorizontal: 40,
    marginBottom: 30,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabelStyle: {
    display: 'none',
  },
  activeTabContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveTabContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.tabBarInactiveBackground,
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
                    name="chef-hat"
                    color={Colors.white}
                    size={24}
                  />
                </LinearGradient>
              ) : (
                <MaterialCommunityIcons
                  name="chef-hat"
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
                    name="record-rec"
                    color={Colors.white}
                    size={24}
                  />
                </LinearGradient>
              ) : (
                <MaterialCommunityIcons
                  name="record-rec"
                  color={Colors.light}
                  size={24}
                />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
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
                    name="folder"
                    color={Colors.white}
                    size={24}
                  />
                </LinearGradient>
              ) : (
                <MaterialCommunityIcons
                  name="folder"
                  color={Colors.light}
                  size={24}
                />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
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
                    name="cog"
                    color={Colors.white}
                    size={24}
                  />
                </LinearGradient>
              ) : (
                <MaterialCommunityIcons
                  name="cog"
                  color={Colors.light}
                  size={24}
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