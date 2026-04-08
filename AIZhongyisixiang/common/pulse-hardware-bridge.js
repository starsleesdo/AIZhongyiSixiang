import { normalizePulsePayload } from "./pulse-analysis";

const EVENT_NAME = "hardware-pulse-data";

export function dispatchHardwarePulseData(payload) {
  const parsed = normalizePulsePayload(payload || {});
  uni.$emit(EVENT_NAME, parsed);
  return parsed;
}

export function getPulseHardwareEventName() {
  return EVENT_NAME;
}

