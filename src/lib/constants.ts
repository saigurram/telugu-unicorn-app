export const DEFAULT_EXCHANGE_TARGET = 4;
export const MIN_EXCHANGE_TARGET = 3;
export const MAX_EXCHANGE_TARGET = 5;

export const NO_REPEAT_SESSION_WINDOW = 5;

// VAD (voice activity detection)
export const VAD_SILENCE_MS = 1300;
export const VAD_MIN_RECORDING_MS = 500;
export const VAD_SPEECH_RMS_THRESHOLD = 0.02;
export const VAD_HARD_CAP_MS = 15_000;
export const VAD_SAMPLE_INTERVAL_MS = 100;

// Audio playback settle delay between Mila finishing speech and mic starting
export const PLAYBACK_TO_MIC_SETTLE_MS = 200;

// Timeouts (ms) for outbound vendor calls, overridable via env
export const DEFAULT_TTS_TIMEOUT_MS = 8_000;
export const DEFAULT_CLAUDE_TIMEOUT_MS = 15_000;
export const DEFAULT_STT_TIMEOUT_MS = 10_000;

export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const CLAUDE_MAX_TOKENS = 200;

export const CELEBRATION_ANIMATION_FALLBACK_MS = 4_000;

// Never leave the child staring at a silently-stuck unicorn: auto-retry a
// failed turn a few times, then end the session warmly rather than retry
// forever against a persistently broken vendor/network.
export const ERROR_RETRY_DELAY_MS = 1_500;
export const MAX_ERROR_RETRIES = 3;
