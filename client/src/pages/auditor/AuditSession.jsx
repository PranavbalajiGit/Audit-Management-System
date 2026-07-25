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
  const [uploading, setUploading] = useState(false);
  const [imageType, setImageType] = useState('Wide');
  const [uploadError, setUploadError] = useState('');

  // Checklist state
  const [checklistAnswers, setChecklistAnswers] = useState({});

  // AI state
  const [aiRunning, setAiRunning] = useState(false);
  const [aiAnswers, setAiAnswers] = useState({}); // { [question]: answerText }
  const [aiError, setAiError] = useState('');

  // Final submit state
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAuditDetails();
  }, [id]);

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

    try {
      const updatedImages = await auditService.uploadImage(id, file, imageType);
      setAudit(prev => ({ ...prev, images: updatedImages }));
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (url) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const updatedImages = await auditService.deleteImage(id, url);
      setAudit(prev => ({ ...prev, images: updatedImages }));
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
    try {
      const res = await auditService.runAIAnalysis(id);
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

    try {
      const finishedAudit = await auditService.submitAudit(id, formattedChecklist, formattedAI);
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
              GPS Verified! You are {audit.gpsData.distanceMeters} meters away (Tolerance: {process.env.GPS_TOLERANCE_METERS || 50}m).
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
                    radius={parseInt(process.env.GPS_TOLERANCE_METERS, 10) || 50} 
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
                <label className="block text-xs font-semibold text-slate-300">Select Image Category</label>
                <select
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Entrance">Room Entrance (with Signboard)</option>
                  <option value="Wide">Wide Angle Room View</option>
                  <option value="Asset">Asset Highlight View</option>
                  <option value="Other">Other View</option>
                </select>
              </div>

              <div className="relative">
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[11px] font-semibold text-slate-300">Choose Image or Open Camera</span>
                    </>
                  )}
                </label>
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
              <p className="text-xs text-slate-400">Images are ready. Click below to execute Gemini VLM parsing.</p>
              <button
                onClick={handleRunAI}
                disabled={aiRunning}
                className="mx-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white px-5 py-3 rounded-lg shadow-lg"
              >
                {aiRunning ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Gemini reading layout...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Analyze Space Layout with Gemini
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Premium VLM output card */}
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-600/5 p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-indigo-500/15 pb-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">VLM Analysis Results</span>
                  <span className="text-xs font-bold text-white">Match Confidence: {Math.round(audit.aiAnalysis.confidence * 100)}%</span>
                </div>
                <div className="text-xs space-y-1.5">
                  <p className="text-slate-300"><strong className="text-white">Classification:</strong> {audit.aiAnalysis.roomClassification}</p>
                  <p className="text-slate-300"><strong className="text-white">Scene Description:</strong> {audit.aiAnalysis.sceneDescription}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <strong className="text-white mr-1 self-center">Assets:</strong>
                    {audit.aiAnalysis.objects?.map((obj, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/10 text-[9px] font-semibold">{obj}</span>
                    ))}
                  </div>
                </div>
              </div>

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
