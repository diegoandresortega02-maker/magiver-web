import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}));
vi.mock("@/lib/config", () => ({
  config: { MAPS_API_KEY: "web-key", MAPS_API_KEY_ANDROID: "android-key" },
}));

describe("getMapsApiKey", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns the web key when not running as a native app", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    const { getMapsApiKey } = await import("./googleMaps");
    expect(getMapsApiKey()).toBe("web-key");
  });

  it("returns the Android key when running as a native app", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const { getMapsApiKey } = await import("./googleMaps");
    expect(getMapsApiKey()).toBe("android-key");
  });
});
