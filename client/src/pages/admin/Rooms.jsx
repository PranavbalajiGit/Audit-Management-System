import React, { useState, useEffect } from 'react';
import { roomService, buildingService } from '../../services/api';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
  // QR View Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQr, setActiveQr] = useState(null);

  const [formData, setFormData] = useState({
    buildingId: '',
    roomNumber: '',
    roomType: 'Classroom',
    latitude: '',
    longitude: '',
    referenceImages: []
  });

  useEffect(() => {
    fetchRooms();
    fetchBuildings();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await roomService.getRooms();
      setRooms(res.data || []);
    } catch (err) {
      setError('Failed to fetch rooms registry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await buildingService.getBuildings();
      setBuildings(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormData({
      buildingId: buildings[0]?._id || '',
      roomNumber: '',
      roomType: 'Classroom',
      latitude: '11.0168', // default coordinates
      longitude: '76.9558',
      referenceImages: []
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      buildingId: room.buildingId?._id || room.buildingId || '',
      roomNumber: room.roomNumber,
      roomType: room.roomType || 'Classroom',
      latitude: room.latitude || '',
      longitude: room.longitude || '',
      referenceImages: room.referenceImages || []
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await roomService.deleteRoom(id);
      fetchRooms();
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom._id, formData);
      } else {
        await roomService.createRoom(formData);
      }
      setModalOpen(false);
      fetchRooms();
    } catch (err) {
      alert(err.message || 'Operation failed.');
    }
  };

  const showQr = (room) => {
    if (room.qrCodeId) {
      setActiveQr({
        roomNumber: room.roomNumber,
        buildingName: room.buildingId?.name,
        code: room.qrCodeId.encodedData
      });
      setQrModalOpen(true);
    } else {
      alert('QR Code not generated yet. Try re-saving this room.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-outfit text-white">Campus Rooms</h2>
          <p className="text-xs text-slate-400">Manage rooms, registered GPS coordinates, and view QR tags.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-lg transition"
        >
          Add Room
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
          <span className="ml-3 text-sm">Loading rooms registry...</span>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden border-slate-800/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
                <tr>
                  <th className="px-5 py-3">Room Number</th>
                  <th className="px-5 py-3">Building</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Coordinates (Lat, Lon)</th>
                  <th className="px-5 py-3 text-center">QR Tag</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {rooms.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-900/10 transition">
                    <td className="px-5 py-3.5 font-semibold text-white">Room {item.roomNumber}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {item.buildingId?.name} ({item.buildingId?.code})
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300">
                        {item.roomType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                      {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => showQr(item)}
                        className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded text-xs font-semibold"
                      >
                        View QR Code
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-xl p-6 space-y-4 border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
              <h3 className="text-lg font-bold text-white font-outfit">
                {editingRoom ? 'Edit Room details' : 'Register New Room'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Parent Building</label>
                <select
                  required
                  value={formData.buildingId}
                  onChange={(e) => setFormData(prev => ({ ...prev, buildingId: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {buildings.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Room Number / ID</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                    placeholder="e.g. 101"
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Room Type</label>
                  <select
                    value={formData.roomType}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomType: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Library">Library</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Latitude Coordinate</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="e.g. 11.0168"
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Longitude Coordinate</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="e.g. 76.9558"
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
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
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Viewer Modal */}
      {qrModalOpen && activeQr && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-xl p-6 text-center space-y-4 border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">Room QR Signboard</h4>
              <button onClick={() => setQrModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ×
              </button>
            </div>
            
            <div className="p-3 bg-white rounded-xl inline-block shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeQr.code)}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-white font-outfit text-lg">Room {activeQr.roomNumber}</h5>
              <p className="text-xs text-slate-400">{activeQr.buildingName}</p>
            </div>

            <div className="bg-slate-900 rounded-lg p-2.5 text-left border border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">QR Data Payload:</span>
              <code className="text-xs text-indigo-400 font-mono break-all">{activeQr.code}</code>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white"
            >
              Print Room Signboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
