import { describe, expect, it } from "vitest";
import { getSupportedMimeType } from "@/lib/audio/mimeType";

describe("getSupportedMimeType", () => {
  it("prefers webm/opus when supported (Chrome Android)", () => {
    const isSupported = (mimeType: string) => mimeType === "audio/webm;codecs=opus";
    expect(getSupportedMimeType(isSupported)).toBe("audio/webm;codecs=opus");
  });

  it("falls through to mp4 when webm is unsupported (iOS Safari)", () => {
    const isSupported = (mimeType: string) => mimeType === "audio/mp4";
    expect(getSupportedMimeType(isSupported)).toBe("audio/mp4");
  });

  it("returns null when nothing in the priority list is supported", () => {
    const isSupported = () => false;
    expect(getSupportedMimeType(isSupported)).toBeNull();
  });

  it("checks types in priority order, not just supported-ness", () => {
    const checked: string[] = [];
    const isSupported = (mimeType: string) => {
      checked.push(mimeType);
      return mimeType === "audio/mp4";
    };
    getSupportedMimeType(isSupported);
    expect(checked).toEqual(["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]);
  });
});
