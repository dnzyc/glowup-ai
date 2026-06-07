import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function CameraScreen() {
  const [perm, reqPerm] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  if (!perm) return <View style={styles.container}><ActivityIndicator color="#a855f7" /></View>;
  if (!perm.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access needed</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={reqPerm}>
          <Text style={styles.primaryBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePhoto() {
    if (!cameraRef.current) return;
    const result = await cameraRef.current.takePictureAsync({ quality: 1, base64: false });
    setPhoto(result.uri);
  }

  function usePhoto() {
    if (photo) {
      router.push({ pathname: "/editor", params: { imageUri: photo } });
    }
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={{ flex: 1 }} />
        <View style={styles.previewBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setPhoto(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={usePhoto}>
            <Text style={styles.primaryBtnText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setFacing(f => f === "front" ? "back" : "front")}>
            <Ionicons name="camera-reverse" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>
      <View style={styles.captureBar}>
        <TouchableOpacity onPress={takePhoto} style={styles.captureBtn}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  permissionText: { color: "#fff", fontSize: 16, textAlign: "center", marginBottom: 16 },
  cameraOverlay: { flex: 1, justifyContent: "flex-end", alignItems: "flex-end", padding: 20 },
  captureBar: { height: 120, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
  previewBar: { position: "absolute", bottom: 40, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  primaryBtn: { backgroundColor: "#a855f7", padding: 14, borderRadius: 12, paddingHorizontal: 24 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
