import { useAppStore } from "@/stores/appStore";

export async function apiPost(path: string, formData: FormData) {
  const apiUrl = useAppStore.getState().apiUrl;
  const res = await fetch(`${apiUrl}/api${path}`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiGet(path: string) {
  const apiUrl = useAppStore.getState().apiUrl;
  const res = await fetch(`${apiUrl}/api${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
