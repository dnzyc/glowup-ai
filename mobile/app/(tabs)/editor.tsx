import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/stores/appStore";
import { apiPost } from "@/lib/api";

type Region = "face" | "forehead" | "full_body" | "custom";

const REGION_LABELS: Record<Region, string> = {
  face: "Face",
  forehead: "Forehead",
  full_body: "Full Body",
  custom: "Custom",
};

export default function EditorScreen() {
  const { imageUri: paramUri } = useLocalSearchParams<{ imageUri?: string }>();
  const router = useRouter();
  const { params, setParams, presets, savePreset, deletePreset, loadPresets } = useAppStore();

  const [imageUri, setImageUri] = useState<string | null>(paramUri || null);
  const [selectedRegion, setSelectedRegion] = useState<Region>("face");
  const [processing, setProcessing] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [newPresetName, setNewPresetName] = useState("");
  const [showPresetManager, setShowPresetManager] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    if (paramUri && paramUri !== imageUri) {
      setImageUri(paramUri);
    }
  }, [paramUri]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
    }
  }

  async function handleProcess() {
    if (!imageUri) {
      Alert.alert("No Image", "Please select or capture an image first.");
      return;
    }

    setProcessing(true);
    setProgress(10);

    try {
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "photo.jpg";
      const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type: mimeType,
      } as any);

      formData.append("region", selectedRegion);
      formData.append("smoothing", String(params.smoothing));
      formData.append("brightening", String(params.brightening));
      formData.append("sharpening", String(params.sharpening));
      formData.append("blemish_removal", String(params.blemishRemoval));

      setProgress(30);

      const data = await apiPost("/process", formData);

      setProgress(80);

      const outputUrl = data.result_url || data.output_url;
      if (!outputUrl) throw new Error("No result URL in response");

      const apiUrl = useAppStore.getState().apiUrl;
      const downloadUri = outputUrl.startsWith("http") ? outputUrl : `${apiUrl}${outputUrl}`;

      const localUri = `${FileSystem.cacheDirectory}glowup_result_${Date.now()}.jpg`;
      await FileSystem.downloadAsync(downloadUri, localUri);

      setResultUri(localUri);
      setProgress(100);
    } catch (err: any) {
      Alert.alert("Processing Failed", err.message || "Unknown error occurred");
    } finally {
      setProcessing(false);
    }
  }

  async function handleShare() {
    if (!resultUri) return;
    try {
      await Share.share({
        message: "Check out my GlowUp AI retouched photo!",
        url: resultUri,
      });
    } catch {}
  }

  async function handleDownload() {
    if (!resultUri) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(resultUri);
    } else {
      Alert.alert("Success", `Image saved to: ${resultUri}`);
    }
  }

  function handlePresetSelect(name: string) {
    const preset = presets.find((p) => p.name === name);
    if (preset) {
      setParams(preset.params);
    }
  }

  function handleSavePreset() {
    const name = newPresetName.trim();
    if (!name) {
      Alert.alert("Error", "Enter a preset name.");
      return;
    }
    savePreset(name, { ...params });
    setNewPresetName("");
    Alert.alert("Saved", `Preset "${name}" saved.`);
  }

  function renderSlider(
    label: string,
    value: number,
    key: keyof typeof params,
    icon: string
  ) {
    return (
      <View style={styles.sliderGroup}>
        <View style={styles.sliderHeader}>
          <View style={styles.sliderLabelRow}>
            <Ionicons name={icon as any} size={16} color="#a855f7" />
            <Text style={styles.sliderLabel}>{label}</Text>
          </View>
          <Text style={styles.sliderValue}>{Math.round(value)}</Text>
        </View>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${value}%` }]} />
          <View
            style={[
              styles.sliderThumb,
              { left: `${Math.min(Math.max(value, 2), 98)}%` },
            ]}
          />
        </View>
        <View style={styles.sliderButtons}>
          {[0, 25, 50, 75, 100].map((v) => (
            <TouchableOpacity
              key={v}
              style={[
                styles.sliderPresetBtn,
                Math.abs(value - v) < 5 && styles.sliderPresetBtnActive,
              ]}
              onPress={() => setParams({ [key]: v })}
            >
              <Text
                style={[
                  styles.sliderPresetBtnText,
                  Math.abs(value - v) < 5 && styles.sliderPresetBtnTextActive,
                ]}
              >
                {v}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.screenTitle}>Editor</Text>

      {!imageUri ? (
        <View style={styles.emptyImage}>
          <Ionicons name="image" size={48} color="#3f3f46" />
          <Text style={styles.emptyImageText}>No image selected</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
            <Ionicons name="images" size={20} color="#a855f7" />
            <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      ) : resultUri ? (
        <View style={styles.resultSection}>
          <Text style={styles.sectionLabel}>Result</Text>
          <Image source={{ uri: resultUri }} style={styles.previewImage} />
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownload}>
              <Ionicons name="download" size={20} color="#a855f7" />
              <Text style={styles.secondaryBtnText}>Download</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => {
              setResultUri(null);
              setImageUri(null);
            }}
          >
            <Text style={styles.outlineBtnText}>Start New Edit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>Original</Text>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
              <Text style={styles.changePhotoBtnText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Region</Text>
          <View style={styles.regionRow}>
            {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.regionChip,
                  selectedRegion === r && styles.regionChipActive,
                ]}
                onPress={() => setSelectedRegion(r)}
              >
                <Text
                  style={[
                    styles.regionChipText,
                    selectedRegion === r && styles.regionChipTextActive,
                  ]}
                >
                  {REGION_LABELS[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Beauty Parameters</Text>

          {renderSlider("Smoothing", params.smoothing, "smoothing", "water")}
          {renderSlider("Brightening", params.brightening, "brightening", "sunny")}
          {renderSlider("Sharpening", params.sharpening, "sharpening", "sparkles")}
          {renderSlider(
            "Blemish Removal",
            params.blemishRemoval,
            "blemishRemoval",
            "brush"
          )}

          <View style={styles.presetsSection}>
            <View style={styles.presetsHeader}>
              <Text style={styles.sectionLabel}>Presets</Text>
              <TouchableOpacity
                onPress={() => setShowPresetManager(!showPresetManager)}
              >
                <Ionicons
                  name={showPresetManager ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#a1a1aa"
                />
              </TouchableOpacity>
            </View>

            {presets.length > 0 && (
              <View style={styles.presetsList}>
                {presets.map((p) => (
                  <View key={p.name} style={styles.presetRow}>
                    <TouchableOpacity
                      style={styles.presetNameBtn}
                      onPress={() => handlePresetSelect(p.name)}
                    >
                      <Ionicons name="bookmark" size={14} color="#a855f7" />
                      <Text style={styles.presetName}>{p.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deletePreset(p.name)}
                      style={styles.presetDeleteBtn}
                    >
                      <Ionicons name="trash" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {showPresetManager && (
              <View style={styles.presetManager}>
                <TextInput
                  style={styles.presetInput}
                  placeholder="Preset name..."
                  placeholderTextColor="#52525b"
                  value={newPresetName}
                  onChangeText={setNewPresetName}
                />
                <TouchableOpacity style={styles.smallPrimaryBtn} onPress={handleSavePreset}>
                  <Text style={styles.smallPrimaryBtnText}>Save Current</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.processBtn, processing && styles.processBtnDisabled]}
            onPress={handleProcess}
            disabled={processing}
          >
            {processing ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.processBtnText}>Processing... {progress}%</Text>
              </>
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={styles.processBtnText}>Process Image</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  content: { padding: 20, paddingBottom: 60 },
  screenTitle: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 20, paddingTop: 40 },

  emptyImage: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    backgroundColor: "#18181b",
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  emptyImageText: { color: "#71717a", fontSize: 14 },

  imageSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#a1a1aa", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  previewImage: { width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: "#18181b" },
  changePhotoBtn: { alignSelf: "center", marginTop: 8 },
  changePhotoBtnText: { color: "#a855f7", fontSize: 13, fontWeight: "500" },

  regionRow: { flexDirection: "row", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  regionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  regionChipActive: { backgroundColor: "#a855f7", borderColor: "#a855f7" },
  regionChipText: { color: "#71717a", fontSize: 13, fontWeight: "500" },
  regionChipTextActive: { color: "#fff" },

  sliderGroup: { marginBottom: 20 },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sliderLabel: { color: "#e4e4e7", fontSize: 14, fontWeight: "600" },
  sliderValue: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "700",
    backgroundColor: "#18181b",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sliderTrack: {
    height: 24,
    backgroundColor: "#27272a",
    borderRadius: 12,
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#a855f7",
    borderRadius: 12,
    opacity: 0.3,
  },
  sliderThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#a855f7",
    borderWidth: 2,
    borderColor: "#fff",
    transform: [{ translateX: -10 }],
  },
  sliderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sliderPresetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sliderPresetBtnActive: { backgroundColor: "#27272a" },
  sliderPresetBtnText: { color: "#52525b", fontSize: 11, fontWeight: "500" },
  sliderPresetBtnTextActive: { color: "#a855f7" },

  presetsSection: { marginBottom: 24 },
  presetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  presetsList: { marginBottom: 12 },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#18181b",
    borderRadius: 8,
    marginTop: 6,
  },
  presetNameBtn: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  presetName: { color: "#e4e4e7", fontSize: 14 },
  presetDeleteBtn: { padding: 4 },
  presetManager: { flexDirection: "row", gap: 8, marginTop: 8 },
  presetInput: {
    flex: 1,
    backgroundColor: "#18181b",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272a",
    fontSize: 14,
  },
  smallPrimaryBtn: {
    backgroundColor: "#a855f7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  smallPrimaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  processBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a855f7",
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  processBtnDisabled: { opacity: 0.6 },
  processBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  resultSection: { alignItems: "center" },
  resultActions: { flexDirection: "row", gap: 12, marginTop: 16, marginBottom: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a855f7",
    padding: 14,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#a855f7",
    padding: 14,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  secondaryBtnText: { color: "#a855f7", fontSize: 15, fontWeight: "600" },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#3f3f46",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  outlineBtnText: { color: "#71717a", fontSize: 14 },
});
