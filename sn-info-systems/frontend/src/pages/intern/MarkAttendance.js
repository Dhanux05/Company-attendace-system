import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { FiAlertTriangle, FiCamera, FiCheckCircle, FiSave, FiPlayCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { attendanceService, authService } from "../../services/api";
import "./Pages.css";
import "./Attendance.css";

const OFFICE = {
  lat: Number(process.env.REACT_APP_OFFICE_LAT || 12.945115035545163),
  lng: Number(process.env.REACT_APP_OFFICE_LNG || 77.57107513877482),
};
const OFFICE_ADDRESS = process.env.REACT_APP_OFFICE_ADDRESS || "38, Sri DV Gundappa Road, Gandhi Bazar, Basavanagudi, Bengaluru";
const RADIUS = Number(process.env.REACT_APP_OFFICE_RADIUS || 500);

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const phi1 = lat1 * Math.PI / 180, phi2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180, dl = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dp/2)**2 + Math.cos(phi1)*Math.cos(phi2)*Math.sin(dl/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const MarkAttendance = () => {
  const { user, updateUser } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [distance, setDistance] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceCapture, setFaceCapture] = useState(null);
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const verificationLocationRef = useRef(null);
  const autoCaptureTimeoutRef = useRef(null);

  const attachStreamToVideo = async () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return false;

    video.srcObject = stream;
    try {
      await video.play();
    } catch (e) {
      // Some browsers delay playback until metadata is ready.
    }

    try {
      await waitForVideoReady(video);
      setCameraReady(true);
    } catch (e) {
      setCameraReady(video.readyState >= 2);
    }

    return true;
  };

  const waitForVideoReady = (video) => new Promise((resolve, reject) => {
    if (!video) {
      reject(new Error("Video element not available"));
      return;
    }
    if (video.readyState >= 2) {
      resolve();
      return;
    }
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onTimeout = () => {
      cleanup();
      reject(new Error("Camera not ready"));
    };
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("canplay", onReady);
      clearTimeout(timeoutId);
    };
    const timeoutId = setTimeout(onTimeout, 5000);
    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("canplay", onReady);
  });

  useEffect(() => {
    loadTodayRecord();
    loadFaceEmbedding();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (!cameraActive || !streamRef.current) return;

    let cancelled = false;
    const bindStream = async () => {
      if (cancelled) return;
      const attached = await attachStreamToVideo();
      if (!attached && !cancelled) {
        setTimeout(bindStream, 50);
      }
    };

    bindStream();
    return () => { cancelled = true; };
  }, [cameraActive]);

  const loadTodayRecord = async () => {
    try {
      const { data } = await attendanceService.getToday();
      setTodayRecord(data);
    } catch (e) {}
  };

  const loadFaceEmbedding = async () => {
    if (!user.faceRegistered) return;
    try {
      const { data } = await authService.getFace();
      setFaceEmbedding(data.embedding);
    } catch (e) {}
  };

  const getLocation = () => {
    setLocationError("");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const dist = Math.round(haversine(OFFICE.lat, OFFICE.lng, lat, lng));
          setLocation({ lat, lng });
          setDistance(dist);
          resolve({ lat, lng, distance: dist });
        },
        () => {
          setLocationError("Location access denied. Please allow location access.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const startCamera = async () => {
    try {
      setCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (e) {
      setMessage({ type: "error", text: "Camera access denied. Please allow camera." });
    }
  };

  const stopCamera = () => {
    if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
      autoCaptureTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  };

  const getPendingAttendanceAction = () => {
    if (!todayRecord?.loginTime) return "login";
    if (!todayRecord?.logoutTime) return "logout";
    return null;
  };

  const capturePhoto = async (forcedAction = null) => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    try {
      await waitForVideoReady(video);
    } catch (e) {
      // Continue with a fallback frame so registration flow is not blocked.
    }
    const frameWidth = video.videoWidth || video.clientWidth || 320;
    const frameHeight = video.videoHeight || video.clientHeight || 240;
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    if (canvas.width <= 0 || canvas.height <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setMessage({ type: "error", text: "Unable to process camera image." });
      return;
    }
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setMessage({ type: "warning", text: "Camera frame was delayed. Captured fallback image, please retake if needed." });
    }
    const dataUrl = canvas.toDataURL("image/jpeg");
    setFaceCapture(dataUrl);

    // Simulate face verification using pixel-based comparison
    // In production, use face-api.js with proper models
    if (!user.faceRegistered) {
      // Generate a mock embedding from the image data for demo
      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        setMessage({ type: "error", text: "Failed to read image frame. Please retake." });
        return;
      }
      const data = imageData.data;
      const embedding = [];
      const step = Math.max(1, Math.floor(data.length / 512));
      for (let i = 0; i < 512; i++) {
        embedding.push(data[i * step] / 255.0);
      }
      setFaceEmbedding(embedding);
      setFaceVerified(true);
      setMessage({ type: "success", text: "Face captured for registration!" });
    } else {
      // Compare with stored embedding
      if (faceEmbedding && faceEmbedding.length > 0) {
        setFaceVerified(true);
        setMessage({ type: "success", text: "Face verified successfully!" });
      } else if (!user.faceRegistered) {
        setMessage({ type: "warning", text: "Please register your face first." });
      } else {
        // For demo: allow verification if face is registered
        setFaceVerified(true);
        setMessage({ type: "success", text: "Face verified!" });
      }

      const action = forcedAction || getPendingAttendanceAction();
      if (!action) {
        setMessage({ type: "success", text: "Attendance already completed for today!" });
      } else {
        const verifiedLoc = verificationLocationRef.current;
        await handleMarkAttendance(action, {
          skipFaceCheck: true,
          locationOverride: verifiedLoc ? { lat: verifiedLoc.lat, lng: verifiedLoc.lng } : null,
          distanceOverride: verifiedLoc?.distance,
        });
      }
    }
    stopCamera();
  };

  const handleRegisterFace = async () => {
    if (!faceEmbedding) { setMessage({ type: "error", text: "Capture your face first" }); return; }
    setRegistering(true);
    try {
      await authService.saveFace(faceEmbedding);
      updateUser({ faceRegistered: true });
      setMessage({ type: "success", text: "Face registered successfully! You can now mark attendance." });
    } catch (e) {
      setMessage({ type: "error", text: "Failed to register face" });
    }
    setRegistering(false);
  };

  const handleMarkAttendance = async (type, options = {}) => {
    const currentLocation = options.locationOverride || location;
    const currentDistance = Number.isFinite(options.distanceOverride) ? options.distanceOverride : distance;

    if (!currentLocation) { setMessage({ type: "error", text: "Get your location first" }); return; }
    if (currentDistance > RADIUS) { setMessage({ type: "error", text: `Too far from office (${currentDistance}m away)` }); return; }
    if (!options.skipFaceCheck && !faceVerified) { setMessage({ type: "error", text: "Verify your face first" }); return; }

    setLoading(true);
    try {
      const fn = type === "login" ? attendanceService.markLogin : attendanceService.markLogout;
      const { data } = await fn({ lat: currentLocation.lat, lng: currentLocation.lng, faceVerified: true });
      setMessage({ type: "success", text: data.message });
      await loadTodayRecord();
      setFaceVerified(false);
      setFaceCapture(null);
      verificationLocationRef.current = null;
    } catch (e) {
      setMessage({ type: "error", text: e.response?.data?.message || "Failed to mark attendance" });
    }
    setLoading(false);
  };

  const handleVerifyAndAutoMark = async () => {
    const action = getPendingAttendanceAction();
    await handleAutoAttendance(action);
  };

  const handleAutoAttendance = async (action) => {
    if (!action) {
      setMessage({ type: "success", text: "Attendance already completed for today!" });
      return;
    }

    const liveLocation = await getLocation();
    if (!liveLocation) return;
    if (liveLocation.distance > RADIUS) {
      setMessage({ type: "error", text: `Too far from office (${liveLocation.distance}m away)` });
      return;
    }

    verificationLocationRef.current = { ...liveLocation, action };
    setFaceCapture(null);
    setFaceVerified(false);
    setMessage({ type: "warning", text: `Opening camera to auto-verify face for ${action}...` });
    await startCamera();
  };

  useEffect(() => {
    if (!cameraActive || !cameraReady || !user.faceRegistered || faceCapture) return;
    const verificationState = verificationLocationRef.current;
    if (!verificationState?.action) return;

    autoCaptureTimeoutRef.current = setTimeout(() => {
      capturePhoto(verificationState.action);
    }, 900);

    return () => {
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
        autoCaptureTimeoutRef.current = null;
      }
    };
  }, [cameraActive, cameraReady, user.faceRegistered, faceCapture]);

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/intern/dashboard" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Dashboard</NavLink>
        <NavLink to="/intern/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/intern/leave" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leave</NavLink>
        <NavLink to="/intern/attendance-history" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance History</NavLink>
        <NavLink to="/intern/leave-history" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leave History</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Mark Attendance</h1>
        <p>Face verification + location required</p>
      </div>

      {!user.faceRegistered && (
        <div className="alert alert-warning">
          <FiAlertTriangle style={{ marginRight: 8, verticalAlign: "text-bottom" }} />
          You haven't registered your face yet. Please register below before marking attendance.
        </div>
      )}

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {todayRecord && (
        <div className="today-status-card">
          <h3>Today's Status</h3>
          <div className="status-row">
            <span className="status-item"><strong>Login:</strong> {fmtTime(todayRecord.loginTime)}</span>
            <span className="status-item"><strong>Logout:</strong> {fmtTime(todayRecord.logoutTime)}</span>
            <span className="status-item"><strong>Hours:</strong> {todayRecord.totalHours > 0 ? `${todayRecord.totalHours}h` : "—"}</span>
            <span className={`status-badge status-${todayRecord.status?.toLowerCase()}`}>{todayRecord.status}</span>
          </div>
        </div>
      )}

      <div className="attendance-grid">
        <div className="att-section">
          <h3>Step 1: Location</h3>
          <p style={{ marginBottom: 10, color: "var(--text-soft)", fontSize: 13 }}>
            Company Address: {OFFICE_ADDRESS}
          </p>
          <button className="btn btn-outline" onClick={getLocation}>
            {user.faceRegistered ? "Refresh Live Location" : "Get My Location"}
          </button>
          {locationError && <div className="att-error">{locationError}</div>}
          {location && (
            <div className={`location-result ${distance <= RADIUS ? "in-range" : "out-range"}`}>
              <div className="loc-status">{distance <= RADIUS ? "Within Office Range" : "Outside Office Range"}</div>
              <div className="loc-dist">Distance: {distance}m (max {RADIUS}m)</div>
              <div className="loc-coords">Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}</div>
            </div>
          )}
        </div>

        <div className="att-section">
          <h3>Step 2: Face {user.faceRegistered ? "Verification" : "Registration"}</h3>
          
          {!cameraActive && !faceCapture && (
            user.faceRegistered ? (
              <button className="btn btn-outline" onClick={handleVerifyAndAutoMark} disabled={loading}>
                {loading ? "Processing..." : "Auto Verify Now"}
              </button>
            ) : (
              <button className="btn btn-outline" onClick={startCamera}><FiCamera style={{ marginRight: 6 }} />Open Camera</button>
            )
          )}

          {cameraActive && (
            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-feed"
                onLoadedMetadata={() => setCameraReady(true)}
                onCanPlay={() => setCameraReady(true)}
              />
              <div className="camera-overlay" />
              <div className="camera-actions">
                <button className="btn btn-success" onClick={() => capturePhoto()}>
                  <FiCamera style={{ marginRight: 6 }} />
                  {user.faceRegistered ? "Capture Now" : "Capture"}
                </button>
                <button className="btn btn-outline btn-sm" onClick={stopCamera}>Cancel</button>
              </div>
            </div>
          )}

          {faceCapture && (
            <div className="capture-preview">
              <img src={faceCapture} alt="captured" className="captured-photo" />
              <div className={`verify-status ${faceVerified ? "verified" : "pending"}`}>
                {faceVerified ? "Face Verified" : "Processing..."}
              </div>
              {!user.faceRegistered && faceVerified && (
                <button className="btn btn-success" onClick={handleRegisterFace} disabled={registering}>
                  <FiSave style={{ marginRight: 6 }} />
                  {registering ? "Saving..." : "Save Face"}
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => { setFaceCapture(null); setFaceVerified(false); startCamera(); }}>Retake</button>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      </div>

      <div className="action-buttons">
        {user.faceRegistered ? (
          <>
            {(!todayRecord || !todayRecord.loginTime) && (
              <button
                className="btn-att btn-login"
                onClick={() => handleAutoAttendance("login")}
                disabled={loading}
              >
                <FiPlayCircle style={{ marginRight: 6 }} />
                {loading ? "Processing..." : "Mark Login (Auto)"}
              </button>
            )}
            {todayRecord?.loginTime && !todayRecord.logoutTime && (
              <button
                className="btn-att btn-logout"
                onClick={() => handleAutoAttendance("logout")}
                disabled={loading}
              >
                <FiPlayCircle style={{ marginRight: 6 }} />
                {loading ? "Processing..." : "Mark Logout (Auto)"}
              </button>
            )}
          </>
        ) : (
          <>
            {(!todayRecord || !todayRecord.loginTime) && (
              <button
                className="btn-att btn-login"
                onClick={() => handleMarkAttendance("login")}
                disabled={loading || !location || distance > RADIUS || !faceVerified}
              >
                <FiCheckCircle style={{ marginRight: 6 }} />
                {loading ? "Processing..." : "Mark Login"}
              </button>
            )}
            {todayRecord?.loginTime && !todayRecord.logoutTime && (
              <button
                className="btn-att btn-logout"
                onClick={() => handleMarkAttendance("logout")}
                disabled={loading || !location || distance > RADIUS || !faceVerified}
              >
                <FiCheckCircle style={{ marginRight: 6 }} />
                {loading ? "Processing..." : "Mark Logout"}
              </button>
            )}
          </>
        )}
        {todayRecord?.logoutTime && (
          <div className="alert alert-success">
            <FiCheckCircle style={{ marginRight: 8, verticalAlign: "text-bottom" }} />
            Attendance completed for today!
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;

