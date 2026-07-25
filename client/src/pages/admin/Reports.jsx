import React, { useState, useEffect } from 'react';
import { reportService, auditService } from '../../services/api';
import { jsPDF } from 'jspdf';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review Modal state
  const [activeReport, setActiveReport] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getReports();
      setReports(data || []);
    } catch (err) {
      setError('Failed to fetch inspection reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (report) => {
    setActiveReport(report);
    setNotes(report.notes || '');
  };

  const handleUpdateStatus = async (status) => {
    if (!activeReport) return;
    setActionLoading(true);
    try {
      await auditService.updateAuditStatus(activeReport._id, status, notes);
      setActiveReport(null);
      fetchReports();
      alert(`Report status updated to ${status}!`);
    } catch (err) {
      alert(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportPDF = (report) => {
    try {
      const doc = new jsPDF();
      
      // Title Header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('INFRASTRUCTURE AUDIT REPORT', 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 26);
      doc.line(14, 29, 196, 29);

      // Section: Info
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. Audit Details', 14, 38);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Room Number: Room ${report.roomId?.roomNumber || 'N/A'}`, 14, 46);
      doc.text(`Building: ${report.roomId?.buildingId?.name || 'N/A'} (${report.roomId?.buildingId?.code || 'N/A'})`, 100, 46);
      doc.text(`Auditor: ${report.auditorId?.name || 'N/A'} (${report.auditorId?.email || 'N/A'})`, 14, 52);
      doc.text(`Submitted At: ${report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'In Progress'}`, 100, 52);

      // Section: Security Score Card
      doc.line(14, 58, 196, 58);
      doc.setFont('Helvetica', 'bold');
      doc.text('2. Security Authenticity Matrix', 14, 66);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Confidence Score: ${report.confidenceScore || 0}%`, 14, 74);
      doc.text(`QR Verified: ${report.qrVerified ? 'Yes' : 'No'}`, 100, 74);
      doc.text(`GPS Location: ${report.gpsData?.verified ? 'Verified Match' : 'Unverified'} (${report.gpsData?.distanceMeters || '9999'}m away)`, 14, 80);
      doc.text(`Final Decision: ${report.status}`, 100, 80);

      // Section: VLM Findings
      doc.line(14, 86, 196, 86);
      doc.setFont('Helvetica', 'bold');
      doc.text('3. Vision Language Model Analysis', 14, 94);
      doc.setFont('Helvetica', 'normal');
      doc.text(`AI Room Classification: ${report.aiAnalysis?.roomClassification || 'Unclassified'}`, 14, 102);
      
      // Auto-wrap scene description
      const descLines = doc.splitTextToSize(`Scene Description: ${report.aiAnalysis?.sceneDescription || 'No description available.'}`, 180);
      doc.text(descLines, 14, 108);

      const descHeight = descLines.length * 5;
      let nextY = 108 + descHeight + 6;

      // Section: Checklist Answers
      doc.line(14, nextY - 4, 196, nextY - 4);
      doc.setFont('Helvetica', 'bold');
      doc.text('4. Standard Checklist Responses', 14, nextY);
      doc.setFont('Helvetica', 'normal');
      
      let cy = nextY + 8;
      if (report.checklistAnswers && report.checklistAnswers.length > 0) {
        report.checklistAnswers.forEach((ans, idx) => {
          if (cy > 275) { doc.addPage(); cy = 20; }
          const ansText = typeof ans.answer === 'boolean' ? (ans.answer ? 'YES' : 'NO') : ans.answer;
          doc.text(`${idx + 1}. ${ans.question}  ->  [ ${ansText} ]`, 14, cy);
          cy += 6;
        });
      } else {
        doc.text('No checklist answers.', 14, cy);
        cy += 6;
      }

      nextY = cy + 4;

      // Section: AI Verification Questions
      doc.line(14, nextY - 4, 196, nextY - 4);
      doc.setFont('Helvetica', 'bold');
      doc.text('5. Dynamic Verification Q&A (LLM)', 14, nextY);
      doc.setFont('Helvetica', 'normal');
      
      let qy = nextY + 8;
      if (report.verificationAnswers && report.verificationAnswers.length > 0) {
        report.verificationAnswers.forEach((qa, idx) => {
          if (qy > 265) { doc.addPage(); qy = 20; }
          doc.setFont('Helvetica', 'bold');
          doc.text(`Q: ${qa.question}`, 14, qy);
          doc.setFont('Helvetica', 'normal');
          doc.text(`A: ${qa.answer}`, 14, qy + 5);
          doc.text(`Validation Result: ${qa.validationResult}`, 100, qy + 5);
          qy += 12;
        });
      } else {
        doc.text('No verification questions answered.', 14, qy);
        qy += 6;
      }

      // Notes
      if (report.notes) {
        if (qy > 265) { doc.addPage(); qy = 20; }
        doc.line(14, qy, 196, qy);
        doc.setFont('Helvetica', 'bold');
        doc.text('6. Administrative Notes', 14, qy + 8);
        doc.setFont('Helvetica', 'normal');
        doc.text(report.notes, 14, qy + 14);
      }

      doc.save(`AuditReport_Room_${report.roomId?.roomNumber || 'Unknown'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to construct PDF download.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-outfit text-white">Inspection Reports</h2>
        <p className="text-xs text-slate-400">Review submitted inspections, perform manual overrides, and download PDF reports.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent"></div>
          <span className="ml-3 text-sm">Loading audit reports...</span>
        </div>
      ) : (
        <div className="glass rounded-xl border border-slate-800/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
                <tr>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Auditor</th>
                  <th className="px-5 py-3">Submitted At</th>
                  <th className="px-5 py-3">Confidence Score</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-slate-500">No inspection reports available.</td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-900/10 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-white">Room {r.roomId?.roomNumber}</p>
                        <p className="text-xs text-slate-400">{r.roomId?.buildingId?.name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-200">{r.auditorId?.name}</p>
                        <p className="text-[10px] text-slate-500">{r.auditorId?.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'In Progress'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${
                            r.confidenceScore >= 90 ? 'bg-emerald-500' : r.confidenceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}></span>
                          <span className="font-bold text-slate-200">{r.confidenceScore}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                          r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          r.status === 'Review Required' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          r.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenReview(r)}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleExportPDF(r)}
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Details Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-2xl rounded-xl p-6 space-y-4 border-slate-800 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
              <h3 className="text-lg font-bold text-white font-outfit">
                Audit Review: Room {activeReport.roomId?.roomNumber} ({activeReport.roomId?.buildingId?.name})
              </h3>
              <button onClick={() => setActiveReport(null)} className="text-slate-400 hover:text-white font-bold text-lg">
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Summary Block */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800/30 pb-1">Inspections Signposts</span>
                
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Auditor:</span><span className="text-slate-200">{activeReport.auditorId?.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Submitted:</span><span className="text-slate-200">{activeReport.submittedAt ? new Date(activeReport.submittedAt).toLocaleString() : 'In Progress'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">QR Code Tag:</span><span className={activeReport.qrVerified ? 'text-emerald-400 font-semibold' : 'text-red-400'}>{activeReport.qrVerified ? 'Verified' : 'Unverified'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">GPS Validation:</span><span className={activeReport.gpsData?.verified ? 'text-emerald-400 font-semibold' : 'text-red-400'}>{activeReport.gpsData?.verified ? 'Verified (Match)' : `Unverified (${activeReport.gpsData?.distanceMeters || '9999'}m away)`}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Authenticity Score:</span><span className="font-bold text-white bg-indigo-600/35 px-1.5 rounded">{activeReport.confidenceScore}%</span></div>
                </div>

                {/* VLM card */}
                {activeReport.aiAnalysis && (
                  <div className="bg-indigo-600/5 rounded-lg p-3 border border-indigo-500/20 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">VLM Scene Verification</span>
                    <p className="text-slate-300"><strong className="text-white">Room Type Classified:</strong> {activeReport.aiAnalysis.roomClassification}</p>
                    <p className="text-slate-300"><strong className="text-white">Scene summary:</strong> {activeReport.aiAnalysis.sceneDescription}</p>
                  </div>
                )}
              </div>

              {/* Photos Block */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800/30 pb-1">Inspection Images ({activeReport.images?.length || 0})</span>
                
                {activeReport.images?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center">No images uploaded.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {activeReport.images?.map((img, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden h-20 bg-slate-900 border border-slate-800">
                        <a href={img.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                          <img src={img.cloudinaryUrl} alt="Inspection" className="h-full w-full object-cover cursor-pointer hover:scale-105 transition duration-200" />
                        </a>
                        <span className="absolute bottom-1 left-1 px-1 bg-slate-950/80 text-[8px] font-bold text-slate-300 rounded">
                          {img.imageType}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Checklist items answers */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800/30 pb-1">Checklist Responses</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-36 overflow-y-auto pr-1">
                {activeReport.checklistAnswers?.map((ans, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900/30 border border-slate-800/50 text-xs flex justify-between">
                    <span className="text-slate-400 font-medium">{ans.question}</span>
                    <span className="font-bold text-white uppercase ml-2">
                      {typeof ans.answer === 'boolean' ? (ans.answer ? 'Yes' : 'No') : ans.answer}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic AI Questions Block */}
            {activeReport.verificationAnswers?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800/30 pb-1">AI-Generated Verification Q&A</span>
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {activeReport.verificationAnswers.map((qa, index) => (
                    <div key={index} className="p-2.5 rounded bg-slate-900/40 border border-slate-800/60 text-xs space-y-1.5">
                      <p className="font-semibold text-slate-300">Q: {qa.question}</p>
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-slate-400">A: {qa.answer}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                          qa.validationResult === 'Match' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          qa.validationResult === 'Partial match' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>{qa.validationResult}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit override notes */}
            <div className="border-t border-slate-800/40 pt-3.5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Review Comments & Override Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Validated with local facility supervisor. GPS discrepancy resolved."
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleExportPDF(activeReport)}
                  className="px-3 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Download PDF Report
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus('Rejected')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-semibold rounded-lg text-white"
                  >
                    Reject Audit
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Approved')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-lg text-white"
                  >
                    Approve Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
