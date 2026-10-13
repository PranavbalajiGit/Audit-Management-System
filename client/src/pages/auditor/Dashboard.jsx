import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  History,
  RefreshCw,
  Play,
  Plus,
  MapPin,
  Building2,
  CalendarClock,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { auditService } from '../../services/api';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { BlurFade } from '@/components/fx/blur-fade';
import { SpotlightCard } from '@/components/fx/spotlight-card';
import { BorderBeam } from '@/components/fx/border-beam';
import { Button } from '@/components/ui/button';

const AuditorDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await auditService.getAssignments();
      const list = res.data || [];
      setAssignments(list.filter((item) => ['Assigned', 'In Progress'].includes(item.status)));
      setHistory(
        list.filter((item) =>
          ['Submitted', 'Approved', 'Review Required', 'Rejected'].includes(item.status)
        )
      );
    } catch (err) {
      setError('Failed to fetch assignments. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartResume = async (task) => {
    try {
      if (task.auditId) {
        navigate(`/auditor/audits/${task.auditId._id || task.auditId}`);
      } else {
        const audit = await auditService.startAudit(task._id);
        navigate(`/auditor/audits/${audit._id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to start audit session.');
    }
  };

  const avgConfidence = history.length
    ? Math.round(
        history.reduce((sum, t) => sum + (t.auditId?.confidenceScore || 0), 0) / history.length
      )
    : 0;

  if (loading) return <LoadingScreen label="Loading assigned inspections..." />;

  return (
    <div className="space-y-6">
      <BlurFade>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-success/90">
              Field workspace
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
              Inspection queue
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an assigned location to run QR, GPS and capture verification.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" /> Refresh tasks
          </Button>
        </div>
      </BlurFade>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active" value={assignments.length} icon={ClipboardList} tone="primary" delay={0.05} />
        <StatCard label="Completed" value={history.length} icon={History} tone="success" delay={0.12} />
        <StatCard label="Avg score" value={avgConfidence} suffix="%" icon={Compass} tone="accent" delay={0.19} />
      </div>

      {/* Active inspections */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Active inspections ({assignments.length})
        </h3>

        {assignments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No active audit tasks"
            description="When an administrator assigns inspections to you, they'll appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {assignments.map((task, i) => {
              const inProgress = task.status === 'In Progress';
              return (
                <BlurFade key={task._id} delay={i * 0.06}>
                  <SpotlightCard className="reg-marks relative h-full rounded-xl border border-border/70 bg-card/70 p-5 shadow-panel transition-colors hover:border-success/40">
                    {inProgress && <BorderBeam duration={9} />}
                    <div className="flex items-start justify-between gap-3">
                      <StatusBadge status={task.status} />
                      <span className="flex items-center gap-1 font-mono-data text-[0.65rem] text-muted-foreground">
                        <CalendarClock className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-display text-xl font-bold leading-tight text-foreground">
                        Room {task.roomId?.roomNumber || 'N/A'}
                      </h4>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                        <Building2 className="h-3.5 w-3.5" />
                        {task.roomId?.buildingId?.name || 'Building'}
                        <span className="text-muted-foreground">
                          ({task.roomId?.buildingId?.code || 'BLDG'})
                        </span>
                      </p>
                    </div>

                    <div className="my-4 grid grid-cols-2 gap-3 border-y border-border/50 py-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Room type</p>
                        <p className="mt-0.5 font-semibold text-foreground">
                          {task.roomId?.roomType || 'Other'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Checklist</p>
                        <p className="mt-0.5 truncate font-semibold text-foreground">
                          {task.checklistId?.title || 'Standard'}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleStartResume(task)}
                      variant={inProgress ? 'beacon' : 'default'}
                      className="w-full"
                    >
                      {inProgress ? <Play className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {inProgress ? 'Resume verification' : 'Start inspection'}
                    </Button>
                  </SpotlightCard>
                </BlurFade>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent completions preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            Recent completions
          </h3>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auditor/history">
              View all history <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No completed audits"
            description="Finished inspections and their authenticity scores show up here."
          />
        ) : (
          <BlurFade>
            <div className="reg-marks divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-panel">
              {history.slice(0, 4).map((task) => (
                <Link
                  key={task._id}
                  to="/auditor/history"
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground ring-1 ring-border">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        Room {task.roomId?.roomNumber || 'N/A'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {task.roomId?.buildingId?.name || 'Building'} ·{' '}
                        {new Date(task.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </Link>
              ))}
            </div>
          </BlurFade>
        )}
      </section>
    </div>
  );
};

export default AuditorDashboard;
