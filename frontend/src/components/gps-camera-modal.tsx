import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  FlipHorizontal,
  Info,
  Loader2,
  MapPin,
  RotateCcw,
  X,
  Zap,
  ZapOff,
} from "lucide-react";
import { DISTRICTS_DATA, getDistrictForConstituency } from "@/data/taxonomy";

export interface GpsCapturedPhoto {
  readonly file: File;
  readonly previewUrl: string;
  readonly lat: number;
  readonly lng: number;
  readonly accuracy: number;
  readonly altitude?: number | undefined;
  readonly plusCode: string;
  readonly area: string;
  readonly district: string;
  readonly capturedAt: string;
  readonly stampId: string;
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

interface FocusPoint {
  x: number;
  y: number;
  id: number;
}

interface MediaTrackCapabilitiesExtended extends MediaTrackCapabilities {
  torch?: boolean;
}

interface MediaTrackConstraintSetExtended extends MediaTrackConstraintSet {
  focusMode?: string;
  exposureMode?: string;
  whiteBalanceMode?: string;
  torch?: boolean;
  pointsOfInterest?: { x: number; y: number }[];
}

/**
 * Open Location Code (Plus Code) Generator
 * Encodes real latitude & longitude into a universal global 10-character cadastral address.
 */
const OLC_ALPHABET = "23456789CFGHJMPQRVWX";
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;
const INITIAL_RESOLUTIONS = [20, 1, 0.05, 0.0025] as const;

function encodePlusCode(latitude: number, longitude: number): string {
  let lat = Math.min(Math.max(latitude, -LATITUDE_MAX), LATITUDE_MAX);
  let lng = longitude;
  while (lng < -LONGITUDE_MAX) lng += 360;
  while (lng >= LONGITUDE_MAX) lng -= 360;

  if (lat === 90) lat -= 0.0000001;

  lat += LATITUDE_MAX;
  lng += LONGITUDE_MAX;

  let code = "";
  let latVal = lat;
  let lngVal = lng;

  for (let i = 0; i < 4; i++) {
    const res = INITIAL_RESOLUTIONS[i] ?? 1;
    const latDigit = Math.floor(latVal / res);
    const lngDigit = Math.floor(lngVal / res);
    code += OLC_ALPHABET.charAt(latDigit) + OLC_ALPHABET.charAt(lngDigit);
    latVal -= latDigit * res;
    lngVal -= lngDigit * res;
    if (i === 3) code += "+";
  }

  const gridLatRes = 0.0025 / 5;
  const gridLngRes = 0.0025 / 4;
  const latDigit = Math.min(4, Math.floor(latVal / gridLatRes));
  const lngDigit = Math.min(3, Math.floor(lngVal / gridLngRes));
  code += OLC_ALPHABET.charAt(latDigit * 4 + lngDigit);

  return code;
}

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

function generateStampId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "AP-GEO-";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Ultra-Reliable Multi-Tier Reverse Geocoder for Andhra Pradesh
 * Queries OpenStreetMap Nominatim, BigDataCloud Client API, and Photon Komoot.
 * Resolves building, landmark, amenity, road, street, sub-locality, village, and town.
 */
async function fetchReverseGeocode(lat: number, lng: number): Promise<string> {
  // Tier 1: OpenStreetMap Nominatim with full address detail parsing
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { "Accept-Language": "en" },
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

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
        addr?.historic ||
        addr?.place_of_worship ||
        addr?.commercial ||
        "";
      const road =
        addr?.road ||
        addr?.street ||
        addr?.pedestrian ||
        addr?.highway ||
        addr?.path ||
        addr?.lane ||
        "";
      const locality =
        addr?.suburb ||
        addr?.neighbourhood ||
        addr?.residential ||
        addr?.quarter ||
        addr?.village ||
        addr?.hamlet ||
        addr?.town ||
        addr?.city_district ||
        addr?.city ||
        "";

      const parts = [landmark, road, locality].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(", ");
      }
      if (data.display_name) {
        const dParts = data.display_name
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (dParts.length >= 2) {
          return dParts.slice(0, 2).join(", ");
        }
      }
    }
  } catch {
    // Continue to Tier 2
  }

  // Tier 2: BigDataCloud Reverse Geocoding Client API (Free, high-speed, no rate limits)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2400);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.localityInfo?.administrative?.[3]?.name || "";
      const subLocality =
        data.localityInfo?.administrative?.[4]?.name ||
        data.localityInfo?.informative?.[0]?.name ||
        "";
      const city = data.city || data.principalSubdivision || "";

      const parts = [subLocality, locality, city]
        .filter(Boolean)
        .filter((val, idx, arr) => arr.indexOf(val) === idx);

      if (parts.length > 0) {
        return parts.slice(0, 2).join(", ");
      }
    }
  } catch {
    // Continue to Tier 3
  }

  // Tier 3: Photon / Komoot OpenStreetMap Reverse API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const feature = data?.features?.[0]?.properties;
      if (feature) {
        const name = feature.name || "";
        const street = feature.street || "";
        const locality = feature.district || feature.locality || feature.city || "";
        const parts = [name, street, locality].filter(Boolean);
        if (parts.length > 0) {
          return parts.slice(0, 2).join(", ");
        }
      }
    }
  } catch {
    // Fallback
  }

  return "";
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
  const bestPositionRef = useRef<GeolocationPosition | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("initializing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState<number>(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Hardware controls
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);

  // Live GPS Telemetry state
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("acquiring");
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    altitude?: number | undefined;
  } | null>(null);
  const [plusCodeString, setPlusCodeString] = useState<string>("");
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

  // Connect active mediaStream directly to video element and maintain continuous playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mediaStream) return;

    if (video.srcObject !== mediaStream) {
      video.srcObject = mediaStream;
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }, [mediaStream, cameraStatus, stampedPreview]);

  // Direct Authentic GPS Satellite Lock Pipeline
  useEffect(() => {
    if (!isOpen) return;

    if (!globalThis.navigator?.geolocation) {
      setGpsStatus("unavailable");
      return;
    }

    setGpsStatus("acquiring");
    bestPositionRef.current = null;

    // Helper to process a real GPS position fix
    const processGpsFix = async (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, altitude } = pos.coords;
      const roundedAcc = Math.round(accuracy);

      // Keep tracking the best satellite fix
      if (!bestPositionRef.current || accuracy <= bestPositionRef.current.coords.accuracy) {
        bestPositionRef.current = pos;
      }

      const currentAltitude = altitude !== null ? Math.round(altitude) : undefined;

      // Update real coordinates directly from hardware GPS sensor
      setCurrentCoords({
        lat: latitude,
        lng: longitude,
        accuracy: roundedAcc,
        altitude: currentAltitude,
      });

      // Calculate real Plus Code
      const code = encodePlusCode(latitude, longitude);
      setPlusCodeString(code);

      setGpsStatus(roundedAcc <= 25 ? "locked" : "acquiring");

      // Calculate nearest district from exact coordinates
      const calculatedDistrict = findNearestDistrict(latitude, longitude);
      setResolvedDistrictName(calculatedDistrict);

      // Resolve exact landmark & street name asynchronously
      const locName = await fetchReverseGeocode(latitude, longitude);
      if (locName) {
        setResolvedLocationName(locName);
      }
    };

    // 1. One-shot immediate fix
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void processGpsFix(pos);
      },
      () => {
        // Ignore, watchPosition will continue
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000,
      },
    );

    // 2. Continuous high accuracy watch
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        void processGpsFix(pos);
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
        timeout: 15000,
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

  // Start Camera Stream with rear-camera prioritization
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    async function startCamera() {
      setCameraStatus("initializing");
      setErrorMessage("");
      setIsTorchOn(false);

      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
      setMediaStream(null);

      try {
        let devices: MediaDeviceInfo[] = [];
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
          devices = videoInputs.sort((a, b) => {
            const aLabel = a.label.toLowerCase();
            const bLabel = b.label.toLowerCase();
            const aIsBack =
              aLabel.includes("back") ||
              aLabel.includes("rear") ||
              aLabel.includes("environment") ||
              aLabel.includes("0");
            const bIsBack =
              bLabel.includes("back") ||
              bLabel.includes("rear") ||
              bLabel.includes("environment") ||
              bLabel.includes("0");
            if (aIsBack && !bIsBack) return -1;
            if (!aIsBack && bIsBack) return 1;
            return 0;
          });
          if (isSubscribed) setVideoDevices(devices);
        } catch {
          // Continue with default constraints
        }

        const isExplicitSelection = activeDeviceIndex > 0;
        const selectedDeviceId = isExplicitSelection
          ? devices[activeDeviceIndex]?.deviceId
          : undefined;

        let stream: MediaStream | null = null;

        if (!selectedDeviceId) {
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
              try {
                stream = await navigator.mediaDevices.getUserMedia({
                  audio: false,
                  video: { facingMode: "environment" },
                });
              } catch {
                stream = await navigator.mediaDevices.getUserMedia({
                  audio: false,
                  video: true,
                });
              }
            }
          }
        } else {
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

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && "getCapabilities" in videoTrack) {
          const capabilities = videoTrack.getCapabilities() as MediaTrackCapabilitiesExtended;
          setHasTorch(Boolean(capabilities.torch));

          try {
            const advancedSettings: MediaTrackConstraintSetExtended = {
              focusMode: "continuous",
              exposureMode: "continuous",
              whiteBalanceMode: "continuous",
            };
            void videoTrack
              .applyConstraints({
                advanced: [advancedSettings],
              })
              .catch(() => {});
          } catch {
            // Ignore if unsupported
          }
        }

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
    };
  }, [isOpen, activeDeviceIndex]);

  // Toggle Hardware Torch / Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const nextState = !isTorchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: nextState } as MediaTrackConstraintSetExtended],
      });
      setIsTorchOn(nextState);
    } catch {
      // Ignore torch error
    }
  };

  // Real Camera Tap to Focus
  const handleViewfinderTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cameraStatus !== "ready" || stampedPreview) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFocusPoint({ x, y, id: Date.now() });

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const normX = x / rect.width;
          const normY = y / rect.height;
          void track
            .applyConstraints({
              advanced: [
                {
                  pointsOfInterest: [{ x: normX, y: normY }],
                  focusMode: "continuous",
                } as MediaTrackConstraintSetExtended,
              ],
            })
            .catch(() => {});
        } catch {
          // Ignore
        }
      }
    }

    setTimeout(() => {
      setFocusPoint((prev) => (prev?.x === x && prev?.y === y ? null : prev));
    }, 1500);
  };

  // Flip Camera
  const switchCamera = () => {
    if (videoDevices.length <= 1) return;
    setActiveDeviceIndex((prev) => (prev + 1) % videoDevices.length);
  };

  // Precision Capture Engine: Watermarks authentic GPS coordinates & street name
  const capturePhoto = async () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 150);

    try {
      const video = videoRef.current;
      const naturalWidth = video.videoWidth || 1920;
      const naturalHeight = video.videoHeight || 1080;

      let targetWidth = naturalWidth;
      let targetHeight = naturalHeight;
      const maxDim = 1600;

      if (targetWidth > maxDim || targetHeight > maxDim) {
        if (targetWidth >= targetHeight) {
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

      // Draw the raw camera frame
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

      // Resolve final real-world coordinates
      let lat = currentCoords?.lat;
      let lng = currentCoords?.lng;
      let accuracy = currentCoords?.accuracy ?? 0;
      let altitude = currentCoords?.altitude;

      if (lat === undefined || lng === undefined) {
        try {
          const quickPos = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error("No geolocation"));
              return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 3500,
              maximumAge: 0,
            });
          });
          lat = quickPos.coords.latitude;
          lng = quickPos.coords.longitude;
          accuracy = Math.round(quickPos.coords.accuracy);
          altitude = quickPos.coords.altitude !== null ? Math.round(quickPos.coords.altitude) : undefined;
        } catch {
          // GPS unavailable
        }
      }

      const hasRealGps = lat !== undefined && lng !== undefined;
      const finalLat = lat ?? 0;
      const finalLng = lng ?? 0;

      const district = resolvedDistrictName || defaultDistrict || "Andhra Pradesh";
      const constituencyDistrict = defaultConstituency
        ? getDistrictForConstituency(defaultConstituency)
        : undefined;
      const isMatchingConstituency =
        !constituencyDistrict ||
        constituencyDistrict.toLowerCase() === district.toLowerCase();
      const constituencyLabel =
        defaultConstituency && isMatchingConstituency
          ? `${defaultConstituency} A.C.`
          : "";
      const stampId = generateStampId();
      const plusCode = hasRealGps ? plusCodeString || encodePlusCode(finalLat, finalLng) : "";

      // Ensure location name is resolved on-demand if empty
      let locName = resolvedLocationName;
      if (!locName && hasRealGps) {
        locName = await fetchReverseGeocode(finalLat, finalLng);
        if (locName) {
          setResolvedLocationName(locName);
        }
      }

      const locationTitle = locName
        ? `${locName}, ${district}`
        : `${district}${constituencyLabel ? ` (${constituencyLabel})` : ""}`;
      const nowIso = new Date().toISOString();
      const istTimeStr =
        clockString || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      // Proportional Font Metrics based on canvas output pixel width
      const baseUnit = targetWidth / 1000;
      const titleFontSize = Math.max(16, Math.round(baseUnit * 22));
      const bodyFontSize = Math.max(13, Math.round(baseUnit * 17));
      const smallFontSize = Math.max(11, Math.round(baseUnit * 14));
      const paddingX = Math.max(18, Math.round(baseUnit * 26));
      const paddingY = Math.max(16, Math.round(baseUnit * 22));

      const bannerHeight = Math.max(140, Math.round(targetHeight * 0.22));
      const bannerTop = targetHeight - bannerHeight;

      // Draw Obsidian Translucent Gradient Banner
      const gradient = ctx.createLinearGradient(0, bannerTop - 35, 0, targetHeight);
      gradient.addColorStop(0, "rgba(8, 12, 22, 0)");
      gradient.addColorStop(0.2, "rgba(8, 12, 22, 0.84)");
      gradient.addColorStop(1, "rgba(8, 12, 22, 0.97)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, bannerTop - 35, targetWidth, bannerHeight + 35);

      // Accent Top Highlight Bar (Andhra Terracotta Accent)
      ctx.fillStyle = "rgba(224, 93, 56, 0.95)";
      ctx.fillRect(0, bannerTop, targetWidth, Math.max(3, Math.round(baseUnit * 3.5)));

      ctx.textBaseline = "top";

      // Line 1: Landmark, Locality & District
      ctx.font = `bold ${titleFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 5;
      const locText = locationTitle;
      ctx.fillText(locText, paddingX, bannerTop + paddingY);

      // Line 2: Precision GPS Coordinates & Accuracy
      ctx.font = `600 ${bodyFontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = "#F8FAFC";
      let coordsText = "";
      if (hasRealGps) {
        const telemetryParts = [
          `GPS: ${finalLat.toFixed(6)}° N, ${finalLng.toFixed(6)}° E (±${accuracy}m accuracy)`,
        ];
        if (altitude !== undefined) {
          telemetryParts.push(`Alt: ${altitude}m`);
        }
        coordsText = telemetryParts.join(" · ");
      } else {
        coordsText = `Location: ${district} · Manual District Assignment`;
      }
      ctx.fillText(coordsText, paddingX, bannerTop + paddingY + titleFontSize + 8);

      // Line 3: Cadastral Plus Code, Timestamp, Verification Stamp ID & Seal
      ctx.font = `500 ${smallFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = "#CBD5E1";
      let metaText = "";
      if (plusCode) {
        metaText = `Plus Code: ${plusCode}  ·  ${istTimeStr} IST  ·  Ref: ${stampId}  ·  Problems@AP Verified Evidence`;
      } else {
        metaText = `${istTimeStr} IST  ·  Ref: ${stampId}  ·  Problems@AP Verified Evidence`;
      }
      ctx.fillText(
        metaText,
        paddingX,
        bannerTop + paddingY + titleFontSize + bodyFontSize + 16,
      );

      ctx.shadowBlur = 0;

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
            lat: finalLat,
            lng: finalLng,
            accuracy,
            altitude,
            plusCode,
            area: locationTitle,
            district,
            capturedAt: nowIso,
            stampId,
            isGpsStamped: hasRealGps,
          });
          setIsProcessing(false);
        },
        "image/jpeg",
        0.88,
      );
    } catch {
      setIsProcessing(false);
    }
  };

  const handleConfirmPhoto = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (stampedPreview) {
      onPhotoCaptured(stampedPreview);
      handleClose();
    }
  };

  const handleRetake = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (stampedPreview) {
      URL.revokeObjectURL(stampedPreview.previewUrl);
      setStampedPreview(null);
    }
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (stampedPreview) {
      URL.revokeObjectURL(stampedPreview.previewUrl);
      setStampedPreview(null);
    }
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
    onClose();
  };

  if (!isOpen) return null;

  const accuracyMeters = currentCoords?.accuracy ?? 99;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          handleClose(e);
        }
      }}
    >
      <div
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-black text-white shadow-2xl sm:h-[88vh] sm:rounded-2xl sm:border sm:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shutter White Flash Animation */}
        {shutterFlash && (
          <div className="pointer-events-none absolute inset-0 z-50 bg-white transition-opacity duration-150" />
        )}

        {/* Minimal Clean Camera Top Bar */}
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* GPS Status Indicator */}
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md text-xs font-medium text-white border border-white/10 shadow-sm">
            <span
              className={`size-2 rounded-full ${
                gpsStatus === "locked"
                  ? "bg-emerald-400"
                  : gpsStatus === "acquiring"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-red-400"
              }`}
            />
            <span>
              {gpsStatus === "locked"
                ? `GPS Locked (±${accuracyMeters}m)`
                : gpsStatus === "acquiring"
                  ? "Acquiring GPS..."
                  : "GPS Offline"}
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Flashlight Torch Toggle */}
            {hasTorch && !stampedPreview && cameraStatus === "ready" && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`flex size-9 items-center justify-center rounded-full border border-white/10 backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                  isTorchOn
                    ? "bg-amber-400 text-black border-amber-300 shadow-md"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
                title={isTorchOn ? "Turn off Flash" : "Turn on Flash"}
              >
                {isTorchOn ? <Zap className="size-4 fill-current" /> : <ZapOff className="size-4" />}
              </button>
            )}

            {/* Flip Camera */}
            {videoDevices.length > 1 && !stampedPreview && (
              <button
                type="button"
                onClick={switchCamera}
                className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-all active:scale-95 cursor-pointer"
                title="Switch Camera"
              >
                <FlipHorizontal className="size-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose(e);
              }}
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-all active:scale-95 cursor-pointer"
              title="Close Camera"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Content Area (Unobstructed, Real Camera) */}
        <div
          className="relative flex-1 bg-black flex items-center justify-center overflow-hidden cursor-crosshair select-none"
          onClick={handleViewfinderTap}
        >
          {/* Live Camera Stream with Viewfinder */}
          <div className={`relative size-full flex items-center justify-center ${stampedPreview ? "invisible pointer-events-none" : "visible"}`}>
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
              className={`size-full object-cover transition-opacity duration-200 ${
                cameraStatus === "ready" ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Subtle Photography 3x3 Grid */}
            {cameraStatus === "ready" && (
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-15">
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div />
              </div>
            )}

            {/* Initializing Spinner */}
            {cameraStatus === "initializing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black z-10">
                <Loader2 className="size-7 animate-spin text-accent" />
                <p className="text-xs font-medium text-slate-300">
                  Starting camera...
                </p>
              </div>
            )}

            {/* Camera Permission Denied */}
            {cameraStatus === "denied" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black z-10">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                  <Camera className="size-6" />
                </div>
                <h3 className="mt-3 text-base font-bold text-white">Camera Access Denied</h3>
                <p className="mt-1.5 max-w-xs text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
                <button
                  type="button"
                  className="mt-4 flex h-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-xs font-medium text-white hover:bg-white/20 cursor-pointer"
                  onClick={(e) => handleClose(e)}
                >
                  Close Camera
                </button>
              </div>
            )}

            {/* Camera Hardware Error */}
            {cameraStatus === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black z-10">
                <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                  <Info className="size-6" />
                </div>
                <h3 className="mt-3 text-base font-bold text-white">Camera Unavailable</h3>
                <p className="mt-1.5 max-w-xs text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
                <button
                  type="button"
                  className="mt-4 flex h-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-xs font-medium text-white hover:bg-white/20 cursor-pointer"
                  onClick={(e) => handleClose(e)}
                >
                  Close Camera
                </button>
              </div>
            )}

            {/* Native Tap-to-Focus Yellow Box */}
            {focusPoint && (
              <div
                key={focusPoint.id}
                style={{ top: focusPoint.y - 28, left: focusPoint.x - 28 }}
                className="pointer-events-none absolute size-14 rounded border-2 border-yellow-400 animate-pulse shadow-sm"
              />
            )}

            {/* Clean Location Pill Overlay at Bottom of Viewfinder */}
            {cameraStatus === "ready" && (
              <div className="pointer-events-none absolute bottom-3 inset-x-3 flex justify-center z-20">
                <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1 text-xs text-slate-200 backdrop-blur-md border border-white/10 shadow-md max-w-full truncate">
                  <MapPin className="size-3.5 text-accent shrink-0" />
                  <span className="truncate">
                    {resolvedLocationName
                      ? `${resolvedLocationName}, ${resolvedDistrictName || defaultDistrict || "AP"}`
                      : resolvedDistrictName || defaultDistrict || "Detecting Location..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stamped Review Screen Overlay */}
          {stampedPreview && (
            <div className="absolute inset-0 size-full flex items-center justify-center bg-slate-950 p-2 z-20">
              <img
                src={stampedPreview.previewUrl}
                alt="Stamped Evidence Preview"
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              />
              <div className="absolute top-14 left-3 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md flex items-center gap-1.5 border border-white/10">
                <Check className="size-3.5 text-ok" />
                Verified GPS Evidence Stamped
              </div>
            </div>
          )}
        </div>

        {/* Real Native Camera Bottom Action Bar */}
        <div className="z-30 flex items-center justify-center border-t border-white/10 bg-black p-4 sm:p-5">
          {stampedPreview ? (
            /* Review Actions */
            <div className="flex w-full items-center justify-between gap-3 max-w-md">
              <button
                type="button"
                onClick={(e) => handleRetake(e)}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition-all hover:bg-white/20 active:scale-95 cursor-pointer shadow-sm"
              >
                <RotateCcw className="size-4" />
                Retake
              </button>
              <button
                type="button"
                onClick={(e) => handleConfirmPhoto(e)}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ok px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-ok/90 active:scale-95 cursor-pointer"
              >
                <Check className="size-4" />
                Use Photo
              </button>
            </div>
          ) : cameraStatus === "ready" ? (
            /* Real Native Camera Shutter Button */
            <div className="flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={isProcessing}
                className="group relative flex size-18 items-center justify-center rounded-full border-4 border-white p-1 transition-transform duration-150 active:scale-90 disabled:opacity-50 cursor-pointer shadow-lg"
                title="Take Photo"
              >
                <span className="size-full rounded-full bg-white transition-colors group-hover:bg-slate-100" />
                {isProcessing && (
                  <Loader2 className="absolute size-6 animate-spin text-accent" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex w-full justify-end">
              <button
                type="button"
                onClick={(e) => handleClose(e)}
                className="flex h-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-xs font-medium text-white hover:bg-white/20 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
