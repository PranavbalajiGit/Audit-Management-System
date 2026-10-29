import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auditService } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue in React
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ORIENTATIONS_BY_CATEGORY = {
  'Guest House': [
    { value: 'Room Entrance & Door Sign', label: 'Room Entrance & Door Sign' },
    { value: 'Wide Angle Guest Room', label: 'Wide Angle Guest Room View' },
    { value: 'Bed & Linens Quality', label: 'Bed & Linens Quality View' },
    { value: 'Attached Bathroom & Sanitation', label: 'Attached Bathroom & Sanitation' },
    { value: 'AC & Room Amenities', label: 'AC, TV & Electrical Amenities' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'COE Office': [
    { value: 'Office Entrance & Security Door', label: 'Office Entrance & Security Door' },
    { value: 'Wide Angle Office Layout', label: 'Wide Angle Office Layout' },
    { value: 'Confidential Record Almirah', label: 'Confidential Record Almirah / Safe' },
    { value: 'CCTV Camera Surveillance', label: 'CCTV Camera & Coverage View' },
    { value: 'Exam Server & Workstation', label: 'Admin Workstation & Server Desk' },
    { value: 'Paper Shredder & Hardware', label: 'Paper Shredder & Document Hardware' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'Research and Development Centre': [
    { value: 'R&D Centre Entrance & Sign', label: 'R&D Centre Entrance & Safety Sign' },
    { value: 'Wide Angle Lab & Facility', label: 'Wide Angle Lab & Facility View' },
    { value: 'Precision Test Bench', label: 'Precision Test Bench (Oscilloscope/Tools)' },
    { value: 'Prototyping & 3D Printing Bay', label: 'Prototyping Bay / 3D Printer View' },
    { value: 'Emergency Shutoff & PPE Rack', label: 'Emergency Power Shutoff & Safety Gear' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'Medical Centre': [
    { value: 'Clinic Entrance & Reception', label: 'Medical Centre Entrance & Desk' },
    { value: 'Wide Angle Infirmary View', label: 'Wide Angle Clinic / Ward View' },
    { value: 'Patient Examination Bed', label: 'Patient Bed & Sanitation Setup' },
    { value: 'Locked Medicine Almirah', label: 'First Aid Kit & Locked Medicine Almirah' },
    { value: 'Diagnostic & Oxygen Equipment', label: 'Vital Signs / Oxygen Equipment' },
    { value: 'Bio-Medical Waste Bins', label: 'Color-Coded Bio-Waste Bins' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'Radio Station': [
    { value: 'Studio Entrance & ON AIR Sign', label: 'Studio Entrance & "ON AIR" Sign' },
    { value: 'Wide Angle Studio View', label: 'Wide Angle Broadcast Studio View' },
    { value: 'Audio Mixing Console', label: 'Broadcast Audio Mixing Console' },
    { value: 'Microphones & Boom Mounts', label: 'Studio Microphones & Boom Mounts' },
    { value: 'Acoustic Soundproofing Wall', label: 'Soundproofing Acoustic Wall Panels' },
    { value: 'Transmission / Server Rack', label: 'Transmission & Monitoring Rack' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'Classroom': [
    { value: 'Room Entrance & Signboard', label: 'Room Entrance & Signboard' },
    { value: 'Wide Angle Classroom View', label: 'Wide Angle Classroom View' },
    { value: 'Whiteboard & Podium View', label: 'Whiteboard / Blackboard & Podium' },
    { value: 'Student Benches & Desks', label: 'Student Benches & Desks' },
    { value: 'Ceiling Projector & Electricals', label: 'Ceiling Projector & Electricals' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'Laboratory': [
    { value: 'Lab Entrance & Safety Signage', label: 'Lab Entrance & Safety Signage' },
    { value: 'Wide Angle Workstation View', label: 'Wide Angle Workstation View' },
    { value: 'Computer Terminals & Monitors', label: 'Computer Terminals & Monitors' },
    { value: 'Networking & Server Rack', label: 'Networking Equipment / Server Rack' },
    { value: 'Safety Extinguisher & First Aid', label: 'Fire Extinguisher & Safety Chart' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'Hostel': [
    { value: 'Room Entrance & Door Sign', label: 'Room Entrance & Door Sign' },
    { value: 'Wide Angle Room View', label: 'Wide Angle Room View' },
    { value: 'Beds & Mattresses Condition', label: 'Beds & Mattresses Condition' },
    { value: 'Study Desks & Cupboards', label: 'Personal Desks & Cupboards' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'Library': [
    { value: 'Library Entrance & Turnstile', label: 'Library Entrance & Turnstile' },
    { value: 'Wide Angle Book Stacks', label: 'Wide Angle Stacks & Book Racks' },
    { value: 'Reading Tables & Seating', label: 'Reading Zone & Study Desks' },
    { value: 'Circulation Desk & System', label: 'Circulation Desk & Cataloguing PC' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'Office': [
    { value: 'Office Entrance & Nameplate', label: 'Office Entrance & Nameplate' },
    { value: 'Wide Angle Office Layout', label: 'Wide Angle Office Layout' },
    { value: 'Desk & Workstation Setup', label: 'Executive / Staff Desk Setup' },
    { value: 'Filing Cabinets & Storage', label: 'Filing Cabinets & Storage' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
  'Other': [
    { value: 'Room Entrance View', label: 'Room Entrance (with Signboard)' },
    { value: 'Wide Angle Room View', label: 'Wide Angle Room View' },
    { value: 'Key Asset Highlight View', label: 'Key Asset Highlight View' },
    { value: 'Other Perspective', label: 'Other Perspective' },
  ],
};

const AuditSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // QR state
  const [qrToken, setQrToken] = useState('');
  const [qrVerifying, setQrVerifying] = useState(false);
  const [qrError, setQrError] = useState('');

  // GPS state
  const [gpsLoc, setGpsLoc] = useState(null);
  const [gpsVerifying, setGpsVerifying] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Image Upload state
  const currentRoomType = audit?.roomId?.roomType || 'Other';
  const categoryOrientations = ORIENTATIONS_BY_CATEGORY[currentRoomType] || ORIENTATIONS_BY_CATEGORY['Other'];

  const [uploading, setUploading] = useState(false);
  const [imageType, setImageType] = useState('Wide Angle Room View');
  const [uploadError, setUploadError] = useState('');
  const [testBypass, setTestBypass] = useState(false);

  // Sync default imageType when room loads
  useEffect(() => {
    if (categoryOrientations && categoryOrientations.length > 0) {
      const exists = categoryOrientations.some(opt => opt.value === imageType);
      if (!exists) {
        setImageType(categoryOrientations[0].value);
      }
    }
  }, [currentRoomType]);
  
  // Live Camera state
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [streamActive, setStreamActive] = useState(false);

  // Checklist state
  const [checklistAnswers, setChecklistAnswers] = useState({});

  // AI state
  const [aiRunning, setAiRunning] = useState(false);
  const [aiAnswers, setAiAnswers] = useState({}); // { [question]: answerText }
  const [aiError, setAiError] = useState('');
  const [aiMeta, setAiMeta] = useState(null); // { provider, model } of the last VLM run

  // Final submit state
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAuditDetails();
    return () => {
      stopCamera();
    };
  }, [id]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setStreamActive(false);
    }
  };

  const startCamera = async () => {
    setUploadError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStreamActive(true);
      
      // Wait for React to render the conditionally rendered <video> element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      setUploadError('Failed to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const handleLiveCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setUploadError('Failed to capture image.');
        return;
      }
      const file = new File([blob], 'live-capture.jpg', { type: 'image/jpeg' });
      setUploading(true);
      setUploadError('');

      const lat = gpsLoc?.latitude || audit?.gpsData?.latitude;
      const lng = gpsLoc?.longitude || audit?.gpsData?.longitude;

      try {
        const updatedImages = await auditService.uploadImage(id, file, imageType, lat, lng, true, testBypass);
        setAudit(prev => ({ ...prev, images: updatedImages, aiAnalysis: null, verificationAnswers: [] }));
        setAiAnswers({});
        stopCamera();
      } catch (err) {
        setUploadError(err.message || 'Failed to upload captured image.');
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg', 0.85);
  };

  const fetchAuditDetails = async () => {
    try {
      setLoading(true);
      const data = await auditService.getAudit(id);
      setAudit(data);
      
      // Seed checklist answers if already exist
      if (data.checklistAnswers && data.checklistAnswers.length > 0) {
        const answersObj = {};
        data.checklistAnswers.forEach(ans => {
          answersObj[ans.questionId] = ans.answer;
        });
        setChecklistAnswers(answersObj);
      } else {
        // Init checklist answers with empty values or defaults
        const template = data.assignmentId?.checklistId;
        if (template && template.items) {
          const initAnswers = {};
          template.items.forEach(item => {
            initAnswers[item._id] = item.type === 'boolean' ? false : '';
          });
          setChecklistAnswers(initAnswers);
        }
      }

      // Seed AI answers if already exist
      if (data.verificationAnswers && data.verificationAnswers.length > 0) {
        const aiAnsObj = {};
        data.verificationAnswers.forEach(ans => {
          aiAnsObj[ans.question] = ans.answer;
        });
        setAiAnswers(aiAnsObj);
      }

      // Automatically determine the current step based on progress
      if (!data.qrVerified) {
        setStep(1);
      } else if (!data.gpsData || !data.gpsData.verified) {
        setStep(2);
      } else if (data.images.length === 0) {
        setStep(3);
      } else if (!data.aiAnalysis || !data.aiAnalysis.roomClassification) {
        setStep(4); // Fill checklist first, then run AI
      } else {
        setStep(5); // Fill AI answers and submit
      }
    } catch (err) {
      setError('Failed to load audit session details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 1: QR Verification ---
  const handleQRVerify = async (e) => {
    e.preventDefault();
    if (!qrToken) return;
    setQrVerifying(true);
    setQrError('');

    try {
      await auditService.verifyQR(id, qrToken);
      setAudit(prev => ({ ...prev, qrVerified: true }));
      setStep(2);
    } catch (err) {
      setQrError(err.message || 'Verification failed. Double check code.');
    } finally {
      setQrVerifying(false);
    }
  };

  // --- Step 2: GPS Verification ---
  const handleGPSCapture = () => {
    setGpsVerifying(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsVerifying(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const res = await auditService.verifyGPS(id, latitude, longitude, accuracy);
          setGpsLoc({ latitude, longitude, accuracy, ...res });
          setAudit(prev => ({
            ...prev,
            gpsData: { latitude, longitude, accuracy, verified: res.verified, distanceMeters: res.distanceMeters }
          }));
          
          if (res.verified) {
            setTimeout(() => setStep(3), 1500); // Wait briefly so user sees tick
          } else {
            setGpsError(`Verification failed: You are ${res.distanceMeters}m away from the room. Maximum tolerance is ${res.tolerance}m.`);
          }
        } catch (err) {
          setGpsError(err.message || 'Failed to verify GPS with server.');
        } finally {
          setGpsVerifying(false);
        }
      },
      (error) => {
        setGpsError(`Geolocation error: ${error.message}. Please check browser permissions.`);
        setGpsVerifying(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- Step 3: Camera Upload ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');

    const lat = gpsLoc?.latitude || audit?.gpsData?.latitude;
    const lng = gpsLoc?.longitude || audit?.gpsData?.longitude;

    try {
      const updatedImages = await auditService.uploadImage(id, file, imageType, lat, lng, true, testBypass);
      // A new photo invalidates any previous VLM analysis
      setAudit(prev => ({ ...prev, images: updatedImages, aiAnalysis: null, verificationAnswers: [] }));
      setAiAnswers({});
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (url) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    const lat = gpsLoc?.latitude || audit?.gpsData?.latitude;
    const lng = gpsLoc?.longitude || audit?.gpsData?.longitude;

    try {
      const updatedImages = await auditService.deleteImage(id, url, lat, lng);
      setAudit(prev => ({ ...prev, images: updatedImages, aiAnalysis: null, verificationAnswers: [] }));
      setAiAnswers({});
    } catch (err) {
      alert(err.message || 'Failed to delete image.');
    }
  };

  // --- Step 4: Checklist Answers ---
  const handleChecklistSubmit = (e) => {
    e.preventDefault();
    // Validate mandatory
    const template = audit.assignmentId?.checklistId;
    let valid = true;
    template.items.forEach(item => {
      if (item.mandatory) {
        const val = checklistAnswers[item._id];
        if (val === undefined || val === '') {
          valid = false;
        }
      }
    });

    if (!valid) {
      alert('Please answer all mandatory checklist questions.');
      return;
    }

    setStep(5);
  };

  // --- Step 5: AI VLM & dynamic Q&A ---
  const handleRunAI = async () => {
    setAiRunning(true);
    setAiError('');
    
    const lat = gpsLoc?.latitude || audit?.gpsData?.latitude;
    const lng = gpsLoc?.longitude || audit?.gpsData?.longitude;

    try {
      const res = await auditService.runAIAnalysis(id, lat, lng);
      setAudit(prev => ({
        ...prev,
        aiAnalysis: res.aiAnalysis,
        verificationAnswers: res.verificationQuestions.map(q => ({
          question: q.question,
          answer: '',
          validationResult: 'Requires review'
        }))
      }));

      // Initialize answers object for new questions
      const initAiAnswers = {};
      res.verificationQuestions.forEach(q => {
        initAiAnswers[q.question] = '';
      });
      setAiAnswers(initAiAnswers);
      setAiMeta({ provider: res.provider, model: res.model });
    } catch (err) {
      setAiError(err.message || 'AI service failed to analyze image.');
    } finally {
      setAiRunning(false);
    }
  };

  // --- Final Submit ---
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Format answers arrays
    const formattedChecklist = Object.keys(checklistAnswers).map(qid => {
      const qText = audit.assignmentId.checklistId.items.find(i => i._id === qid).question;
      return {
        questionId: qid,
        question: qText,
        answer: checklistAnswers[qid]
      };
    });

    const formattedAI = Object.keys(aiAnswers).map(qText => ({
      question: qText,
      answer: aiAnswers[qText]
    }));

    // Ensure all AI questions are answered
    const unanswered = formattedAI.some(ans => !ans.answer.trim());
    if (unanswered) {
      setError('Please answer all AI verification questions before submitting.');
      setSubmitting(false);
      return;
    }

    const lat = gpsLoc?.latitude || audit?.gpsData?.latitude;
    const lng = gpsLoc?.longitude || audit?.gpsData?.longitude;

    try {
      const finishedAudit = await auditService.submitAudit(id, formattedChecklist, formattedAI, lat, lng);
      setAudit(finishedAudit);
      setStep(6); // Success screen
    } catch (err) {
      setError(err.message || 'Failed to submit audit checklist.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent"></div>
        <span className="ml-3 text-sm">Loading audit session...</span>
      </div>
    );
  }

  if (error && step !== 6) {
    return (
      <div className="glass rounded-xl p-8 text-center max-w-md mx-auto space-y-4 border-red-500/20">
        <div className="text-red-400 font-bold text-lg">Error Occurred</div>
        <p className="text-sm text-slate-400">{error}</p>
        <Link to="/auditor" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const room = audit.roomId;
  const building = room?.buildingId;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Session Progress Header */}
      <div className="glass rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-800/40">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Inspecting Space</span>
          <h3 className="text-lg font-bold text-white font-outfit">Room {room?.roomNumber}</h3>
          <p className="text-xs text-slate-400">{building?.name} ({building?.code}) • Type: {room?.roomType}</p>
        </div>

        {/* Wizard Steps Nav */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="flex items-center">
              <span className={`h-5 w-5 rounded-full flex items-center justify-center border text-[9px] ${
                step === num 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-600/20' 
                  : step > num 
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400'
                    : 'border-slate-800 bg-slate-900/40 text-slate-500'
              }`}>
                {step > num ? '✓' : num}
              </span>
              {num < 5 && <span className="h-0.5 w-3 bg-slate-800 mx-1"></span>}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: QR Verification */}
      {step === 1 && (
        <div className="glass rounded-xl p-6 space-y-5 border-slate-800/40">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white font-outfit">Step 1: Room QR Code Scan</h4>
            <p className="text-xs text-slate-400">Scan or enter the QR tag affixed to the room entrance to verify your location.</p>
          </div>

          {qrError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {qrError}
            </div>
          )}

          <form onSubmit={handleQRVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Room QR Code Token</label>
              <input
                type="text"
                required
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="e.g. ROOM_QR_..."
                className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                For mock purposes, you can retrieve the correct QR payload string in the room's admin record.
              </span>
            </div>

            <div className="flex gap-2">
              {/* Simulate scanner button */}
              <button
                type="button"
                onClick={() => {
                  if (room?.qrCodeId?.encodedData) {
                    setQrToken(room.qrCodeId.encodedData);
                  } else {
                    alert('QR Code metadata not generated for this room yet.');
                  }
                }}
                className="px-3 py-2 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800"
              >
                Auto-Fill Assigned QR
              </button>

              <button
                type="submit"
                disabled={qrVerifying}
                className="flex-1 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white px-4 py-2 rounded-lg"
              >
                {qrVerifying ? 'Verifying...' : 'Verify Room Tag'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: GPS Verification */}
      {step === 2 && (
        <div className="glass rounded-xl p-6 space-y-5 border-slate-800/40">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white font-outfit">Step 2: Auditor GPS Location Verification</h4>
            <p className="text-xs text-slate-400">Capture your live GPS coordinates to match against the building registration.</p>
          </div>

          {gpsError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {gpsError}
            </div>
          )}

          {audit.gpsData?.verified && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              GPS Verified! You are {audit.gpsData.distanceMeters} meters away (Tolerance: {import.meta.env.VITE_GPS_TOLERANCE_METERS || 50}m).
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGPSCapture}
              disabled={gpsVerifying}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white px-4 py-2.5 rounded-lg"
            >
              {gpsVerifying ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Acquiring satellites...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Capture Live Location Coordinates
                </>
              )}
            </button>

            {/* Mock coordinate injector for testing on desktop */}
            {!audit.gpsData?.verified && (
              <button
                onClick={async () => {
                  try {
                    setGpsVerifying(true);
                    // Fetch expected room lat/lon and verify directly
                    const res = await auditService.verifyGPS(id, room.latitude, room.longitude, 5);
                    setGpsLoc({ latitude: room.latitude, longitude: room.longitude, accuracy: 5, ...res });
                    setAudit(prev => ({
                      ...prev,
                      gpsData: { latitude: room.latitude, longitude: room.longitude, accuracy: 5, verified: res.verified, distanceMeters: res.distanceMeters }
                    }));
                    setTimeout(() => setStep(3), 1200);
                  } catch (err) {
                    setGpsError(err.message || 'GPS verification failed');
                  } finally {
                    setGpsVerifying(false);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900"
              >
                Force Coordinate Verification (Seeded coordinates: {room?.latitude}, {room?.longitude})
              </button>
            )}

            {/* Leaflet map display */}
            {room.latitude && room.longitude && (
              <div className="h-64 rounded-xl overflow-hidden border border-slate-800/60 bg-slate-900">
                <MapContainer center={[room.latitude, room.longitude]} zoom={16} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  {/* Expected Room marker */}
                  <Marker position={[room.latitude, room.longitude]}>
                    <Popup>Expected Room Location</Popup>
                  </Marker>

                  {/* Circle indicating tolerance boundary */}
                  <Circle 
                    center={[room.latitude, room.longitude]} 
                    radius={parseInt(import.meta.env.VITE_GPS_TOLERANCE_METERS, 10) || 50} 
                    pathOptions={{ color: 'emerald', fillColor: 'emerald', fillOpacity: 0.1 }}
                  />

                  {/* Auditor marker */}
                  {gpsLoc && (
                    <Marker position={[gpsLoc.latitude, gpsLoc.longitude]}>
                      <Popup>Your Coordinates</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Camera Capture */}
      {step === 3 && (
        <div className="glass rounded-xl p-6 space-y-5 border-slate-800/40">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white font-outfit">Step 3: Live Image Capture</h4>
            <p className="text-xs text-slate-400">Upload live photos of the room entrance, layout, and critical assets.</p>
          </div>

          {uploadError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {uploadError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">Select Image Orientation</label>
                  <span className="text-[10px] text-emerald-400 font-semibold">{currentRoomType}</span>
                </div>
                <select
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {categoryOrientations.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                {/* Developer testing toggle */}
                <div className="mb-2 flex items-center justify-end">
                  <label className="text-[10px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={testBypass}
                      onChange={(e) => {
                        setTestBypass(e.target.checked);
                        if (e.target.checked) stopCamera();
                      }}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900" 
                    />
                    Enable Upload Bypass (Testing Only)
                  </label>
                </div>
                
                {testBypass ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="image-file-input"
                    />
                    <label
                      htmlFor="image-file-input"
                      className={`flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 cursor-pointer transition ${
                        uploading ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {uploading ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                      ) : (
                        <>
                          <svg className="h-8 w-8 text-slate-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[11px] font-semibold text-slate-300">
                            Upload File (Bypass Enabled)
                          </span>
                        </>
                      )}
                    </label>
                  </>
                ) : (
                  <div className="flex flex-col items-center w-full rounded-xl border-2 border-slate-800 bg-slate-900/30 overflow-hidden">
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    {!streamActive ? (
                      <div className="h-32 w-full flex flex-col items-center justify-center hover:bg-slate-900/60 cursor-pointer transition" onClick={startCamera}>
                         <svg className="h-8 w-8 text-emerald-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                         </svg>
                         <span className="text-[11px] font-semibold text-emerald-400">Start Live Camera</span>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center p-3 gap-3 bg-slate-900/50">
                        <video ref={videoRef} autoPlay playsInline className="w-full max-h-64 object-contain bg-black rounded-lg border border-slate-700 shadow-inner" />
                        <div className="flex w-full gap-2">
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={handleLiveCapture}
                            className="flex-[2] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg border-2 border-emerald-500/50 transition flex justify-center items-center gap-2"
                          >
                            {uploading ? 'Capturing...' : (
                              <>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Capture Photo
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* List uploaded images */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Uploaded Photos ({audit.images.length})</span>
              
              {audit.images.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">No images uploaded yet. Upload at least one wide photo to proceed.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {audit.images.map((img, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden h-20 bg-slate-900 border border-slate-800">
                      <img src={img.cloudinaryUrl} alt="Upload" className="h-full w-full object-cover" />
                      <span className="absolute bottom-1 left-1 px-1 bg-slate-950/80 text-[8px] font-bold text-slate-300 rounded">
                        {img.imageType}
                      </span>
                      <button
                        onClick={() => handleImageDelete(img.cloudinaryUrl)}
                        className="absolute top-1 right-1 h-5 w-5 bg-red-600/90 text-white rounded flex items-center justify-center hover:bg-red-500 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={() => setStep(4)}
              disabled={audit.images.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white px-4 py-2.5 rounded-lg"
            >
              Continue to Checklist
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Checklist */}
      {step === 4 && (
        <div className="glass rounded-xl p-6 space-y-5 border-slate-800/40">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white font-outfit">Step 4: Standard Inspection Checklist</h4>
            <p className="text-xs text-slate-400">Complete the standard checklist items configured for this audit type.</p>
          </div>

          <form onSubmit={handleChecklistSubmit} className="space-y-4">
            <div className="divide-y divide-slate-800/30 space-y-3">
              {audit.assignmentId?.checklistId?.items.map((item) => (
                <div key={item._id} className="pt-3 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-slate-200">
                      {item.question}
                      {item.mandatory && <span className="text-red-500 ml-1 font-bold">*</span>}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {item.type === 'boolean' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setChecklistAnswers(prev => ({ ...prev, [item._id]: true }))}
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            checklistAnswers[item._id] === true
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 border border-slate-800 text-slate-400'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setChecklistAnswers(prev => ({ ...prev, [item._id]: false }))}
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            checklistAnswers[item._id] === false
                              ? 'bg-red-600/90 text-white'
                              : 'bg-slate-900 border border-slate-800 text-slate-400'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    ) : item.type === 'number' ? (
                      <input
                        type="number"
                        required={item.mandatory}
                        value={checklistAnswers[item._id] || ''}
                        onChange={(e) => setChecklistAnswers(prev => ({ ...prev, [item._id]: e.target.value }))}
                        className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none w-24"
                      />
                    ) : (
                      <input
                        type="text"
                        required={item.mandatory}
                        value={checklistAnswers[item._id] || ''}
                        onChange={(e) => setChecklistAnswers(prev => ({ ...prev, [item._id]: e.target.value }))}
                        placeholder="Inspect status"
                        className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none w-44"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-900"
              >
                Back
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white px-4 py-2.5 rounded-lg"
              >
                Go to AI Verification
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 5: AI Verification & Dynamic Q&A */}
      {step === 5 && (
        <div className="glass rounded-xl p-6 space-y-5 border-slate-800/40">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white font-outfit">Step 5: AI Authenticity Analysis</h4>
            <p className="text-xs text-slate-400">Trigger the Vision Language Model to analyze layout structures and answer dynamic verification questions.</p>
          </div>

          {aiError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {aiError}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          {!audit.aiAnalysis?.roomClassification ? (
            <div className="space-y-4 text-center py-6">
              <p className="text-xs text-slate-400">Images are ready. Click below to execute VLM parsing.</p>
              <button
                onClick={handleRunAI}
                disabled={aiRunning}
                className="mx-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white px-5 py-3 rounded-lg shadow-lg"
              >
                {aiRunning ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    VLM reading layout...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Analyze Space Layout with VLM
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Premium VLM output card */}
              {(() => {
                const matchPct = Math.round((audit.aiAnalysis.confidence || 0) * 100);
                const isTypeMatch = String(audit.aiAnalysis.roomClassification || '').trim().toLowerCase() === String(room?.roomType || '').trim().toLowerCase();
                
                let badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                let badgeLabel = 'High Match';
                if (matchPct < 50) {
                  badgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                  badgeLabel = 'Mismatch / Low Match';
                } else if (matchPct < 75) {
                  badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                  badgeLabel = 'Moderate Match';
                }

                return (
                  <div className={`rounded-xl border p-4 space-y-2.5 transition-all ${
                    matchPct >= 75
                      ? 'border-indigo-500/20 bg-indigo-600/5'
                      : matchPct >= 50
                        ? 'border-amber-500/25 bg-amber-500/5'
                        : 'border-rose-500/25 bg-rose-500/5'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/15 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">VLM Analysis Results</span>
                        <p className="text-[11px] text-slate-400">Target Space: <span className="text-slate-200 font-semibold">{room?.roomType}</span></p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${badgeClass}`}>
                        <span>{badgeLabel}:</span>
                        <span>{matchPct}%</span>
                      </div>
                    </div>

                    {!isTypeMatch && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-300 flex items-start gap-2">
                        <span className="text-sm">⚠️</span>
                        <div>
                          <strong>Space Discrepancy:</strong> Image classified as <strong>"{audit.aiAnalysis.roomClassification}"</strong>, differing from target space <strong>"{room?.roomType}"</strong>. Confidence score is calibrated to reflect this mismatch.
                        </div>
                      </div>
                    )}

                    <div className="text-xs space-y-1.5">
                      <p className="text-slate-300">
                        <strong className="text-white">Classification:</strong>{' '}
                        <span className={isTypeMatch ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
                          {audit.aiAnalysis.roomClassification}
                        </span>
                        {isTypeMatch ? ' ✓ (Matches Room)' : ' ✗ (Expected: ' + room?.roomType + ')'}
                      </p>
                      <p className="text-slate-300"><strong className="text-white">Scene Description:</strong> {audit.aiAnalysis.sceneDescription}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <strong className="text-white mr-1 self-center">Assets:</strong>
                        {audit.aiAnalysis.objects?.map((obj, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/10 text-[9px] font-semibold">{obj}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-indigo-500/15 pt-2">
                      <span className="text-[10px] text-slate-500">
                        {aiMeta ? `via ${aiMeta.provider}${aiMeta.model ? ` · ${aiMeta.model}` : ''} — ` : ''}
                        {audit.aiAnalysis.analyzedAt ? `Analyzed ${new Date(audit.aiAnalysis.analyzedAt).toLocaleString()}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={handleRunAI}
                        disabled={aiRunning}
                        className="text-[10px] font-semibold text-indigo-300 hover:text-indigo-200 disabled:opacity-50"
                      >
                        {aiRunning ? 'Re-analyzing...' : 'Re-run VLM Analysis'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Q&A form */}
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/30 pb-2">AI-Generated Verification Questions</h5>
                  
                  {audit.verificationAnswers?.map((qa, index) => (
                    <div key={index} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-200">
                        {index + 1}. {qa.question}
                      </label>
                      <input
                        type="text"
                        required
                        value={aiAnswers[qa.question] !== undefined ? aiAnswers[qa.question] : qa.answer}
                        onChange={(e) => setAiAnswers(prev => ({ ...prev, [qa.question]: e.target.value }))}
                        placeholder="e.g. Yes, there are 4 fans mounted, all operational."
                        className="block w-full rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-800/30">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-4 py-2 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Generating Confidence Matrix...
                      </>
                    ) : (
                      <>
                        Submit Inspection
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* STEP 6: Success screen */}
      {step === 6 && (
        <div className="glass rounded-xl p-8 space-y-6 text-center border-emerald-500/20 max-w-md mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-400 ring-2 ring-emerald-500/20 animate-bounce">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-bold font-outfit text-white">Inspection Submitted</h4>
            <p className="text-xs text-slate-400">The audit session was processed through the AI pipeline successfully.</p>
          </div>

          {/* Verification result card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Security Score:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                audit.confidenceScore >= 90 ? 'bg-emerald-500/15 text-emerald-400' :
                audit.confidenceScore >= 70 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
              }`}>{audit.confidenceScore}%</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Result Decision:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                audit.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                audit.status === 'Review Required' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {audit.status}
              </span>
            </div>

            <p className="text-[10px] text-slate-500 text-left pt-1 border-t border-slate-800/30">
              {audit.status === 'Approved' 
                ? 'Excellent. The confidence score exceeds the 90% threshold, auto-approving the room inspection.'
                : audit.status === 'Review Required'
                  ? 'Audit requires manual review by administrators because the confidence score lies between 70% and 89%.'
                  : 'Fraud flagged. The score is below 70% due to coordinate/image inconsistencies. Review required.'
              }
            </p>
          </div>

          <Link
            to="/auditor"
            className="w-full inline-block bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-600/10"
          >
            Go to My Tasks
          </Link>
        </div>
      )}
    </div>
  );
};

export default AuditSession;
