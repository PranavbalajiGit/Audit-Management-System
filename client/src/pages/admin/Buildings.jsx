import React, { useState, useEffect } from 'react';
import { buildingService } from '../../services/api';

const Buildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null); // null means creating
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const res = await buildingService.getBuildings();
      setBuildings(res.data || []);
    } catch (err) {
      setError('Failed to fetch building registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBuilding(null);
    setFormData({ name: '', code: '', address: '', description: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (building) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name,
      code: building.code,
      address: building.address || '',
      description: building.description || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this building? All rooms linked to it will require updates.')) return;
    try {
      await buildingService.deleteBuilding(id);
      fetchBuildings();
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBuilding) {
        await buildingService.updateBuilding(editingBuilding._id, formData);
      } else {
        await buildingService.createBuilding(formData);
      }
      setModalOpen(false);
      fetchBuildings();
    } catch (err) {
      alert(err.message || 'Operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-outfit text-white">Buildings Registry</h2>
          <p className="text-xs text-slate-400">Add and manage campus physical buildings and structures.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-lg transition"
        >
          Add Building
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent"></div>
          <span className="ml-3 text-sm">Loading buildings directories...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.length === 0 ? (
            <div className="col-span-full glass rounded-xl p-8 text-center text-slate-500">
              No buildings registered in the registry. Click "Add Building" to create one.
            </div>
          ) : (
            buildings.map((b) => (
              <div key={b._id} className="glass glass-hover rounded-xl p-5 border-slate-800/40 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800/20 pb-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400">
                      Code: {b.code}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-outfit leading-snug">{b.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed truncate">{b.description || 'No description provided.'}</p>
                  {b.address && <p className="text-[10px] text-slate-500">📍 {b.address}</p>}
                </div>

                <div className="flex justify-end gap-3.5 pt-4 mt-2 border-t border-slate-800/20">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CRUD Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-xl p-6 space-y-4 border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
              <h3 className="text-lg font-bold text-white font-outfit">
                {editingBuilding ? 'Edit Building details' : 'Register New Building'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Building Code</label>
                <input
                  type="text"
                  required
                  disabled={!!editingBuilding}
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. BLDG-A"
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Building Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Science Complex"
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Address / Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. North Campus, Ring Road"
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Contains Physics and Chemistry Laboratories"
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-lg"
                >
                  Save Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buildings;
