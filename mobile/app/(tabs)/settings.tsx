import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/stores/appStore";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const { apiUrl, setApiUrl } = useAppStore();
  const [urlInput, setUrlInput] = useState(apiUrl);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setUrlInput(apiUrl);
  }, [apiUrl]);

  function handleSaveUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setApiUrl(trimmed);
    Alert.alert("Saved", "API URL updated.");
  }

  async function handleClearCache() {
    try {
      await AsyncStorage.clear();
      Alert.alert("Cleared", "Local cache has been cleared.");
    } catch {
      Alert.alert("Error", "Failed to clear cache.");
    }
  }

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("glowup_session");
          Alert.alert("Signed Out");
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.screenTitle}>Settings</Text>

      <Text style={styles.sectionLabel}>API Configuration</Text>
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Backend URL</Text>
        <View style={styles.urlRow}>
          <TextInput
            style={styles.urlInput}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="http://localhost:8000"
            placeholderTextColor="#52525b"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.connectionStatus}>
          <View style={styles.dot} />
          <Text style={styles.connectionText}>
            {apiUrl ? `Connected to ${apiUrl}` : "Not configured"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Appearance</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon" size={18} color="#a855f7" />
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#3f3f46", true: "#a855f7" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Data</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.settingRow} onPress={handleClearCache}>
          <View style={styles.settingInfo}>
            <Ionicons name="trash" size={18} color="#ef4444" />
            <Text style={styles.settingLabel}>Clear Cache</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#52525b" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>About</Text>
      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutKey}>App</Text>
          <Text style={styles.aboutValue}>GlowUp AI</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutKey}>Version</Text>
          <Text style={styles.aboutValue}>{Constants.expoConfig?.version || "1.0.0"}</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutKey}>SDK</Text>
          <Text style={styles.aboutValue}>Expo 52</Text>
        </View>
        <View style={styles.aboutDivider} />
        <Text style={styles.aboutTitle}>Features</Text>
        {[
          "AI-powered skin smoothing",
          "Brightening and tone correction",
          "Sharpening for detail enhancement",
          "Blemish and spot removal",
          "Region-specific editing",
          "Video ProRes support",
          "Custom presets and batch processing",
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out" size={18} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>GlowUp AI • Built with Expo</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  content: { padding: 20, paddingBottom: 60 },
  screenTitle: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 24, paddingTop: 40 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#71717a",
    marginBottom: 8,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  card: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  fieldLabel: { color: "#a1a1aa", fontSize: 12, marginBottom: 8 },
  urlRow: { flexDirection: "row", gap: 8 },
  urlInput: {
    flex: 1,
    backgroundColor: "#27272a",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#a855f7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  connectionStatus: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  connectionText: { color: "#52525b", fontSize: 12 },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  settingInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingLabel: { color: "#e4e4e7", fontSize: 15 },

  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  aboutKey: { color: "#71717a", fontSize: 14 },
  aboutValue: { color: "#e4e4e7", fontSize: 14, fontWeight: "500" },
  aboutDivider: { height: 1, backgroundColor: "#27272a", marginVertical: 12 },
  aboutTitle: { color: "#e4e4e7", fontSize: 14, fontWeight: "600", marginBottom: 8 },

  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  featureText: { color: "#a1a1aa", fontSize: 13 },

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#3f3f46",
    borderRadius: 12,
  },
  signOutText: { color: "#ef4444", fontSize: 15, fontWeight: "600" },

  footer: {
    color: "#3f3f46",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
});
