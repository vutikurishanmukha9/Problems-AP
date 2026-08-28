import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  FlipHorizontal,
  Info,
  Loader2,
  MapPin,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { DISTRICTS_DATA } from "@/data/taxonomy";
import { Button } from "@/components/ui-kit";

export interface GpsCapturedPhoto {
  readonly file: File;
  readonly previewUrl: string;
  readonly lat: number;
  readonly lng: number;
  readonly accuracy: number;
  readonly area: string;
  readonly district: string;
  readonly capturedAt: string;
  readonly isGpsStamped: boolean;
}

interface GpsCameraModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onPhotoCaptured: (photo: GpsCapturedPhoto) => void;
  readonly defaultDistrict?: string | undefined;
  readonly defaultConstituency?: string | undefined;
}

type CameraStatus = "initializing" | "ready" | "denied" | "error";
type GpsStatus = "acquiring" | "locked" | "denied" | "unavailable";

function findNearestDistrict(lat: number, lng: number): string {
  let minDistance = Number.POSITIVE_INFINITY;
  let nearest = "Andhra Pradesh";
  for (const d of DISTRICTS_DATA) {
    const dLat = d.lat - lat;
    const dLng = d.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearest = d.name;
    }
  }
  return nearest;
}

export function GpsCameraModal({
  isOpen,
  onClose,
  onPhotoCaptured,
  defaultDistrict,
  defaultConstituency,
}: GpsCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("initializing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState<number>(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Live GPS Telemetry state
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("acquiring");
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [resolvedLocationName, setResolvedLocationName] = useState<string>("");
  const [resolvedDistrictName, setResolvedDistrictName] = useState<string>(
    defaultDistrict || "",
  );
  const [clockString, setClockString] = useState<string>("");

  // Review state after snapping
  const [stampedPreview, setStampedPreview] = useState<GpsCapturedPhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Live Clock updater
  useEffect(() => {
    if (!isOpen) return;
    const updateClock = () => {
      const now = new Date();
      setClockString(
        now.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Connect active mediaStream directly to the video element whenever stream changes or video mounts
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mediaStream) return;

    if (video.srcObject !== mediaStream) {
      video.srcObject = mediaStream;
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Auto-play policy retry
      });
    }
  }, [mediaStream, cameraStatus]);

  // Start continuous high-precision GPS Watch
  useEffect(() => {
    if (!isOpen) return;

    if (!globalThis.navigator?.geolocation) {
      setGpsStatus("unavailable");
      return;
    }

    setGpsStatus("acquiring");

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const roundedAcc = Math.round(accuracy);
        setCurrentCoords({ lat: latitude, lng: longitude, accuracy: roundedAcc });
        setGpsStatus(roundedAcc <= 30 ? "locked" : "acquiring");

        // Primary: Resolve nearest district mathematically from coordinates
        const calculatedDistrict = findNearestDistrict(latitude, longitude);
        setResolvedDistrictName(calculatedDistrict);

        // Secondary: Enrich landmark and locality name via reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            const landmark =
              addr?.amenity ||
              addr?.building ||
              addr?.landmark ||
              addr?.leisure ||
              addr?.tourism ||
              addr?.shop ||
              addr?.office ||
              "";
            const road = addr?.road || addr?.street || addr?.pedestrian || addr?.highway || "";
            const locality =
              addr?.suburb ||
              addr?.neighbourhood ||
              addr?.village ||
              addr?.hamlet ||
              addr?.town ||
              addr?.city_district ||
              addr?.city ||
              "";

            const primaryParts = [landmark, road, locality].filter(Boolean);
            if (primaryParts.length > 0) {
              setResolvedLocationName(primaryParts.join(", "));
            } else if (data.display_name) {
              const dParts = data.display_name
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);
              setResolvedLocationName(dParts.slice(0, 2).join(", "));
            }
          }
        } catch {
          // Graceful fallback to raw coordinates
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("denied");
        } else {
          setGpsStatus("unavailable");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000,
      },
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOpen]);

  // Start Camera Stream with layered constraint fallbacks
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    async function startCamera() {
      setCameraStatus("initializing");
      setErrorMessage("");

      // Stop any existing stream
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
      setMediaStream(null);

      try {
        // Enumerate video devices and sort back/rear cameras first
        let devices: MediaDeviceInfo[] = [];
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
          // Sort back cameras first
          devices = videoInputs.sort((a, b) => {
            const aLabel = a.label.toLowerCase();
            const bLabel = b.label.toLowerCase();
            const aIsBack = aLabel.includes("back") || aLabel.includes("rear") || aLabel.includes("environment") || aLabel.includes("0");
            const bIsBack = bLabel.includes("back") || bLabel.includes("rear") || bLabel.includes("environment") || bLabel.includes("0");
            if (aIsBack && !bIsBack) return -1;
            if (!aIsBack && bIsBack) return 1;
            return 0;
          });
          if (isSubscribed) setVideoDevices(devices);
        } catch {
          // Continue with default constraints
        }

        const isExplicitSelection = activeDeviceIndex > 0;
        const selectedDeviceId = isExplicitSelection ? devices[activeDeviceIndex]?.deviceId : undefined;

        let stream: MediaStream | null = null;

        // If user hasn't explicitly picked a specific camera index, prioritize rear/back camera
        if (!selectedDeviceId) {
          // Attempt 1: Strict back camera (facingMode: { exact: "environment" })
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                facingMode: { exact: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
            });
          } catch {
            // Attempt 2: Ideal environment back camera
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  facingMode: { ideal: "environment" },
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                },
              });
            } catch {
              // Attempt 3: Flexible facingMode environment
              try {
                stream = await navigator.mediaDevices.getUserMedia({
                  audio: false,
                  video: { facingMode: "environment" },
                });
              } catch {
                // Universal fallback
                stream = await navigator.mediaDevices.getUserMedia({
                  audio: false,
                  video: true,
                });
              }
            }
          }
        } else {
          // User explicitly clicked Flip Camera to choose specific device
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                deviceId: { exact: selectedDeviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: { deviceId: { exact: selectedDeviceId } },
            });
          }
        }

        if (!isSubscribed) {
          if (stream) {
            for (const track of stream.getTracks()) track.stop();
          }
          return;
        }

        if (!stream) {
          throw new Error("No video stream returned by camera.");
        }

        streamRef.current = stream;
        setMediaStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          };
          await videoRef.current.play().catch(() => {});
        }

        setCameraStatus("ready");
      } catch (err: unknown) {
        if (!isSubscribed) return;
        const isPermissionError =
          (err instanceof DOMException &&
            (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) ||
          (err instanceof Error &&
            (err.name === "NotAllowedError" || err.name === "PermissionDeniedError"));

        if (isPermissionError) {
          setCameraStatus("denied");
          setErrorMessage(
            "Camera access was denied. Please allow camera permissions in your browser settings.",
          );
        } else {
          setCameraStatus("error");
          setErrorMessage(
            "Could not initialize camera hardware. Please check your device settings or permissions.",
          );
        }
      }
    }

    void startCamera();

    return () => {
      isSubscribed = false;
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
      setMediaStream(null);
    };
  }, [isOpen, activeDeviceIndex]);

  // Flip Camera
  const switchCamera = () => {
    if (videoDevices.length <= 1) return;
    setActiveDeviceIndex((prev) => (prev + 1) % videoDevices.length);
  };

  // Close & Clean Up
  const handleClose = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setMediaStream(null);
    setStampedPreview(null);
    onClose();
  };

  // Capture & Burn Geotag Watermark onto Canvas
  const capturePhoto = async () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const rawWidth = video.videoWidth || 1280;
      const rawHeight = video.videoHeight || 720;

      // Cap dimensions to max 1600px for optimal mobile payload
      const maxDim = 1600;
      let targetWidth = rawWidth;
      let targetHeight = rawHeight;
      if (targetWidth > maxDim || targetHeight > maxDim) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
          targetWidth = maxDim;
        } else {
          targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
          targetHeight = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get 2D canvas rendering context");
      }

      // Draw the raw camera snapshot
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

      // Metadata to stamp
      const lat = currentCoords?.lat ?? 16.5;
      const lng = currentCoords?.lng ?? 80.6;
      const accuracy = currentCoords?.accuracy ?? 0;
      const district = resolvedDistrictName || defaultDistrict || "Andhra Pradesh";
      const constituency = defaultConstituency ? `${defaultConstituency} A.C.` : "";

      const locationTitle = resolvedLocationName
        ? `${resolvedLocationName}, ${district}`
        : `${district}${constituency ? ` (${constituency})` : ""}`;
      const nowIso = new Date().toISOString();
      const istTimeStr =
        clockString || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      // Proportional Font Metrics based on canvas output pixel width
      const baseUnit = targetWidth / 1000;
      const titleFontSize = Math.max(16, Math.round(baseUnit * 22));
      const bodyFontSize = Math.max(13, Math.round(baseUnit * 17));
      const smallFontSize = Math.max(11, Math.round(baseUnit * 14));
      const paddingX = Math.max(16, Math.round(baseUnit * 24));
      const paddingY = Math.max(14, Math.round(baseUnit * 20));

      const bannerHeight = Math.max(120, Math.round(targetHeight * 0.19));
      const bannerTop = targetHeight - bannerHeight;

      // Draw Obsidian Translucent Gradient Banner
      const gradient = ctx.createLinearGradient(0, bannerTop - 30, 0, targetHeight);
      gradient.addColorStop(0, "rgba(8, 12, 22, 0)");
      gradient.addColorStop(0.25, "rgba(8, 12, 22, 0.78)");
      gradient.addColorStop(1, "rgba(8, 12, 22, 0.94)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, bannerTop - 30, targetWidth, bannerHeight + 30);

      // Subtle Accent Top Highlight Bar
      ctx.fillStyle = "rgba(224, 93, 56, 0.9)";
      ctx.fillRect(0, bannerTop, targetWidth, Math.max(2, Math.round(baseUnit * 3)));

      // Text Typography rendering
      ctx.textBaseline = "top";

      // Line 1: Location & District
      ctx.font = `bold ${titleFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      const locText = locationTitle;
      ctx.fillText(locText, paddingX, bannerTop + paddingY);

      // Line 2: High-Precision Coordinates & Accuracy
      ctx.font = `600 ${bodyFontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = "#F1F5F9";
      const coordsText = currentCoords
        ? `GPS: ${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E (±${accuracy}m accuracy)`
        : `GPS: ${district} (Regional Coordinates)`;
      ctx.fillText(coordsText, paddingX, bannerTop + paddingY + titleFontSize + 8);

      // Line 3: Indian Standard Time & Verification Seal
      ctx.font = `500 ${smallFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = "#CBD5E1";
      const metaText = `${istTimeStr} IST  ·  Problems@AP Verified Evidence`;
      ctx.fillText(
        metaText,
        paddingX,
        bannerTop + paddingY + titleFontSize + bodyFontSize + 16,
      );

      // Reset shadow
      ctx.shadowBlur = 0;

      // Convert to high-quality JPEG Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const fileName = `gps-evidence-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: "image/jpeg" });
          const previewUrl = URL.createObjectURL(blob);

          setStampedPreview({
            file,
            previewUrl,
            lat,
            lng,
            accuracy,
            area: locationTitle,
            district,
            capturedAt: nowIso,
            isGpsStamped: true,
          });
          setIsProcessing(false);
        },
        "image/jpeg",
        0.85,
      );
    } catch {
      setIsProcessing(false);
    }
  };

  // Confirm Stamped Photo
  const handleConfirmPhoto = () => {
    if (stampedPreview) {
      onPhotoCaptured(stampedPreview);
      handleClose();
    }
  };

  // Retake Photo
  const handleRetake = () => {
    if (stampedPreview) {
      URL.revokeObjectURL(stampedPreview.previewUrl);
      setStampedPreview(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-4 backdrop-blur-md">
      <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-black text-white shadow-2xl sm:h-[90vh] sm:rounded-2xl sm:border sm:border-white/10">
        {/* Header Bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-accent text-white shadow-sm">
              <Camera className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-tight">Civic GPS Camera</p>
              <p className="text-[0.625rem] text-slate-300 font-mono">{clockString} IST</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {videoDevices.length > 1 && !stampedPreview && (
              <button
                type="button"
                onClick={switchCamera}
                className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 transition-colors"
                title="Switch Camera"
              >
                <FlipHorizontal className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Content Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {stampedPreview ? (
            /* Review Screen with Stamped Watermark */
            <div className="relative size-full flex items-center justify-center bg-slate-950">
              <img
                src={stampedPreview.previewUrl}
                alt="Stamped Evidence Preview"
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute top-16 left-4 rounded-full bg-ok/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                GPS Geotag Stamped
              </div>
            </div>
          ) : (
            /* Live Camera Stream with Viewfinder HUD */
            <div className="relative size-full flex items-center justify-center">
              {/* Always mounted video element ensures immediate stream binding */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className={`size-full object-cover transition-opacity duration-300 ${
                  cameraStatus === "ready" ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Initializing Spinner */}
              {cameraStatus === "initializing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black z-10">
                  <Loader2 className="size-8 animate-spin text-accent" />
                  <p className="text-xs font-semibold text-slate-300">
                    Starting camera hardware...
                  </p>
                </div>
              )}

              {/* Camera Permission Denied */}
              {cameraStatus === "denied" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black z-10">
                  <div className="flex size-14 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                    <Camera className="size-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">Camera Access Denied</h3>
                  <p className="mt-2 max-w-sm text-xs text-slate-400">{errorMessage}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-5 text-white"
                    onClick={handleClose}
                  >
                    Upload from Gallery Instead
                  </Button>
                </div>
              )}

              {/* Camera Hardware Error */}
              {cameraStatus === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black z-10">
                  <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                    <Info className="size-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">Camera Unavailable</h3>
                  <p className="mt-2 max-w-sm text-xs text-slate-400">{errorMessage}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-5 text-white"
                    onClick={handleClose}
                  >
                    Close Camera
                  </Button>
                </div>
              )}

              {/* Targeting Crosshairs Grid */}
              {cameraStatus === "ready" && (
                <div className="pointer-events-none absolute inset-8 border border-white/20 rounded-xl">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 border border-white/30 rounded-full flex items-center justify-center">
                    <div className="size-1.5 bg-accent rounded-full" />
                  </div>
                </div>
              )}

              {/* Live Telemetry HUD Overlay */}
              {cameraStatus === "ready" && (
                <div className="pointer-events-none absolute bottom-24 inset-x-4 flex flex-col gap-2">
                  <div className="self-start rounded-xl border border-white/15 bg-black/65 p-3.5 backdrop-blur-md shadow-xl max-w-md">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2.5 rounded-full animate-pulse ${
                          gpsStatus === "locked"
                            ? "bg-ok"
                            : gpsStatus === "acquiring"
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                      />
                      <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-300">
                        {gpsStatus === "locked"
                          ? `Satellite Lock (±${currentCoords?.accuracy}m)`
                          : gpsStatus === "acquiring"
                            ? "Acquiring Satellites (<30m)..."
                            : "Location Unavailable (Manual District)"}
                      </span>
                    </div>

                    {/* Area & Landmark Display */}
                    <div className="mt-2 flex items-start gap-1.5 text-xs font-bold text-white">
                      <MapPin className="size-3.5 text-accent shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="truncate">
                          {resolvedLocationName || "Locating Landmark / Area..."}
                        </p>
                        <p className="text-[0.6875rem] font-semibold text-slate-300 mt-0.5">
                          {resolvedDistrictName || defaultDistrict || "Andhra Pradesh"}
                          {defaultConstituency ? ` · ${defaultConstituency} A.C.` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="mt-1.5 font-mono text-[0.6875rem] text-slate-300">
                      {currentCoords
                        ? `${currentCoords.lat.toFixed(6)}° N, ${currentCoords.lng.toFixed(6)}° E`
                        : "Locating precision coordinates..."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="z-20 flex items-center justify-between border-t border-white/10 bg-black/90 p-4 backdrop-blur-md">
          {stampedPreview ? (
            /* Review Actions */
            <div className="flex w-full items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleRetake}
                className="flex items-center gap-1.5 text-white border-white/20 hover:bg-white/10"
              >
                <RotateCcw className="size-4" />
                Retake
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirmPhoto}
                className="flex items-center gap-1.5 bg-ok hover:bg-ok/90 text-white font-bold"
              >
                <Check className="size-4" />
                Use Stamped Photo
              </Button>
            </div>
          ) : cameraStatus === "ready" ? (
            /* Shutter Trigger Button */
            <div className="flex w-full items-center justify-center relative">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={isProcessing}
                className="group relative flex size-18 items-center justify-center rounded-full border-4 border-white/80 bg-white/20 p-1 transition-transform active:scale-95 disabled:opacity-50"
                title="Capture GPS Evidence Photo"
              >
                <span className="size-full rounded-full bg-white transition-colors group-hover:bg-slate-200" />
                {isProcessing && (
                  <Loader2 className="absolute size-7 animate-spin text-accent" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex w-full justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClose}
                className="text-white"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
