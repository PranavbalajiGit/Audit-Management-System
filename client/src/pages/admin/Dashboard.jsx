import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  ShieldCheck,
  Clock3,
  Gauge,
  RefreshCw,
  Map as MapIcon,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { analyticsService, auditService } from '../../services/api';
import { StatCard } from '@/components/StatCard';
import { StatusBadge, ConfidenceMeter } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { BlurFade } from '@/components/fx/blur-fade';
import { SpotlightCard } from '@/components/fx/spotlight-card';
import { Marquee } from '@/components/fx/marquee';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const getMarkerIcon = (status) => {
  let color = 'blue';
  if (status === 'Approved') color = 'green';
  else if (status === 'Review Required') color = 'orange';
  else if (status === 'Rejected') color = 'red';
  else if (status === 'In Progress') color = 'yellow';

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [statsData, trendsData, auditsData] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getTrends(),
        auditService.getAudits({ limit: 6 }),
      ]);
      setStats(statsData);
      setTrends(trendsData);
      setRecentAudits(auditsData.data || []);
    } catch (err) {
      setError('Failed to fetch dashboard metrics. Verify backend connections.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingScreen label="Aggregating audit telemetry..." />;

  if (error) {
    return (
      <div className="reg-marks mx-auto max-w-md rounded-xl border border-destructive/25 bg-destructive/5 p-8 text-center">
        <p className="font-display text-sm font-semibold text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchDashboardData()}>
          <RefreshCw className="h-4 w-4" /> Retry connection
        </Button>
      </div>
    );
  }

  const audited =
    stats.statusCounts.Approved +
      stats.statusCounts.ReviewRequired +
      stats.statusCounts.Rejected || 0;

  const mapCenter =
    recentAudits.length > 0 && recentAudits[0].roomId?.latitude
      ? [recentAudits[0].roomId.latitude, recentAudits[0].roomId.longitude]
      : [11.0168, 76.9558];

  const coverage = stats.roomsCount ? Math.round((audited / stats.roomsCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <BlurFade>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-primary/80">
              Operations overview
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
              Compliance command center
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Live status of every inspection across mapped infrastructure.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Syncing' : 'Refresh'}
          </Button>
        </div>
      </BlurFade>

      {/* Ticker */}
      <BlurFade delay={0.05}>
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card/40 py-2.5">
          <Marquee duration={38} gap="2.5rem">
            {[
              `${stats.roomsCount} rooms mapped`,
              `${stats.statusCounts.Approved} auto-approved`,
              `${stats.statusCounts.ReviewRequired} awaiting review`,
              `${coverage}% coverage`,
              `${stats.averageConfidence}% average confidence`,
              'QR + GPS verified',
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-2 whitespace-nowrap font-mono-data text-xs uppercase tracking-wider text-muted-foreground"
              >
                <span className="h-1 w-1 rounded-full bg-accent" />
                {t}
              </span>
            ))}
          </Marquee>
        </div>
      </BlurFade>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Rooms audited"
          value={audited}
          suffix=""
          hint={`of ${stats.roomsCount} mapped`}
          icon={DoorOpen}
          tone="primary"
          delay={0.05}
        />
        <StatCard
          label="Auto approved"
          value={stats.statusCounts.Approved}
          hint="score ≥ 90%"
          icon={ShieldCheck}
          tone="success"
          delay={0.12}
        />
        <StatCard
          label="Pending review"
          value={stats.statusCounts.ReviewRequired}
          hint="needs a human call"
          icon={Clock3}
          tone="warning"
          delay={0.19}
        />
        <StatCard
          label="Avg confidence"
          value={stats.averageConfidence}
          suffix="%"
          hint="across submissions"
          icon={Gauge}
          tone="accent"
          delay={0.26}
        />
      </div>

      {/* Map + trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BlurFade delay={0.1}>
          <SpotlightCard className="reg-marks h-full rounded-xl border border-border/70 bg-card/70 p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                <MapIcon className="h-4 w-4 text-primary" /> Campus inspection map
              </h3>
              <div className="flex gap-3 font-mono-data text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Approved
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Review
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Failed
                </span>
              </div>
            </div>
            <div className="h-72 overflow-hidden rounded-lg border border-border/60">
              <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {recentAudits.map((audit) => {
                  if (!audit.roomId?.latitude) return null;
                  return (
                    <Marker
                      key={audit._id}
                      position={[audit.roomId.latitude, audit.roomId.longitude]}
                      icon={getMarkerIcon(audit.status)}
                    >
                      <Popup>
                        <div className="space-y-1 font-sans text-xs">
                          <p className="font-display text-sm font-bold">
                            Room {audit.roomId.roomNumber}
                          </p>
                          <p className="text-muted-foreground">
                            {audit.roomId.buildingId?.name}
                          </p>
                          <p className="text-muted-foreground">
                            Auditor: {audit.auditorId?.name}
                          </p>
                          <p className="pt-0.5 font-semibold">{audit.status}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </SpotlightCard>
        </BlurFade>

        <BlurFade delay={0.16}>
          <SpotlightCard className="reg-marks h-full rounded-xl border border-border/70 bg-card/70 p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" /> Completion trends
              </h3>
              <span className="font-mono-data text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                last 7 days
              </span>
            </div>
            <div className="h-72 w-full pr-2">
              {trends.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No trend data yet"
                  description="Inspections completed in the last 7 days will appear here."
                  className="h-full border-0 bg-transparent"
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2E90FA" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2E90FA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2a3d" opacity={0.5} vertical={false} />
                    <XAxis dataKey="date" stroke="#8da0b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8da0b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ReTooltip
                      contentStyle={{
                        background: 'hsl(217 46% 9%)',
                        borderColor: 'hsl(213 34% 20%)',
                        borderRadius: '10px',
                        color: '#e6edf6',
                        fontSize: '12px',
                      }}
                      labelClassName="font-semibold"
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Inspections"
                      stroke="#2E90FA"
                      strokeWidth={2.5}
                      fill="url(#trendFill)"
                      dot={{ fill: '#2E90FA', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </SpotlightCard>
        </BlurFade>
      </div>

      {/* Recent submissions */}
      <BlurFade delay={0.12}>
        <section className="reg-marks overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-panel">
          <div className="flex h-14 items-center justify-between border-b border-border/60 px-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
              <Activity className="h-4 w-4 text-primary" /> Recent inspection requests
            </h3>
            <span className="font-mono-data text-[0.6rem] uppercase tracking-wider text-muted-foreground">
              live feed
            </span>
          </div>

          {recentAudits.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="No audits submitted yet"
              description="Once auditors submit inspections, they'll surface here."
              className="border-0 bg-transparent"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Location</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead className="hidden md:table-cell">Submitted</TableHead>
                  <TableHead className="w-[160px]">Confidence</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAudits.map((audit, i) => (
                  <motion.tr
                    key={audit._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                  >
                    <TableCell>
                      <p className="font-semibold text-foreground">
                        Room {audit.roomId?.roomNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {audit.roomId?.buildingId?.name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{audit.auditorId?.name}</p>
                      <p className="text-xs text-muted-foreground">{audit.auditorId?.email}</p>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {audit.submittedAt
                        ? new Date(audit.submittedAt).toLocaleDateString()
                        : 'In progress'}
                    </TableCell>
                    <TableCell className="w-[160px]">
                      <ConfidenceMeter score={audit.confidenceScore} />
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={audit.status} />
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </BlurFade>
    </div>
  );
};

export default AdminDashboard;
