// components/GoogleSignInButton.tsx
import React from "react";
import {
  Pressable,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";

interface Props {
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle; // let callers tweak size/margins if they like
}

/**
 * A Google-brand “Sign in with Google” button.
 */
export default function GoogleSignInButton({
  onPress,
  disabled,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {/* full-colour Google “G” logo */}
      <Image
        source={require("@/assets/google/logo.png")} // 24×24 px PNG
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.label}>Sign in with Google</Text>
    </Pressable>
  );
}

/* ──────────────────────────────────  styles  ────────────────────────────────── */

interface Style {
  container: ViewStyle;
  pressed: ViewStyle;
  disabled: ViewStyle;
  logo: ImageStyle;
  label: TextStyle;
}

const styles = StyleSheet.create<Style>({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    height: 48,
    paddingHorizontal: 12,

    backgroundColor: "#fff",
    borderColor: "#dadce0",
    borderWidth: 1,
    borderRadius: 4,

    // Android elevation + iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },

  pressed: {
    opacity: 0.65,
  },

  disabled: {
    opacity: 0.35,
  },

  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },

  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#5f6368", // Google grey 700
  },
});
