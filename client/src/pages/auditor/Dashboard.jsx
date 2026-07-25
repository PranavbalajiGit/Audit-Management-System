import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditService } from '../../services/api';

const Dashboard = () => {
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
      // Fetch all assignments for current auditor
      const res = await auditService.getAssignments();
      const list = res.data || [];
      
      // Split into active and history
      const activeTasks = list.filter(item => ['Assigned', 'In Progress'].includes(item.status));
      const finishedTasks = list.filter(item => ['Submitted', 'Approved', 'Review Required', 'Rejected'].includes(item.status));
      
      setAssignments(activeTasks);
      setHistory(finishedTasks);
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
        // Resume audit
        navigate(`/auditor/audits/${task.auditId._id || task.auditId}`);
      } else {
        // Start audit
        const audit = await auditService.startAudit(task._id);
        navigate(`/auditor/audits/${audit._id}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to start audit session.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-white">Auditor Dashboard</h2>
          <p className="text-slate-400 text-sm">Select an assigned location to perform QR and location verification.</p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition duration-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
          </svg>
          Refresh Tasks
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent"></div>
          <span className="ml-3 text-sm">Loading assigned inspections...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Active Tasks */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Active Inspections ({assignments.length})
            </h3>
            
            {assignments.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-slate-500 border-dashed">
                <svg className="mx-auto h-12 w-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No active audit tasks assigned.</p>
                <p className="text-xs text-slate-600 mt-1">Please contact your administrator if you believe this is an error.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((task) => (
                  <div key={task._id} className="glass glass-hover rounded-xl p-5 flex flex-col justify-between border-slate-800/40">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          task.status === 'In Progress' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {task.status}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-bold text-white font-outfit leading-tight">
                          Room {task.roomId?.roomNumber || 'N/A'}
                        </h4>
                        <p className="text-xs text-indigo-400 font-medium mt-0.5">
                          {task.roomId?.buildingId?.name || 'Building'} ({task.roomId?.buildingId?.code || 'BLDG'})
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-800/30 py-2.5 my-1">
                        <div>
                          <p className="text-slate-500">Room Type</p>
                          <p className="font-semibold text-slate-300 mt-0.5">{task.roomId?.roomType || 'Other'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Checklist Template</p>
                          <p className="font-semibold text-slate-300 mt-0.5 truncate">{task.checklistId?.title || 'Standard'}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartResume(task)}
                      className={`mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white shadow-md transition duration-200 ${
                        task.status === 'In Progress'
                          ? 'bg-amber-600 hover:bg-amber-500 hover:shadow-amber-600/10'
                          : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-600/10'
                      }`}
                    >
                      {task.status === 'In Progress' ? (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          Resume Verification
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Start Inspection
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Audit History */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-500"></span>
              Audit History ({history.length})
            </h3>

            {history.length === 0 ? (
              <div className="glass rounded-xl p-6 text-center text-slate-500">
                <p className="text-sm">No completed audits in your history yet.</p>
              </div>
            ) : (
              <div className="glass rounded-xl overflow-hidden border-slate-800/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
                      <tr>
                        <th className="px-5 py-3">Location</th>
                        <th className="px-5 py-3">Date Completed</th>
                        <th className="px-5 py-3">Confidence Score</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {history.map((task) => (
                        <tr key={task._id} className="hover:bg-slate-900/20 transition-all">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-white">Room {task.roomId?.roomNumber || 'N/A'}</p>
                            <p className="text-xs text-slate-400">{task.roomId?.buildingId?.name || 'Building'}</p>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400">
                            {new Date(task.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5">
                            {task.auditId?.confidenceScore !== undefined ? (
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${
                                  task.auditId.confidenceScore >= 90 ? 'bg-emerald-500' : task.auditId.confidenceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                }`}></span>
                                <span className="font-bold text-slate-200">{task.auditId.confidenceScore}%</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              task.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              task.status === 'Review Required' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              task.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                              {task.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
