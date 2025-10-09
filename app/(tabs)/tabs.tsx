import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/hooks/useThemeColor";
import { StyleSheet, Image } from "react-native";
import Home from "@/app/(tabs)/home";
import Profile from "./profile";

const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: Colors.background, 
    paddingTop: 10,
    height: 85,
    position: "absolute",
  },
  tabBarLabelStyle: {
    marginTop: 3,
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
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.black,
        tabBarLabelStyle: styles.tabBarLabelStyle,
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}  
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={Colors.black}
              size={focused ? 28 : 24}
            />
          ),
          tabBarLabel: 'Ana Sayfa',
        }}
      />
      <Tab.Screen
        name="Search"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              color={Colors.black}
              size={focused ? 28 : 24}
            />
          ),
          tabBarLabel: 'Arama',
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              color={Colors.black}
              size={focused ? 28 : 24}
            />
          ),
          tabBarLabel: 'Favoriler',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              color={Colors.black}
              size={focused ? 28 : 24}
            />
          ),
          tabBarLabel: 'Bildirimler',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={Colors.black}
              size={focused ? 28 : 24}
            />
          ),
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigation;