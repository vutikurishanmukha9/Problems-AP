// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

export type CapturedErrorValue = Error | string;

interface CapturedErrorEntry {
  error: CapturedErrorValue;
  at: number;
}

let lastCapturedError: CapturedErrorEntry | undefined;
const TTL_MS = 5_000;

function record(error: CapturedErrorValue) {
  lastCapturedError = { error, at: Date.now() };
}

// h3's HTTPError serializes to {"status":500,"unhandled":true,"message":"HTTPError"} —
// no stack, no cause — so a plain console.error(error) reaches the log pipeline with
// the failure detail stripped. Expand Error-like args into a string that keeps the
// message, stack, and the full cause chain.
const CAUSE_DEPTH_LIMIT = 5;
const DESCRIPTION_LENGTH_LIMIT = 8_000;

export function describeError(error: Error): string {
  const parts: string[] = [];
  let current: Error | undefined = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    const label = depth === 0 ? "" : "caused by: ";
    const status = describeStatus(current);
    parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
    current = current.cause instanceof Error ? current.cause : undefined;
  }
  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

function describeStatus(error: Error): string {
  // SAFETY: Custom errors may attach numeric HTTP status properties
  const statusHolder = error as { status?: number; statusCode?: number };
  const value = statusHolder.status ?? statusHolder.statusCode;
  return Number.isFinite(value) ? ` (status ${value})` : "";
}

function isErrorLike(value: CapturedErrorValue | null | undefined): value is Error {
  return value instanceof Error;
}

// Wrap console.error so errors logged by any layer — including h3's internal
// unhandled-error logging, which this file cannot hook directly — are both
// recorded for consumeLastCapturedError and expanded before serialization.
const originalConsoleError = console.error.bind(console);
console.error = (...args: (CapturedErrorValue | null | undefined)[]) => {
  const expanded = args.map((arg) => {
    if (!isErrorLike(arg)) return arg;
    record(arg);
    return describeError(arg);
  });
  originalConsoleError(...expanded);
};

if ("addEventListener" in globalThis) {
  globalThis.addEventListener("error", (event) => {
    // SAFETY: DOM ErrorEvent carries the thrown Error or error value
    const errorEvt = event as ErrorEvent;
    const err = errorEvt.error instanceof Error ? errorEvt.error : String(event);
    record(err);
  });
  globalThis.addEventListener("unhandledrejection", (event) => {
    // SAFETY: PromiseRejectionEvent carries the rejection reason
    const rejEvt = event as PromiseRejectionEvent;
    const err = rejEvt.reason instanceof Error ? rejEvt.reason : String(rejEvt.reason);
    record(err);
  });
}

export function consumeLastCapturedError(): CapturedErrorValue | undefined {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
