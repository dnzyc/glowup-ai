import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet } from "@/lib/api";

interface Job {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  thumbnail_url?: string;
  original_filename?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  processing: "#3b82f6",
  completed: "#22c55e",
  failed: "#ef4444",
};

export default function DashboardScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await apiGet("/jobs");
      setJobs(data.jobs || data || []);
    } catch {
      setJobs([]);
    }
  }, []);

  useEffect(() => {
    fetchJobs().finally(() => setLoading(false));
  }, [fetchJobs]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }

  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  function renderJob({ item }: { item: Job }) {
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => {
          router.push({
            pathname: "/editor",
            params: { imageUri: item.thumbnail_url || "" },
          });
        }}
      >
        <View style={styles.jobThumbnail}>
          {item.thumbnail_url ? (
            <Image
              source={{ uri: item.thumbnail_url }}
              style={styles.jobThumbnailImage}
            />
          ) : (
            <Ionicons name="image" size={28} color="#3f3f46" />
          )}
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobFilename} numberOfLines={1}>
            {item.original_filename || `Job ${item.id.slice(0, 8)}`}
          </Text>
          <Text style={styles.jobDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${STATUS_COLORS[item.status]}20` },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: STATUS_COLORS[item.status] || "#71717a" },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS[item.status] || "#71717a" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>History</Text>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a855f7"
            colors={["#a855f7"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="time" size={48} color="#3f3f46" />
            <Text style={styles.emptyTitle}>No jobs yet</Text>
            <Text style={styles.emptySubtitle}>
              Processed images will appear here
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/editor")}
            >
              <Text style={styles.emptyBtnText}>Start Editing</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: { flex: 1, backgroundColor: "#09090b", justifyContent: "center", alignItems: "center" },
  screenTitle: { fontSize: 28, fontWeight: "800", color: "#fff", paddingHorizontal: 20, paddingTop: 40, paddingBottom: 16 },

  list: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyContainer: { flex: 1 },

  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  jobThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  jobThumbnailImage: { width: "100%", height: "100%" },
  jobInfo: { flex: 1 },
  jobFilename: { color: "#e4e4e7", fontSize: 14, fontWeight: "600" },
  jobDate: { color: "#71717a", fontSize: 12, marginTop: 2 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { color: "#e4e4e7", fontSize: 18, fontWeight: "700", marginTop: 16 },
  emptySubtitle: { color: "#71717a", fontSize: 13, marginTop: 4 },
  emptyBtn: { marginTop: 20, backgroundColor: "#a855f7", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
