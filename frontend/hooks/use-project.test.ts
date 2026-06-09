import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./use-project";
import { defaultFrontendParams } from "@/lib/beauty-params-adapter";

const mockPush = vi.fn();
const mockGetUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

global.fetch = vi.fn();

const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
const mockVideoFile = new File(["test"], "test.mp4", { type: "video/mp4" });

describe("useProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    (global.fetch as any).mockResolvedValue({ ok: true, json: () => Promise.resolve({ job_id: "job123" }) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useProject());

    expect(result.current.file).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.processing).toBe(false);
    expect(result.current.regions).toEqual([]);
    expect(result.current.params).toEqual(defaultFrontendParams());
    expect(result.current.autoDetect).toBe(true);
    expect(result.current.livePreviewEnabled).toBe(false);
    expect(result.current.regionContainerSize).toEqual({ w: 0, h: 0 });
    expect(result.current.outputFormat).toBe("mp4");
    expect(result.current.userId).toBe("");
    expect(result.current.isVideo).toBe(false);
  });

  it("setFile updates file and isVideo reflects file type", () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setFile(mockFile);
    });

    expect(result.current.file).toBe(mockFile);
    expect(result.current.isVideo).toBe(false);
  });

  it("setFile with video sets isVideo to true", () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setFile(mockVideoFile);
    });

    expect(result.current.file).toBe(mockVideoFile);
    expect(result.current.isVideo).toBe(true);
  });

  it("setPreviewUrl updates previewUrl", () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setPreviewUrl("blob:test-url");
    });

    expect(result.current.previewUrl).toBe("blob:test-url");
  });

  it("setParams updates params", () => {
    const { result } = renderHook(() => useProject());
    const newParams = { ...defaultFrontendParams(), smoothing: 80 };

    act(() => {
      result.current.setParams(newParams);
    });

    expect(result.current.params.smoothing).toBe(80);
  });

  it("setRegions updates regions", () => {
    const { result } = renderHook(() => useProject());
    const newRegions = [{ id: "1", name: "face", label: "Face", x: 0, y: 0, width: 100, height: 100 }];

    act(() => {
      result.current.setRegions(newRegions);
    });

    expect(result.current.regions).toEqual(newRegions);
  });

  it("setOutputFormat updates outputFormat", () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setOutputFormat("mov");
    });

    expect(result.current.outputFormat).toBe("mov");
  });

  it("processMedia calls API with correct params for image", async () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setFile(mockFile);
      result.current.setPreviewUrl("blob:test");
      result.current.setParams({ ...defaultFrontendParams(), smoothing: 75 });
    });

    await act(async () => {
      await result.current.processMedia();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL}/api/process`,
      expect.objectContaining({ method: "POST" })
    );

    const call = (global.fetch as any).mock.calls[0];
    const formData = call[1].body as FormData;
    expect(formData.get("file")).toBe(mockFile);
    expect(formData.get("media_type")).toBe("photo");
    expect(formData.get("smoothing")).toBe("75");
    expect(formData.get("user_id")).toBe("anonymous");
  });

  it("processMedia calls API with video params when file is video", async () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setFile(mockVideoFile);
      result.current.setOutputFormat("prores");
    });

    await act(async () => {
      await result.current.processMedia();
    });

    const call = (global.fetch as any).mock.calls[0];
    const formData = call[1].body as FormData;
    expect(formData.get("media_type")).toBe("video");
    expect(formData.get("output_format")).toBe("prores");
  });

  it("processMedia navigates to dashboard on success", async () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setFile(mockFile);
    });

    await act(async () => {
      await result.current.processMedia();
    });

    expect(mockPush).toHaveBeenCalledWith("/dashboard?job=job123");
  });

  it("processMedia shows alert on API error", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: "Server error" }),
    });

    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setFile(mockFile);
    });

    await act(async () => {
      await result.current.processMedia();
    });

    expect(alertSpy).toHaveBeenCalledWith("Error (500): Server error");
    alertSpy.mockRestore();
  });

  it("processMedia shows alert on connection error", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    (global.fetch as any).mockRejectedValue(new Error("Network failed"));

    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setFile(mockFile);
    });

    await act(async () => {
      await result.current.processMedia();
    });

    expect(alertSpy).toHaveBeenCalledWith("Connection error: Network failed");
    alertSpy.mockRestore();
  });

  it("processMedia does nothing when no file", async () => {
    const { result } = renderHook(() => useProject());

    await act(async () => {
      await result.current.processMedia();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reset clears all state to defaults", () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setFile(mockFile);
      result.current.setPreviewUrl("blob:test");
      result.current.setRegions([{ id: "1", name: "face", label: "Face", x: 0, y: 0, width: 100, height: 100 }]);
      result.current.setParams({ ...defaultFrontendParams(), smoothing: 90 });
      result.current.setAutoDetect(false);
      result.current.setLivePreviewEnabled(true);
      result.current.setRegionContainerSize({ w: 500, h: 400 });
      result.current.setOutputFormat("mov");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.file).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.regions).toEqual([]);
    expect(result.current.params).toEqual(defaultFrontendParams());
    expect(result.current.autoDetect).toBe(true);
    expect(result.current.livePreviewEnabled).toBe(false);
    expect(result.current.regionContainerSize).toEqual({ w: 0, h: 0 });
    expect(result.current.outputFormat).toBe("mp4");
  });

  it("sets userId when user is authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-abc-123" } } });

    const { result } = renderHook(() => useProject());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.userId).toBe("user-abc-123");
  });
});
