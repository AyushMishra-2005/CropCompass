import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: "#ffffff",
        },
      }}
    >
      {/* Login Screen */}
      <Stack.Screen
        name="Login"
        options={{
          title: "Login",
        }}
      />

      {/* Sign Up Screen */}
      <Stack.Screen
        name="SignUp"
        options={{
          title: "Sign Up",
        }}
      />
    </Stack>
  );
}
