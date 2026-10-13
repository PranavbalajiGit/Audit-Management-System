import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  QrCode,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  ImageOff,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

import { reportService, auditService } from '../../services/api';
import { StatusBadge, ConfidenceMeter } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { BlurFade } from '@/components/fx/blur-fade';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const resultTone = (result) => {
  if (result === 'Match') return 'success';
  if (result === 'Partial match') return 'warning';
  return 'destructive';
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      toast.success(`Report ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportPDF = (report) => {
    try {
      const doc = new jsPDF();

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('INFRASTRUCTURE AUDIT REPORT', 14, 20);

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 26);
      doc.line(14, 29, 196, 29);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. Audit Details', 14, 38);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Room Number: Room ${report.roomId?.roomNumber || 'N/A'}`, 14, 46);
      doc.text(
        `Building: ${report.roomId?.buildingId?.name || 'N/A'} (${report.roomId?.buildingId?.code || 'N/A'})`,
        100,
        46
      );
      doc.text(
        `Auditor: ${report.auditorId?.name || 'N/A'} (${report.auditorId?.email || 'N/A'})`,
        14,
        52
      );
      doc.text(
        `Submitted At: ${report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'In Progress'}`,
        100,
        52
      );

      doc.line(14, 58, 196, 58);
      doc.setFont('Helvetica', 'bold');
      doc.text('2. Security Authenticity Matrix', 14, 66);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Confidence Score: ${report.confidenceScore || 0}%`, 14, 74);
      doc.text(`QR Verified: ${report.qrVerified ? 'Yes' : 'No'}`, 100, 74);
      doc.text(
        `GPS Location: ${report.gpsData?.verified ? 'Verified Match' : 'Unverified'} (${report.gpsData?.distanceMeters || '9999'}m away)`,
        14,
        80
      );
      doc.text(`Final Decision: ${report.status}`, 100, 80);

      doc.line(14, 86, 196, 86);
      doc.setFont('Helvetica', 'bold');
      doc.text('3. Vision Language Model Analysis', 14, 94);
      doc.setFont('Helvetica', 'normal');
      doc.text(
        `AI Room Classification: ${report.aiAnalysis?.roomClassification || 'Unclassified'}`,
        14,
        102
      );

      const descLines = doc.splitTextToSize(
        `Scene Description: ${report.aiAnalysis?.sceneDescription || 'No description available.'}`,
        180
      );
      doc.text(descLines, 14, 108);

      const descHeight = descLines.length * 5;
      let nextY = 108 + descHeight + 6;

      doc.line(14, nextY - 4, 196, nextY - 4);
      doc.setFont('Helvetica', 'bold');
      doc.text('4. Standard Checklist Responses', 14, nextY);
      doc.setFont('Helvetica', 'normal');

      let cy = nextY + 8;
      if (report.checklistAnswers && report.checklistAnswers.length > 0) {
        report.checklistAnswers.forEach((ans, idx) => {
          if (cy > 275) {
            doc.addPage();
            cy = 20;
          }
          const ansText = typeof ans.answer === 'boolean' ? (ans.answer ? 'YES' : 'NO') : ans.answer;
          doc.text(`${idx + 1}. ${ans.question}  ->  [ ${ansText} ]`, 14, cy);
          cy += 6;
        });
      } else {
        doc.text('No checklist answers.', 14, cy);
        cy += 6;
      }

      nextY = cy + 4;

      doc.line(14, nextY - 4, 196, nextY - 4);
      doc.setFont('Helvetica', 'bold');
      doc.text('5. Dynamic Verification Q&A (LLM)', 14, nextY);
      doc.setFont('Helvetica', 'normal');

      let qy = nextY + 8;
      if (report.verificationAnswers && report.verificationAnswers.length > 0) {
        report.verificationAnswers.forEach((qa, idx) => {
          if (qy > 265) {
            doc.addPage();
            qy = 20;
          }
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

      if (report.notes) {
        if (qy > 265) {
          doc.addPage();
          qy = 20;
        }
        doc.line(14, qy, 196, qy);
        doc.setFont('Helvetica', 'bold');
        doc.text('6. Administrative Notes', 14, qy + 8);
        doc.setFont('Helvetica', 'normal');
        doc.text(report.notes, 14, qy + 14);
      }

      doc.save(`AuditReport_Room_${report.roomId?.roomNumber || 'Unknown'}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to construct PDF download.');
    }
  };

  return (
    <div className="space-y-6">
      <BlurFade>
        <div>
          <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
            Review queue · {reports.length} reports
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
            Inspection reports
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review submitted inspections, perform manual overrides, and export PDF records.
          </p>
        </div>
      </BlurFade>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingScreen label="Loading audit reports..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No inspection reports"
          description="Reports appear here once auditors submit their inspections."
        />
      ) : (
        <div className="reg-marks overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-panel">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Location</TableHead>
                <TableHead className="hidden md:table-cell">Auditor</TableHead>
                <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                <TableHead className="w-[140px]">Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r, i) => (
                <motion.tr
                  key={r._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                >
                  <TableCell>
                    <p className="font-semibold text-foreground">Room {r.roomId?.roomNumber}</p>
                    <p className="text-xs text-muted-foreground">{r.roomId?.buildingId?.name}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="font-medium text-foreground">{r.auditorId?.name}</p>
                    <p className="font-mono-data text-[0.65rem] text-muted-foreground">
                      {r.auditorId?.email}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'In Progress'}
                  </TableCell>
                  <TableCell className="w-[140px]">
                    <ConfidenceMeter score={r.confidenceScore} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenReview(r)}>
                        <Eye className="h-3.5 w-3.5 text-primary" /> Review
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleExportPDF(r)}>
                        <Download className="h-3.5 w-3.5 text-success" /> PDF
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!activeReport} onOpenChange={(o) => !o && setActiveReport(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {activeReport && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Audit review · Room {activeReport.roomId?.roomNumber}
                </DialogTitle>
                <DialogDescription>
                  {activeReport.roomId?.buildingId?.name} — verify authenticity signals before
                  decisioning.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Summary */}
                <div className="space-y-3">
                  <SectionLabel>Inspection signposts</SectionLabel>
                  <div className="space-y-2 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs">
                    <Row label="Auditor" value={activeReport.auditorId?.name} />
                    <Row
                      label="Submitted"
                      value={
                        activeReport.submittedAt
                          ? new Date(activeReport.submittedAt).toLocaleString()
                          : 'In progress'
                      }
                    />
                    <Row
                      icon={QrCode}
                      label="QR tag"
                      value={activeReport.qrVerified ? 'Verified' : 'Unverified'}
                      tone={activeReport.qrVerified ? 'success' : 'destructive'}
                    />
                    <Row
                      icon={MapPin}
                      label="GPS"
                      value={
                        activeReport.gpsData?.verified
                          ? 'Verified match'
                          : `Unverified (${activeReport.gpsData?.distanceMeters || '9999'}m)`
                      }
                      tone={activeReport.gpsData?.verified ? 'success' : 'destructive'}
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-muted-foreground">Authenticity</span>
                      <span className="w-24">
                        <ConfidenceMeter score={activeReport.confidenceScore} />
                      </span>
                    </div>
                  </div>

                  {activeReport.aiAnalysis && (
                    <div className="space-y-1.5 rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs">
                      <span className="flex items-center gap-1.5 font-mono-data text-[0.6rem] font-bold uppercase tracking-wider text-primary">
                        <Sparkles className="h-3 w-3" /> VLM scene verification
                      </span>
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Classification:</strong>{' '}
                        {activeReport.aiAnalysis.roomClassification}
                      </p>
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Summary:</strong>{' '}
                        {activeReport.aiAnalysis.sceneDescription}
                      </p>
                    </div>
                  )}
                </div>

                {/* Images */}
                <div className="space-y-2">
                  <SectionLabel>
                    Inspection images ({activeReport.images?.length || 0})
                  </SectionLabel>
                  {!activeReport.images?.length ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 py-8 text-xs text-muted-foreground">
                      <ImageOff className="h-5 w-5" /> No images uploaded
                    </div>
                  ) : (
                    <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {activeReport.images.map((img, idx) => (
                        <a
                          key={idx}
                          href={img.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative h-20 overflow-hidden rounded-lg border border-border/60 bg-secondary"
                        >
                          <img
                            src={img.cloudinaryUrl}
                            alt="Inspection"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1 font-mono-data text-[0.55rem] font-bold text-foreground">
                            {img.imageType}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist responses */}
              <div className="space-y-2">
                <SectionLabel>Checklist responses</SectionLabel>
                <div className="grid max-h-36 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {activeReport.checklistAnswers?.map((ans, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-card/60 px-3 py-2 text-xs"
                    >
                      <span className="text-muted-foreground">{ans.question}</span>
                      <span className="font-bold uppercase text-foreground">
                        {typeof ans.answer === 'boolean' ? (ans.answer ? 'Yes' : 'No') : ans.answer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Q&A */}
              {activeReport.verificationAnswers?.length > 0 && (
                <div className="space-y-2">
                  <SectionLabel>AI-generated verification Q&amp;A</SectionLabel>
                  <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                    {activeReport.verificationAnswers.map((qa, idx) => (
                      <div
                        key={idx}
                        className="space-y-1.5 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs"
                      >
                        <p className="font-semibold text-foreground">Q: {qa.question}</p>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-muted-foreground">A: {qa.answer}</p>
                          <Badge variant={resultTone(qa.validationResult)} className="shrink-0">
                            {qa.validationResult}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision */}
              <div className="space-y-3 border-t border-border/50 pt-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Review comments &amp; override notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Validated with facility supervisor. GPS discrepancy resolved."
                    rows={2}
                    className="w-full rounded-md border border-input bg-background/60 px-3 py-2 text-xs transition-colors placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleExportPDF(activeReport)}>
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus('Rejected')}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus('Approved')}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <span className="block border-b border-border/40 pb-1.5 font-mono-data text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
    {children}
  </span>
);

const Row = ({ label, value, tone, icon: Icon }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="flex items-center gap-1.5 text-muted-foreground">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
    <span
      className={cn(
        'truncate font-semibold text-foreground',
        tone === 'success' && 'text-success',
        tone === 'destructive' && 'text-destructive'
      )}
    >
      {value}
    </span>
  </div>
);

export default Reports;
