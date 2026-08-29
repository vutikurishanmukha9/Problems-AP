import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Compass,
  FlipHorizontal,
  Info,
  Loader2,
  MapPin,
  RotateCcw,
  Sparkles,
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
  readonly heading?: string | undefined;
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

interface IosDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
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

function getCardinalDirection(deg: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return `${Math.round(deg)}° ${directions[index]}`;
}

function generateStampId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "AP-GEO-";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
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

  // Hardware capabilities
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);

  // Compass heading & Device Leveling Horizon
  const [compassHeading, setCompassHeading] = useState<string | null>(null);
  const [deviceTilt, setDeviceTilt] = useState<{ gamma: number; beta: number } | null>(null);

  // Live GPS Telemetry state: Direct authentic hardware satellite reading
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

  // Orientation & Compass Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        setDeviceTilt({ gamma: Math.round(e.gamma), beta: Math.round(e.beta) });
      }

      let heading: number | null = null;
      if ("webkitCompassHeading" in e) {
        // SAFETY: iOS Safari provides webkitCompassHeading directly on DeviceOrientationEvent
        const iosEvent = e as IosDeviceOrientationEvent;
        const webkitHeading = iosEvent.webkitCompassHeading;
        if (webkitHeading !== undefined && Number.isFinite(webkitHeading)) {
          heading = webkitHeading;
        }
      } else if (e.alpha !== null && Number.isFinite(e.alpha)) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null && Number.isFinite(heading)) {
        setCompassHeading(getCardinalDirection(heading));
      }
    };

    if (globalThis.window && "DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => {
      if (globalThis.window && "DeviceOrientationEvent" in window) {
        window.removeEventListener("deviceorientation", handleOrientation, true);
      }
    };
  }, [isOpen]);

  // Connect active mediaStream directly to video element
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
      const { latitude, longitude, accuracy, altitude, heading } = pos.coords;
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

      if (heading !== null && heading !== undefined && !compassHeading) {
        setCompassHeading(getCardinalDirection(heading));
      }

      setGpsStatus(roundedAcc <= 25 ? "locked" : "acquiring");

      // Calculate nearest district from exact coordinates
      const calculatedDistrict = findNearestDistrict(latitude, longitude);
      setResolvedDistrictName(calculatedDistrict);

      // Reverse geocode exact landmark & locality from OpenStreetMap
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "en" }, signal: controller.signal },
        );
        clearTimeout(timeout);

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
        // Fallback to coordinates
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
  }, [isOpen, compassHeading]);

  // Start Camera Stream with rear-camera prioritization and hardware capability checks
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
          // SAFETY: getCapabilities is a standard MediaStreamTrack method returning hardware features
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
      setMediaStream(null);
    };
  }, [isOpen, activeDeviceIndex]);

  // Flashlight / Torch Toggle
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      const torchConstraint: MediaTrackConstraintSetExtended = { torch: nextState };
      await track.applyConstraints({ advanced: [torchConstraint] });
      setIsTorchOn(nextState);
    } catch {
      // Torch toggle not supported
    }
  };

  // Tap-To-Focus Visual Target
  const handleViewfinderTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y, id: Date.now() });

    if ("vibrate" in navigator) {
      navigator.vibrate(15);
    }

    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      const normX = x / rect.width;
      const normY = y / rect.height;
      try {
        const focusConstraint: MediaTrackConstraintSetExtended = {
          pointsOfInterest: [{ x: normX, y: normY }],
        };
        void track.applyConstraints({ advanced: [focusConstraint] }).catch(() => {});
      } catch {
        // Ignore
      }
    }

    setTimeout(() => {
      setFocusPoint((prev) => (prev?.x === x && prev?.y === y ? null : prev));
    }, 1800);
  };

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

  // Precision Capture Engine: Uses Pure Real GPS Fix
  const capturePhoto = async () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 180);
    if ("vibrate" in navigator) {
      navigator.vibrate([35, 20, 35]);
    }

    try {
      const video = videoRef.current;
      const rawWidth = video.videoWidth || 1280;
      const rawHeight = video.videoHeight || 720;

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

      // Draw the raw camera frame
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

      // Resolve final real-world coordinates from latest hardware GPS lock
      let lat = currentCoords?.lat;
      let lng = currentCoords?.lng;
      let accuracy = currentCoords?.accuracy ?? 0;
      let altitude = currentCoords?.altitude;

      // If coordinates not yet received, attempt one quick synchronous GPS lock
      if (lat === undefined || lng === undefined) {
        try {
          const quickPos = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error("No geolocation"));
              return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 4000,
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

      const locationTitle = resolvedLocationName
        ? `${resolvedLocationName}, ${district}`
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

      // Line 2: Precision GPS Coordinates, Accuracy, Altitude & Compass
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
        if (compassHeading) {
          telemetryParts.push(`Facing: ${compassHeading}`);
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
            heading: compassHeading || undefined,
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

  const handleConfirmPhoto = () => {
    if (stampedPreview) {
      onPhotoCaptured(stampedPreview);
      handleClose();
    }
  };

  const handleRetake = () => {
    if (stampedPreview) {
      URL.revokeObjectURL(stampedPreview.previewUrl);
      setStampedPreview(null);
    }
  };

  if (!isOpen) return null;

  const isLevel = deviceTilt ? Math.abs(deviceTilt.gamma) <= 3 : false;
  const accuracyMeters = currentCoords?.accuracy ?? 99;
  const isHighPrecision = accuracyMeters <= 15;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-4 backdrop-blur-xl">
      <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-black text-white shadow-2xl sm:h-[90vh] sm:rounded-3xl sm:border sm:border-white/15">
        {/* Shutter White Flash Animation */}
        {shutterFlash && (
          <div className="pointer-events-none absolute inset-0 z-50 bg-white transition-opacity duration-150" />
        )}

        {/* Floating Glassmorphic Pro Header Bar */}
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          {/* Brand & Status Pill */}
          <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 backdrop-blur-xl shadow-lg">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-white shadow-xs">
              <Camera className="size-3.5" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-white">Civic GPS Pro</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="text-[0.6875rem] text-amber-400 font-mono font-medium">{clockString} IST</span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {/* Satellite Signal Indicator Pill */}
            {!stampedPreview && cameraStatus === "ready" && (
              <div className="hidden xs:flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 backdrop-blur-xl text-[0.625rem] font-bold text-slate-200 shadow-md">
                <span
                  className={`size-2 rounded-full ${
                    gpsStatus === "locked"
                      ? isHighPrecision
                        ? "bg-ok shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"
                        : "bg-emerald-400"
                      : gpsStatus === "acquiring"
                        ? "bg-amber-400 animate-ping"
                        : "bg-red-400"
                  }`}
                />
                <span className="uppercase tracking-wider">
                  {gpsStatus === "locked" ? `±${accuracyMeters}m` : "Acquiring"}
                </span>
              </div>
            )}

            {/* Flashlight Torch Toggle */}
            {hasTorch && !stampedPreview && cameraStatus === "ready" && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`flex size-9 items-center justify-center rounded-full border border-white/15 backdrop-blur-xl transition-all active:scale-95 cursor-pointer shadow-md ${
                  isTorchOn
                    ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title={isTorchOn ? "Turn off Flashlight" : "Turn on Flashlight"}
              >
                {isTorchOn ? <Zap className="size-4 fill-current" /> : <ZapOff className="size-4" />}
              </button>
            )}

            {/* Flip Camera */}
            {videoDevices.length > 1 && !stampedPreview && (
              <button
                type="button"
                onClick={switchCamera}
                className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20 transition-all active:scale-95 cursor-pointer shadow-md"
                title="Switch Camera"
              >
                <FlipHorizontal className="size-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20 transition-all active:scale-95 cursor-pointer shadow-md"
              title="Close Camera"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Content Area */}
        <div
          className="relative flex-1 bg-black flex items-center justify-center overflow-hidden cursor-crosshair select-none"
          onClick={handleViewfinderTap}
        >
          {stampedPreview ? (
            /* Review Screen with Stamped Watermark */
            <div className="relative size-full flex items-center justify-center bg-slate-950 p-2">
              <img
                src={stampedPreview.previewUrl}
                alt="Stamped Evidence Preview"
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              />
              <div className="absolute top-16 left-4 rounded-full bg-ok/90 px-3.5 py-1 text-xs font-bold text-white shadow-xl backdrop-blur-md flex items-center gap-1.5 border border-white/20">
                <Sparkles className="size-3.5" />
                Verified GPS Watermark Stamped
              </div>
            </div>
          ) : (
            /* Live Camera Stream with Viewfinder HUD */
            <div className="relative size-full flex items-center justify-center">
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
                  <p className="text-xs font-semibold text-slate-300 font-mono tracking-wide">
                    Initializing camera & GPS satellite lock...
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
                  <p className="mt-2 max-w-sm text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
                  <button
                    type="button"
                    className="mt-5 flex h-9 items-center justify-center rounded-xl border border-white/20 bg-white/15 px-5 text-xs font-semibold text-white transition-colors hover:bg-white/25 cursor-pointer"
                    onClick={handleClose}
                  >
                    Close Camera
                  </button>
                </div>
              )}

              {/* Camera Hardware Error */}
              {cameraStatus === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black z-10">
                  <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                    <Info className="size-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">Camera Unavailable</h3>
                  <p className="mt-2 max-w-sm text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
                  <button
                    type="button"
                    className="mt-5 flex h-9 items-center justify-center rounded-xl border border-white/20 bg-white/15 px-5 text-xs font-semibold text-white transition-colors hover:bg-white/25 cursor-pointer"
                    onClick={handleClose}
                  >
                    Close Camera
                  </button>
                </div>
              )}

              {/* Tap-to-Focus Animated Ring */}
              {focusPoint && (
                <div
                  key={focusPoint.id}
                  style={{ top: focusPoint.y - 28, left: focusPoint.x - 28 }}
                  className="pointer-events-none absolute size-14 rounded-xl border-2 border-amber-400 animate-ping opacity-90 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                />
              )}

              {/* Pro Optical Framing Reticle & 4-Corner Surveyor Brackets */}
              {cameraStatus === "ready" && (
                <div className="pointer-events-none absolute inset-5 sm:inset-8">
                  {/* Top-Left Corner Bracket */}
                  <div className="absolute top-0 left-0 size-5 border-t-2 border-l-2 border-white/40 rounded-tl-sm" />
                  {/* Top-Right Corner Bracket */}
                  <div className="absolute top-0 right-0 size-5 border-t-2 border-r-2 border-white/40 rounded-tr-sm" />
                  {/* Bottom-Left Corner Bracket */}
                  <div className="absolute bottom-0 left-0 size-5 border-b-2 border-l-2 border-white/40 rounded-bl-sm" />
                  {/* Bottom-Right Corner Bracket */}
                  <div className="absolute bottom-0 right-0 size-5 border-b-2 border-r-2 border-white/40 rounded-br-sm" />

                  {/* 3x3 Rule-of-Thirds Grid */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
                    <div className="border-r border-b border-white/60" />
                    <div className="border-r border-b border-white/60" />
                    <div className="border-b border-white/60" />
                    <div className="border-r border-b border-white/60" />
                    <div className="border-r border-b border-white/60" />
                    <div className="border-b border-white/60" />
                    <div className="border-r border-white/60" />
                    <div className="border-r border-white/60" />
                    <div />
                  </div>

                  {/* Center Survey Crosshair & Concentric Reticle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <div className={`size-16 rounded-full border transition-all duration-200 flex items-center justify-center ${
                      isLevel && isHighPrecision
                        ? "border-ok/90 scale-105 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                        : "border-white/30"
                    }`}>
                      <div className="relative size-full flex items-center justify-center">
                        {/* Micro Crosshair lines */}
                        <div className="absolute h-2.5 w-0.5 bg-white/50 -top-1" />
                        <div className="absolute h-2.5 w-0.5 bg-white/50 -bottom-1" />
                        <div className="absolute w-2.5 h-0.5 bg-white/50 -left-1" />
                        <div className="absolute w-2.5 h-0.5 bg-white/50 -right-1" />
                        <div
                          className={`size-2 rounded-full transition-colors ${
                            isLevel && isHighPrecision
                              ? "bg-ok shadow-[0_0_8px_rgba(16,185,129,1)]"
                              : "bg-accent"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Electronic Spirit Level (Horizon & Roll Indicator) */}
                  {deviceTilt && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 flex items-center justify-between pointer-events-none">
                      <div
                        className={`h-0.5 w-16 rounded-full transition-all duration-150 ${
                          isLevel
                            ? "bg-ok shadow-[0_0_8px_rgba(16,185,129,1)] scale-x-110"
                            : "bg-white/35"
                        }`}
                        style={{ transform: `rotate(${deviceTilt.gamma * 0.6}deg)` }}
                      />
                      {isLevel && (
                        <span className="rounded-full bg-ok/90 px-2 py-0.5 text-[0.5625rem] font-mono font-bold text-white shadow-md uppercase tracking-wider backdrop-blur-xs">
                          Level
                        </span>
                      )}
                      <div
                        className={`h-0.5 w-16 rounded-full transition-all duration-150 ${
                          isLevel
                            ? "bg-ok shadow-[0_0_8px_rgba(16,185,129,1)] scale-x-110"
                            : "bg-white/35"
                        }`}
                        style={{ transform: `rotate(${deviceTilt.gamma * 0.6}deg)` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Floating Pro Civic Telemetry HUD Card */}
              {cameraStatus === "ready" && (
                <div className="pointer-events-none absolute bottom-28 inset-x-3 sm:inset-x-4 flex flex-col gap-2 z-20">
                  <div className="self-start w-full max-w-lg rounded-2xl border border-white/20 bg-black/80 p-3.5 backdrop-blur-2xl shadow-2xl">
                    {/* Top Status Strip */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${
                            accuracyMeters <= 8
                              ? "bg-ok shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"
                              : accuracyMeters <= 20
                                ? "bg-emerald-400"
                                : accuracyMeters <= 35
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                          }`}
                        />
                        <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-200">
                          {gpsStatus === "locked"
                            ? `GNSS Satellite Fix (±${accuracyMeters}m)`
                            : gpsStatus === "acquiring"
                              ? "Acquiring Satellites..."
                              : "Manual District Anchor"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {compassHeading && (
                          <span className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[0.625rem] font-mono font-bold text-slate-200">
                            <Compass className="size-3 text-accent" />
                            {compassHeading}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Landmark & Cadastral Area Title */}
                    <div className="mt-2 flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-accent/20 text-accent mt-0.5">
                        <MapPin className="size-3" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate tracking-tight">
                          {resolvedLocationName || "Detecting Street / Landmark..."}
                        </p>
                        <p className="text-[0.6875rem] font-medium text-slate-300">
                          {resolvedDistrictName || defaultDistrict || "Andhra Pradesh"}
                          {defaultConstituency ? ` · ${defaultConstituency} A.C.` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Geotag Telemetry Metrics Strip */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg bg-white/5 px-2.5 py-1.5 font-mono text-[0.6875rem] text-slate-300 border border-white/5">
                      <span className="text-slate-100 font-semibold">
                        {currentCoords
                          ? `${currentCoords.lat.toFixed(6)}° N, ${currentCoords.lng.toFixed(6)}° E`
                          : "Synchronizing GPS..."}
                      </span>
                      {plusCodeString && (
                        <span className="text-amber-400 font-bold">· {plusCodeString}</span>
                      )}
                      {currentCoords?.altitude !== undefined && (
                        <span className="text-slate-400">· Alt: {currentCoords.altitude}m MSL</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pro Camera Footer Action Bar */}
        <div className="z-30 flex items-center justify-between border-t border-white/10 bg-gradient-to-t from-black via-black/95 to-black/80 p-4 sm:p-5 backdrop-blur-xl">
          {stampedPreview ? (
            /* Review Actions */
            <div className="flex w-full items-center justify-between gap-4 max-w-lg mx-auto">
              <button
                type="button"
                onClick={handleRetake}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/20 active:scale-95 cursor-pointer shadow-md"
              >
                <RotateCcw className="size-4.5" />
                Retake Photo
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ok px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:bg-ok/90 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer"
              >
                <Check className="size-4.5" />
                Use Stamped Photo
              </button>
            </div>
          ) : cameraStatus === "ready" ? (
            /* Pro 3-Ring Shutter Button */
            <div className="flex w-full flex-col items-center justify-center gap-2 relative">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={isProcessing}
                className={`group relative flex size-20 items-center justify-center rounded-full p-1.5 transition-all duration-200 active:scale-90 disabled:opacity-50 cursor-pointer ${
                  isHighPrecision
                    ? "border-2 border-ok/80 bg-ok/10 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                    : "border-2 border-white/60 bg-white/10 shadow-lg shadow-white/10"
                }`}
                title="Capture GPS Evidence Photo"
              >
                {/* Outer concentric decorative ring */}
                <span className="size-full rounded-full border-2 border-white/40 group-hover:border-white/80 transition-colors p-1 flex items-center justify-center">
                  {/* Inner Solid White Shutter Face */}
                  <span className="size-full rounded-full bg-white group-hover:bg-slate-100 transition-colors shadow-inner flex items-center justify-center" />
                </span>

                {isProcessing && (
                  <Loader2 className="absolute size-8 animate-spin text-accent" />
                )}
              </button>
              <span className="text-[0.625rem] font-bold uppercase tracking-widest text-slate-400 font-mono">
                Tap Shutter to Stamp Evidence
              </span>
            </div>
          ) : (
            <div className="flex w-full justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/20 cursor-pointer"
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
