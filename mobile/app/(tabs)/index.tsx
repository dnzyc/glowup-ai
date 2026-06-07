import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>GlowUp AI</Text>
      <Text style={styles.subtitle}>Professional Beauty Retouching{'\n'}Powered by OpenCV • Zero AI Cost</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/camera")}>
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.primaryBtnText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/editor")}>
          <Ionicons name="images" size={24} color="#a855f7" />
          <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Features</Text>
      {[
        { icon: "cut", title: "Region Selection", desc: "Face, forehead, arms — choose where to apply" },
        { icon: "speedometer", title: "Gradeable Beauty", desc: "Flame/Nuke-level smoothing, sharpening" },
        { icon: "videocam", title: "Video Support", desc: "MP4 + ProRes 422/4444 import & export" },
        { icon: "flash", title: "Live Preview", desc: "Real-time canvas preview while adjusting" },
        { icon: "save", title: "Custom Presets", desc: "Save and reuse your beauty settings" },
        { icon: "share-social", title: "Social Sharing", desc: "Share results directly to Instagram, Twitter" },
      ].map((f, i) => (
        <View key={i} style={styles.featureRow}>
          <Ionicons name={f.icon as any} size={20} color="#a855f7" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 36, fontWeight: "800", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#a1a1aa", textAlign: "center", marginTop: 8, marginBottom: 32, lineHeight: 20 },
  actions: { gap: 12, marginBottom: 40 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#a855f7", padding: 16, borderRadius: 12, gap: 8 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#a855f7", padding: 16, borderRadius: 12, gap: 8 },
  secondaryBtnText: { color: "#a855f7", fontSize: 16, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  featureTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  featureDesc: { color: "#71717a", fontSize: 12, marginTop: 2 },
});
