/** User-triggered navigation only: no automatic focus stealing during playback. */
export function focusReaderRegion(region: "focus" | "original") {
  const id = region === "focus" ? "focus-reader" : "original-text";
  const target = document.getElementById(id);
  if (!target) return;
  const scrollTarget = region === "focus"
    ? target
    : document.getElementById("original-reader") ?? target;
  scrollTarget.scrollIntoView({ block: "nearest", behavior: "auto" });
  target.focus({ preventScroll: true });
}
