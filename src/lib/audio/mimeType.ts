/**
 * Priority list of recording mime types. Chrome/Android supports webm/opus;
 * iOS Safari (14.3+, MediaRecorder's only supported window) has no webm
 * support at all and needs mp4/AAC instead — so the list must fail through
 * cleanly rather than assuming one format.
 */
const MIME_TYPE_PRIORITY = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
];

export function getSupportedMimeType(
  isTypeSupported: (mimeType: string) => boolean = (mimeType) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType),
): string | null {
  for (const mimeType of MIME_TYPE_PRIORITY) {
    if (isTypeSupported(mimeType)) return mimeType;
  }
  return null;
}
