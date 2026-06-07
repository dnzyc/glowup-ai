import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    await AsyncStorage.setItem("glowup_session", JSON.stringify({ email: email.trim() }));
    Alert.alert("Welcome", "Signed in successfully.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Ionicons name="sparkles" size={48} color="#a855f7" style={{ alignSelf: "center", marginBottom: 24 }} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#52525b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#52525b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b", justifyContent: "center", padding: 20 },
  form: { backgroundColor: "#18181b", borderRadius: 16, padding: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#71717a", textAlign: "center", marginTop: 4, marginBottom: 24 },
  input: {
    backgroundColor: "#27272a",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  loginBtn: {
    backgroundColor: "#a855f7",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
