import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null means creating
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Auditor',
    status: 'Active'
  });
  
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError('Failed to load user directories.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesData = await userService.getRoles();
      setRoles(rolesData || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'Auditor',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Keep empty unless updating
      phone: user.phone || '',
      role: user.role || 'Auditor',
      status: user.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user
        const updatePayload = { ...formData };
        if (!updatePayload.password) {
          delete updatePayload.password; // Do not update password if left empty
        }
        await userService.updateUser(editingUser.id, updatePayload);
      } else {
        // Create user
        if (!formData.password) {
          alert('Password is required for new users.');
          return;
        }
        await userService.createUser(formData);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-outfit text-white">User Accounts</h2>
          <p className="text-xs text-slate-400">Manage institution administrators and field auditors.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-lg transition"
        >
          Add User Account
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
          <span className="ml-3 text-sm">Loading user registries...</span>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden border-slate-800/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/10 transition">
                    <td className="px-5 py-3.5 font-semibold text-white">{item.name}</td>
                    <td className="px-5 py-3.5 text-slate-400">{item.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                        item.role === 'Admin' 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{item.phone || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`h-2 w-2 rounded-full inline-block mr-1.5 ${
                        item.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}></span>
                      {item.status}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
                {editingUser ? 'Edit User Profile' : 'Register New User'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Display Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. john@s7.com"
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Password {editingUser && '(Leave blank to retain current)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +123456789"
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Access Level (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Auditor">Auditor (Field Staff)</option>
                    <option value="Admin">Admin (Full Control)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
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
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
