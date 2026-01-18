import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import LoginScreen from "@/screens/LoginScreen";
import HomeScreen from "@/screens/HomeScreen";
import ContentPlayerScreen from "@/screens/ContentPlayerScreen";
import { ContentItem } from "@/lib/content";

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ContentPlayer: { item: ContentItem };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="ContentPlayer"
            component={ContentPlayerScreen}
            options={{
              animation: "slide_from_right",
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            animationTypeForReplace: "pop",
          }}
        />
      )}
    </Stack.Navigator>
  );
}
