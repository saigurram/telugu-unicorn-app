import { describe, expect, it } from "vitest";
import {
  computeRms,
  createInitialVadState,
  shouldAutoStop,
  updateVadState,
} from "@/lib/audio/vad";
import {
  VAD_HARD_CAP_MS,
  VAD_MIN_RECORDING_MS,
  VAD_SILENCE_MS,
} from "@/lib/constants";

describe("shouldAutoStop", () => {
  it("never stops before any speech has been detected", () => {
    const state = createInitialVadState(0);
    expect(shouldAutoStop(state, VAD_SILENCE_MS + 1000)).toBe(false);
  });

  it("stops after the silence gap once speech has been heard and the minimum duration passed", () => {
    let state = createInitialVadState(0);
    state = updateVadState(state, { rms: 0.1, timestampMs: 600 });
    const now = 600 + VAD_SILENCE_MS + 1;
    expect(shouldAutoStop(state, now)).toBe(true);
  });

  it("does not stop before the minimum recording length even after speech+silence", () => {
    let state = createInitialVadState(0);
    state = updateVadState(state, { rms: 0.1, timestampMs: 50 });
    // Total elapsed time is under VAD_MIN_RECORDING_MS.
    expect(shouldAutoStop(state, Math.min(100, VAD_MIN_RECORDING_MS - 1))).toBe(false);
  });

  it("always stops at the hard cap regardless of speech/silence state", () => {
    const state = createInitialVadState(0);
    expect(shouldAutoStop(state, VAD_HARD_CAP_MS)).toBe(true);
  });

  it("does not stop while the child is still actively speaking", () => {
    let state = createInitialVadState(0);
    state = updateVadState(state, { rms: 0.1, timestampMs: 500 });
    state = updateVadState(state, { rms: 0.1, timestampMs: 900 });
    expect(shouldAutoStop(state, 1000)).toBe(false);
  });
});

describe("computeRms", () => {
  it("returns 0 for silence (all samples at the 128 midpoint)", () => {
    const silence = new Uint8Array(64).fill(128);
    expect(computeRms(silence)).toBeCloseTo(0, 5);
  });

  it("returns a positive value for a loud signal", () => {
    const loud = new Uint8Array(64).fill(255);
    expect(computeRms(loud)).toBeGreaterThan(0.9);
  });
});
