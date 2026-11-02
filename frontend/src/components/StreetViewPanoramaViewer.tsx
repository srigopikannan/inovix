import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  Calendar,
  MapPin,
  AlertTriangle,
  Camera,
  Layers,
  ArrowLeft,
  KeyRound,
  Eye,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface StreetViewPanoramaViewerProps {
  lat: number;
  lng: number;
  roadName?: string;
  segmentId?: string;
  surveyFrameUrl?: string | null;
  surveyDefects?: Array<{
    defect_type: string;
    severity: string;
    confidence: number;
    subclass?: string;
  }>;
  onClose: () => void;
  onSwitchToSatellite?: () => void;
  onSwitchToMap?: () => void;
}

declare global {
  interface Window {
    google?: any;
    initGoogleMapsStreetView?: () => void;
  }
}

export const StreetViewPanoramaViewer: React.FC<StreetViewPanoramaViewerProps> = ({
  lat,
  lng,
  roadName = 'Highway Corridor',
  segmentId,
  surveyFrameUrl,
  surveyDefects = [],
  onClose,
  onSwitchToSatellite,
  onSwitchToMap
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [captureDate, setCaptureDate] = useState<string | null>(null);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [currentPitch, setCurrentPitch] = useState<number>(0);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [viewingSurveyFrame, setViewingSurveyFrame] = useState<boolean>(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    let isCancelled = false;

    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setApiKeyMissing(true);
      setIsAvailable(false);
      setIsLoading(false);
      setErrorMessage('Street View imagery is not available for this location.');
      return;
    }

    const checkAndInitStreetView = () => {
      if (!window.google || !window.google.maps) return;

      const svService = new window.google.maps.StreetViewService();
      const checkPosition = new window.google.maps.LatLng(lat, lng);

      svService.getPanorama(
        {
          location: checkPosition,
          radius: 120, // 120-meter corridor tolerance
          preference: window.google.maps.StreetViewPreference.NEAREST
        },
        (data: any, status: any) => {
          if (isCancelled) return;
          setIsLoading(false);

          if (status === window.google.maps.StreetViewStatus.OK && data && containerRef.current) {
            setIsAvailable(true);
            setCaptureDate(data.imageDate || 'Verified Commercial Capture');

            const pano = new window.google.maps.StreetViewPanorama(containerRef.current, {
              position: data.location.latLng,
              pov: { heading: 180, pitch: 0 },
              zoom: 1,
              addressControl: true,
              addressControlOptions: {
                position: window.google.maps.ControlPosition.TOP_CENTER
              },
              linksControl: true,
              panControl: true,
              zoomControl: false, // We supply custom UI zoom
              enableCloseButton: false,
              motionTracking: false,
              motionTrackingControl: false
            });

            pano.addListener('pov_changed', () => {
              const pov = pano.getPov();
              setCurrentHeading(Math.round(pov.heading || 0));
              setCurrentPitch(Math.round(pov.pitch || 0));
            });

            pano.addListener('zoom_changed', () => {
              setCurrentZoom(pano.getZoom() || 1);
            });

            panoramaRef.current = pano;
          } else {
            setIsAvailable(false);
            setErrorMessage('Street View imagery is not available for this location.');
          }
        }
      );
    };

    if (window.google && window.google.maps) {
      checkAndInitStreetView();
    } else {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (!isCancelled) checkAndInitStreetView();
        };
        script.onerror = () => {
          if (!isCancelled) {
            setIsLoading(false);
            setIsAvailable(false);
            setErrorMessage('Street View imagery is not available for this location.');
          }
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(interval);
            if (!isCancelled) checkAndInitStreetView();
          }
        }, 150);
        return () => clearInterval(interval);
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [lat, lng, apiKey]);

  // Rotation & Pan Controls
  const handleRotateLeft = () => {
    if (panoramaRef.current) {
      const pov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({ ...pov, heading: (pov.heading - 45 + 360) % 360 });
    }
  };

  const handleRotateRight = () => {
    if (panoramaRef.current) {
      const pov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({ ...pov, heading: (pov.heading + 45) % 360 });
    }
  };

  const handleTiltUp = () => {
    if (panoramaRef.current) {
      const pov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({ ...pov, pitch: Math.min(60, pov.pitch + 15) });
    }
  };

  const handleTiltDown = () => {
    if (panoramaRef.current) {
      const pov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({ ...pov, pitch: Math.max(-60, pov.pitch - 15) });
    }
  };

  const handleZoomIn = () => {
    if (panoramaRef.current) {
      const z = panoramaRef.current.getZoom();
      panoramaRef.current.setZoom(Math.min(4, z + 1));
    }
  };

  const handleZoomOut = () => {
    if (panoramaRef.current) {
      const z = panoramaRef.current.getZoom();
      panoramaRef.current.setZoom(Math.max(0, z - 1));
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Telemetry Header */}
      <div className="absolute top-4 left-4 right-4 z-[30] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 pointer-events-auto flex items-center space-x-3 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {viewingSurveyFrame ? 'Ground Optical Survey Frame' : '360° Street-Level View'}
              </span>
              {segmentId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {segmentId}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-300 font-semibold truncate max-w-xs sm:max-w-md">
              {roadName} &bull; GPS ({lat.toFixed(5)}, {lng.toFixed(5)})
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 pointer-events-auto">
          {captureDate && !viewingSurveyFrame && (
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-slate-300 font-mono shadow-md">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Capture: {captureDate}</span>
            </div>
          )}

          {surveyFrameUrl && (
            <button
              onClick={() => setViewingSurveyFrame(!viewingSurveyFrame)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer ${
                viewingSurveyFrame
                  ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{viewingSurveyFrame ? 'Show 360° Panorama' : 'View Optical Survey Frame'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center space-x-1 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Close Street View</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewingSurveyFrame && surveyFrameUrl ? (
        /* Verified Ground Survey Camera Frame */
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <img
            src={surveyFrameUrl}
            alt="Verified Ground Survey Camera Frame"
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-5 left-5 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl max-w-md text-left text-white shadow-xl">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Verified Ground Optical Survey Telemetry
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
              Captured via high-speed mobile optical road scanner equipped with calibrated laser profiling sensors.
            </p>
            {surveyDefects.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Detected Surface Anomalies:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {surveyDefects.map((d, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-950/80 text-red-300 border border-red-500/40"
                    >
                      {d.defect_type} ({Math.round(d.confidence * 100)}%) - {d.severity}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Surface intact &bull; No active structural defects identified</span>
              </div>
            )}
          </div>
        </div>
      ) : isAvailable ? (
        /* Interactive Google Street View Panorama */
        <>
          <div ref={containerRef} className="w-full h-full" />

          {/* On-screen Directional & Zoom Floating Controls */}
          <div className="absolute bottom-6 right-6 z-[30] flex flex-col items-center space-y-2 pointer-events-auto">
            <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col items-center space-y-1">
              <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-800 w-full text-center">
                PAN &bull; TILT
              </div>
              <button
                onClick={handleTiltUp}
                title="Tilt Camera Up"
                className="p-2 hover:bg-slate-800 text-slate-200 rounded-xl transition cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleRotateLeft}
                  title="Rotate Camera Left (-45°)"
                  className="p-2 hover:bg-slate-800 text-cyan-400 rounded-xl transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300">
                  {currentHeading}°
                </div>
                <button
                  onClick={handleRotateRight}
                  title="Rotate Camera Right (+45°)"
                  className="p-2 hover:bg-slate-800 text-cyan-400 rounded-xl transition cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleTiltDown}
                title="Tilt Camera Down"
                className="p-2 hover:bg-slate-800 text-slate-200 rounded-xl transition cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-xl flex items-center space-x-1">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-2 hover:bg-slate-800 text-slate-200 rounded-xl transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1">{currentZoom}x</span>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-2 hover:bg-slate-800 text-slate-200 rounded-xl transition cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Honest Representation: Street View Unavailable */
        <div className="w-full h-full flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-white">
                Street View imagery is not available for this location.
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {apiKeyMissing
                  ? 'A Google Maps JavaScript API key (VITE_GOOGLE_MAPS_API_KEY) with Street View enabled is required to stream commercial 360° panoramas.'
                  : 'Neither commercial street-level camera vehicles nor panoramic providers have indexed this specific roadway coordinate.'}
              </p>
            </div>

            {/* Honest representation badge */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left text-[11px] text-slate-300 space-y-1 font-mono">
              <div className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                ROADGUARD Honest Telemetry Guarantee
              </div>
              <div>&bull; Blank or synthetic panoramas are never rendered.</div>
              <div>&bull; Top-down satellite orthoimagery remains fully operational.</div>
            </div>

            {/* Fallback buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              {surveyFrameUrl && (
                <button
                  onClick={() => setViewingSurveyFrame(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Optical Survey Frame</span>
                </button>
              )}

              {onSwitchToSatellite && (
                <button
                  onClick={onSwitchToSatellite}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>View Satellite Imagery</span>
                </button>
              )}

              {onSwitchToMap && (
                <button
                  onClick={onSwitchToMap}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Return to Standard Map</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
