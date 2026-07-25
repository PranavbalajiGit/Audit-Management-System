import React, { useState, useEffect } from 'react';
import { checklistService } from '../../services/api';

const Checklists = () => {
  const [checklists, setChecklists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    items: []
  });

  // Checklist items editor state
  const [newItemText, setNewItemText] = useState('');
  const [newItemType, setNewItemType] = useState('boolean');
  const [newItemMandatory, setNewItemMandatory] = useState(true);

  useEffect(() => {
    fetchChecklists();
    fetchCategories();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const res = await checklistService.getChecklists();
      setChecklists(res.data || []);
    } catch (err) {
      setError('Failed to fetch audit checklists.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await checklistService.getCategories();
      setCategories(cats || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingChecklist(null);
    setFormData({
      title: '',
      categoryId: categories[0]?._id || '',
      items: []
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (chk) => {
    setEditingChecklist(chk);
    setFormData({
      title: chk.title,
      categoryId: chk.categoryId?._id || chk.categoryId || '',
      items: chk.items || []
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this checklist?')) return;
    try {
      await checklistService.deleteChecklist(id);
      fetchChecklists();
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const item = {
      question: newItemText.trim(),
      type: newItemType,
      mandatory: newItemMandatory
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, item] }));
    setNewItemText('');
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('A checklist template must contain at least one question.');
      return;
    }

    try {
      if (editingChecklist) {
        await checklistService.updateChecklist(editingChecklist._id, formData);
      } else {
        await checklistService.createChecklist(formData);
      }
      setModalOpen(false);
      fetchChecklists();
    } catch (err) {
      alert(err.message || 'Operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-outfit text-white">Checklists Templates</h2>
          <p className="text-xs text-slate-400">Design inspection check templates with structured question nodes.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-lg transition"
        >
          Build Checklist
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
          <span className="ml-3 text-sm">Loading checklists templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklists.length === 0 ? (
            <div className="col-span-full glass rounded-xl p-8 text-center text-slate-500">
              No checklist templates configured.
            </div>
          ) : (
            checklists.map((chk) => (
              <div key={chk._id} className="glass glass-hover rounded-xl p-5 border-slate-800/40 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400">
                      Category: {chk.categoryId?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">
                      {chk.items?.length || 0} Questions
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-outfit leading-snug">{chk.title}</h4>
                  
                  {/* Small items preview list */}
                  <ul className="text-xs text-slate-400 space-y-1 bg-slate-900/30 rounded-lg p-2.5 border border-slate-800/40">
                    {chk.items?.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="truncate">• {item.question}</li>
                    ))}
                    {chk.items?.length > 3 && <li className="text-[10px] text-indigo-400 italic font-semibold">and {chk.items.length - 3} more...</li>}
                  </ul>
                </div>

                <div className="flex justify-end gap-3.5 pt-4 mt-2 border-t border-slate-800/20">
                  <button
                    onClick={() => handleOpenEdit(chk)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Edit Template
                  </button>
                  <button
                    onClick={() => handleDelete(chk._id)}
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
          <div className="glass w-full max-w-lg rounded-xl p-6 space-y-4 border-slate-800 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
              <h3 className="text-lg font-bold text-white font-outfit">
                {editingChecklist ? 'Modify Checklist Template' : 'Build Checklist Template'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Template Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Electrical Lab Audit"
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Space Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Items Builder */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/10 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800/50 pb-1.5">Questions Editor</span>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Enter question text (e.g. Is fire equipment active?)"
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="boolean">Yes / No</option>
                    <option value="text">Text Response</option>
                    <option value="number">Numeric Val</option>
                  </select>
                  <label className="flex items-center gap-1.5 select-none px-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={newItemMandatory}
                      onChange={(e) => setNewItemMandatory(e.target.checked)}
                      className="rounded accent-indigo-600 bg-slate-900"
                    />
                    Mandatory
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow"
                  >
                    Add
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {formData.items.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic p-3 text-center">Add questions using the input fields above.</p>
                  ) : (
                    formData.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 p-2 rounded bg-slate-900/50 border border-slate-800/40 text-xs">
                        <div className="truncate flex-1">
                          <span className="font-semibold text-slate-200">{idx + 1}. {item.question}</span>
                          <span className="text-[9px] text-slate-500 ml-2 font-medium">({item.type}{item.mandatory ? ', mandatory' : ''})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-400 hover:text-red-300 font-bold shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
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
                  Save Checklist Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklists;
