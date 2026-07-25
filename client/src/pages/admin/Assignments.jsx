import React, { useState, useEffect } from 'react';
import { auditService, userService, roomService, checklistService } from '../../services/api';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    auditorId: '',
    roomId: '',
    checklistId: '',
    dueDate: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchFormDropdowns();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await auditService.getAssignments();
      setAssignments(res.data || []);
    } catch (err) {
      setError('Failed to fetch assignments list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormDropdowns = async () => {
    try {
      const auds = await userService.getUsers({ role: 'Auditor' });
      const rms = await roomService.getRooms();
      const chks = await checklistService.getChecklists();

      setAuditors(auds.data || []);
      setRooms(rms.data || []);
      setChecklists(chks.data || []);

      // Set initial form selection
      setFormData({
        auditorId: auds.data?.[0]?.id || '',
        roomId: rms.data?.[0]?._id || '',
        checklistId: chks.data?.[0]?._id || '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default 1 week out
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.auditorId || !formData.roomId || !formData.checklistId || !formData.dueDate) {
      alert('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    try {
      await auditService.createAssignment(formData);
      // Reset form (re-fetch to show new data)
      fetchAssignments();
      alert('Audit assignment created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <section className="glass rounded-xl p-5 border-slate-800/40 space-y-4 lg:col-span-1 h-fit">
          <div>
            <h3 className="text-base font-bold text-white font-outfit">Assign Room Audit</h3>
            <p className="text-xs text-slate-400">Allocate room inspections to active field auditors.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Select Auditor</label>
              <select
                required
                value={formData.auditorId}
                onChange={(e) => setFormData(prev => ({ ...prev, auditorId: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                {auditors.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Select Room</label>
              <select
                required
                value={formData.roomId}
                onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>Room {r.roomNumber} - {r.buildingId?.name} ({r.roomType})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Select Checklist</label>
              <select
                required
                value={formData.checklistId}
                onChange={(e) => setFormData(prev => ({ ...prev, checklistId: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                {checklists.map(c => (
                  <option key={c._id} value={c._id}>{c.title} ({c.categoryId?.name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold rounded-lg text-white shadow-lg transition duration-200"
            >
              {submitting ? 'Creating Assignment...' : 'Assign Inspection'}
            </button>
          </form>
        </section>

        {/* List panel */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-outfit">Active Assignments List</h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Overall view</span>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-slate-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              <span className="ml-3 text-xs">Loading assignments...</span>
            </div>
          ) : (
            <div className="glass rounded-xl border border-slate-800/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
                    <tr>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Auditor</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center p-8 text-slate-500">No inspections assigned yet.</td>
                      </tr>
                    ) : (
                      assignments.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-900/10 transition">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-white">Room {item.roomId?.roomNumber}</p>
                            <p className="text-xs text-slate-400">{item.roomId?.buildingId?.name}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-200">{item.auditorId?.name}</p>
                            <p className="text-[10px] text-slate-500">{item.auditorId?.email}</p>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 text-xs">
                            {new Date(item.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              item.status === 'Review Required' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              item.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              item.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              'bg-slate-900 border-slate-800 text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Assignments;
