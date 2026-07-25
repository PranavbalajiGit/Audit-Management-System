import React, { useState, useEffect } from 'react';
import { analyticsService, auditService } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

// Custom markers for different audit statuses on the map
const getMarkerIcon = (status) => {
  let color = 'indigo';
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
    shadowSize: [41, 41]
  });
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsData = await analyticsService.getDashboardStats();
      const trendsData = await analyticsService.getTrends();
      const auditsData = await auditService.getAudits({ limit: 5 });

      setStats(statsData);
      setTrends(trendsData);
      setRecentAudits(auditsData.data || []);
    } catch (err) {
      setError('Failed to fetch dashboard metrics. Verify backend connections.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent"></div>
        <span className="ml-3 text-sm">Aggregating dashboard analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-6 text-center max-w-md mx-auto border-red-500/20 text-red-400">
        <p className="text-sm font-semibold">{error}</p>
        <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white">
          Retry Connection
        </button>
      </div>
    );
  }

  // Calculate default map center based on recent audits or a standard center
  const mapCenter = recentAudits.length > 0 && recentAudits[0].roomId?.latitude
    ? [recentAudits[0].roomId.latitude, recentAudits[0].roomId.longitude]
    : [11.0168, 76.9558]; // Standard institutional latitude/longitude default

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 sm:p-5 flex flex-col justify-between border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-bl-full group-hover:scale-110 transition duration-300"></div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Rooms Audited</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-outfit mt-2">
            {(stats.statusCounts.Approved + stats.statusCounts.ReviewRequired + stats.statusCounts.Rejected) || 0}
            <span className="text-xs font-normal text-slate-500 ml-1">/ {stats.roomsCount}</span>
          </span>
        </div>

        <div className="glass rounded-xl p-4 sm:p-5 flex flex-col justify-between border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full group-hover:scale-110 transition duration-300"></div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Auto Approved</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-outfit mt-2">
            {stats.statusCounts.Approved}
          </span>
        </div>

        <div className="glass rounded-xl p-4 sm:p-5 flex flex-col justify-between border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full group-hover:scale-110 transition duration-300"></div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-outfit mt-2">
            {stats.statusCounts.ReviewRequired}
          </span>
        </div>

        <div className="glass rounded-xl p-4 sm:p-5 flex flex-col justify-between border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-bl-full group-hover:scale-110 transition duration-300"></div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Confidence</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-outfit mt-2">
            {stats.averageConfidence}%
          </span>
        </div>
      </div>

      {/* Campus Map & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Campus Leaflet Map */}
        <div className="glass rounded-xl p-5 border-slate-800/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-outfit">Campus Inspection Map</h3>
            <div className="flex gap-2.5 text-[9px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Approved</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Review</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Failed</span>
            </div>
          </div>
          
          <div className="h-72 rounded-lg overflow-hidden border border-slate-800/40">
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
                      <div className="text-slate-900 font-inter text-xs space-y-0.5">
                        <p className="font-bold text-sm">Room {audit.roomId.roomNumber}</p>
                        <p className="text-slate-600">{audit.roomId.buildingId?.name}</p>
                        <p className="text-slate-500 font-medium">Auditor: {audit.auditorId?.name}</p>
                        <p className="pt-1"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                          audit.status === 'Approved' ? 'bg-emerald-600' :
                          audit.status === 'Review Required' ? 'bg-amber-600' : 'bg-red-600'
                        }`}>{audit.status}</span></p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Audit Completion Trends Line Chart */}
        <div className="glass rounded-xl p-5 border-slate-800/40 space-y-4">
          <h3 className="text-base font-bold text-white font-outfit">Audit Completion Trends</h3>
          <div className="h-72 w-full pr-4">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">No trend data available for the last 7 days</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    labelClassName="font-bold"
                  />
                  <Line type="monotone" dataKey="count" name="Inspections Completed" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#4f46e5', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Audit Submissions Table */}
      <section className="glass rounded-xl border border-slate-800/40 overflow-hidden">
        <div className="flex h-12 items-center justify-between px-5 border-b border-slate-800/40 bg-slate-900/40">
          <h3 className="text-sm font-bold text-white font-outfit">Recent Inspection Requests</h3>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Latest updates</span>
        </div>
        
        {recentAudits.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No audits submitted in the system yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/20 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/30">
                <tr>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Auditor</th>
                  <th className="px-5 py-3">Date Submitted</th>
                  <th className="px-5 py-3">Confidence Score</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {recentAudits.map((audit) => (
                  <tr key={audit._id} className="hover:bg-slate-900/10 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-white">Room {audit.roomId?.roomNumber}</p>
                      <p className="text-xs text-slate-400">{audit.roomId?.buildingId?.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-200">{audit.auditorId?.name}</p>
                      <p className="text-xs text-slate-500">{audit.auditorId?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {audit.submittedAt ? new Date(audit.submittedAt).toLocaleDateString() : 'In Progress'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                          audit.confidenceScore >= 90 ? 'bg-emerald-500' : audit.confidenceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`}></span>
                        <span className="font-bold text-slate-200">{audit.confidenceScore}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        audit.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        audit.status === 'Review Required' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        audit.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {audit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
