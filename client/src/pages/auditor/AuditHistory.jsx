import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  RefreshCw,
  Search,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Gauge,
  ArrowUpDown,
  QrCode,
  Camera,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { auditService } from '../../services/api';
import { StatCard } from '@/components/StatCard';
import { StatusBadge, ConfidenceMeter } from '@/components/StatusBadge';
import { LoadingScreen, InlineLoader } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { BlurFade } from '@/components/fx/blur-fade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const HISTORY_STATUSES = ['Approved', 'Review Required', 'Rejected', 'Submitted'];

const STATUS_COLOR = {
  Approved: '#17b8a6',
  'Review Required': '#ffb020',
  Rejected: '#f0526b',
  Submitted: '#2e90fa',
};

const AuditHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const [activeTask, setActiveTask] = useState(null);
  const [activeAudit, setActiveAudit] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await auditService.getAssignments();
      const list = res.data || [];
      setHistory(list.filter((item) => HISTORY_STATUSES.includes(item.status)));
    } catch (err) {
      setError('Failed to fetch audit history. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confidenceOf = (task) =>
    task.auditId && typeof task.auditId === 'object' ? task.auditId.confidenceScore : undefined;

  const summary = useMemo(() => {
    const withScore = history.filter((t) => typeof confidenceOf(t) === 'number');
    const avg = withScore.length
      ? Math.round(withScore.reduce((s, t) => s + t.auditId.confidenceScore, 0) / withScore.length)
      : 0;
    return {
      total: history.length,
      approved: history.filter((t) => t.status === 'Approved').length,
      attention: history.filter((t) => ['Review Required', 'Rejected'].includes(t.status)).length,
      avg,
    };
  }, [history]);

  const distribution = useMemo(
    () =>
      HISTORY_STATUSES.map((status) => ({
        status,
        count: history.filter((t) => t.status === status).length,
      })).filter((d) => d.count > 0),
    [history]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = history.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (!q) return true;
      const room = task.roomId?.roomNumber?.toString().toLowerCase() || '';
      const building = task.roomId?.buildingId?.name?.toLowerCase() || '';
      return room.includes(q) || building.includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'confidence') {
        return (confidenceOf(b) ?? -1) - (confidenceOf(a) ?? -1);
      }
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    return list;
  }, [history, search, statusFilter, sortBy]);

  const openDetail = async (task) => {
    setActiveTask(task);
    setActiveAudit(null);
    const id = task.auditId && typeof task.auditId === 'object' ? task.auditId._id : task.auditId;
    if (!id) return;
    setDetailLoading(true);
    try {
      const audit = await auditService.getAudit(id);
      setActiveAudit(audit);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <LoadingScreen label="Compiling audit history..." />;

  return (
    <div className="space-y-6">
      <BlurFade>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-success/90">
              Records archive
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Audit history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every submitted inspection with its authenticity score and verification signals.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </BlurFade>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total audits" value={summary.total} icon={History} tone="primary" delay={0.05} />
        <StatCard label="Approved" value={summary.approved} icon={ShieldCheck} tone="success" delay={0.12} />
        <StatCard label="Needs attention" value={summary.attention} icon={AlertTriangle} tone="warning" delay={0.19} />
        <StatCard label="Avg score" value={summary.avg} suffix="%" icon={Gauge} tone="accent" delay={0.26} />
      </div>

      {history.length > 0 && (
        <BlurFade delay={0.1}>
          <div className="reg-marks rounded-xl border border-border/70 bg-card/70 p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">Status distribution</h3>
              <span className="font-mono-data text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                all time
              </span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ReTooltip
                    cursor={{ fill: 'hsl(var(--secondary) / 0.4)' }}
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '10px',
                      color: 'hsl(var(--popover-foreground))',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Audits" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {distribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLOR[entry.status] || '#2e90fa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </BlurFade>
      )}

      {/* Filters */}
      {history.length > 0 && (
        <BlurFade delay={0.12}>
          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/50 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by room or building..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {HISTORY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="sm:w-48">
                <ArrowUpDown className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="confidence">Highest confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </BlurFade>
      )}

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No completed audits yet"
          description="Once you submit inspections, they'll be archived here with their verification scores."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching audits"
          description="Try adjusting the search or status filter."
        />
      ) : (
        <BlurFade delay={0.05}>
          <div className="reg-marks overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-panel">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Location</TableHead>
                  <TableHead className="hidden sm:table-cell">Completed</TableHead>
                  <TableHead className="w-[160px]">Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((task, i) => (
                  <motion.tr
                    key={task._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/30"
                    onClick={() => openDetail(task)}
                  >
                    <TableCell>
                      <p className="flex items-center gap-1.5 font-semibold text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Room {task.roomId?.roomNumber || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.roomId?.buildingId?.name || 'Building'}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="w-[160px]">
                      {typeof confidenceOf(task) === 'number' ? (
                        <ConfidenceMeter score={confidenceOf(task)} />
                      ) : (
                        <span className="text-xs text-muted-foreground">Not scored</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </BlurFade>
      )}

      {/* Detail dialog */}
      <Dialog open={!!activeTask} onOpenChange={(o) => !o && setActiveTask(null)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          {activeTask && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Room {activeTask.roomId?.roomNumber || 'N/A'} ·{' '}
                  {activeTask.roomId?.buildingId?.name || 'Building'}
                </DialogTitle>
                <DialogDescription>
                  Archived audit submitted on{' '}
                  {new Date(activeTask.updatedAt).toLocaleString()}.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between">
                <StatusBadge status={activeTask.status} />
                <span className="font-mono-data text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                  {activeTask.checklistId?.title || 'Standard checklist'}
                </span>
              </div>

              {detailLoading ? (
                <InlineLoader label="Loading full record..." className="py-10" />
              ) : activeAudit ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <SignalTile
                      icon={QrCode}
                      label="QR tag"
                      ok={activeAudit.qrVerified}
                      value={activeAudit.qrVerified ? 'Verified' : 'Unverified'}
                    />
                    <SignalTile
                      icon={MapPin}
                      label="GPS"
                      ok={activeAudit.gpsData?.verified}
                      value={
                        activeAudit.gpsData?.verified
                          ? 'Verified match'
                          : `${activeAudit.gpsData?.distanceMeters || '—'}m away`
                      }
                    />
                    <SignalTile
                      icon={Camera}
                      label="Captures"
                      ok={(activeAudit.images?.length || 0) > 0}
                      value={`${activeAudit.images?.length || 0} images`}
                    />
                    <SignalTile
                      icon={Gauge}
                      label="Authenticity"
                      ok={(activeAudit.confidenceScore || 0) >= 70}
                      value={`${activeAudit.confidenceScore ?? 0}%`}
                    />
                  </div>

                  {typeof activeAudit.confidenceScore === 'number' && (
                    <ConfidenceMeter score={activeAudit.confidenceScore} />
                  )}

                  {activeAudit.aiAnalysis?.sceneDescription && (
                    <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs">
                      <span className="mb-1 block font-mono-data text-[0.6rem] font-bold uppercase tracking-wider text-primary">
                        VLM scene summary
                      </span>
                      <p className="text-muted-foreground">
                        {activeAudit.aiAnalysis.sceneDescription}
                      </p>
                    </div>
                  )}

                  {activeAudit.checklistAnswers?.length > 0 && (
                    <div className="space-y-2">
                      <SectionLabel>Checklist responses</SectionLabel>
                      <div className="space-y-1.5">
                        {activeAudit.checklistAnswers.map((ans, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-card/60 px-3 py-2 text-xs"
                          >
                            <span className="text-muted-foreground">{ans.question}</span>
                            <span className="font-bold uppercase text-foreground">
                              {typeof ans.answer === 'boolean'
                                ? ans.answer
                                  ? 'Yes'
                                  : 'No'
                                : ans.answer}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeAudit.images?.length > 0 && (
                    <div className="space-y-2">
                      <SectionLabel>Captured images ({activeAudit.images.length})</SectionLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {activeAudit.images.slice(0, 6).map((img, idx) => (
                          <a
                            key={idx}
                            href={img.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative h-20 overflow-hidden rounded-lg border border-border/60 bg-secondary"
                          >
                            <img
                              src={img.cloudinaryUrl}
                              alt="Capture"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                  <XCircle className="h-5 w-5" />
                  Full record unavailable for this audit.
                </div>
              )}

              {activeTask.notes && (
                <div className="border-t border-border/50 pt-3">
                  <SectionLabel>Reviewer notes</SectionLabel>
                  <p className="mt-1.5 text-xs text-muted-foreground">{activeTask.notes}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SignalTile = ({ icon: Icon, label, value, ok }) => (
  <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
    <span className="flex items-center gap-1.5 font-mono-data text-[0.6rem] uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3 w-3" /> {label}
    </span>
    <Badge variant={ok ? 'success' : 'destructive'} className="mt-2">
      {value}
    </Badge>
  </div>
);

const SectionLabel = ({ children }) => (
  <span className="block border-b border-border/40 pb-1.5 font-mono-data text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
    {children}
  </span>
);

export default AuditHistory;
