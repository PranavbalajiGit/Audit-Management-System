import React, { useState, useEffect } from 'react';
import {
  ListChecks,
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

import { checklistService } from '../../services/api';
import { AppModal, Field } from '@/components/AppModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { BlurFade } from '@/components/fx/blur-fade';
import { Stagger, StaggerItem } from '@/components/fx/stagger';
import { SpotlightCard } from '@/components/fx/spotlight-card';
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

const emptyForm = { title: '', categoryId: '', items: [] };

const typeLabel = { boolean: 'Yes / No', text: 'Text', number: 'Numeric' };

const Checklists = () => {
  const [checklists, setChecklists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

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
    setFormData({ title: '', categoryId: categories[0]?._id || '', items: [] });
    setNewItemText('');
    setModalOpen(true);
  };

  const handleOpenEdit = (chk) => {
    setEditingChecklist(chk);
    setFormData({
      title: chk.title,
      categoryId: chk.categoryId?._id || chk.categoryId || '',
      items: chk.items || [],
    });
    setNewItemText('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this checklist template?')) return;
    try {
      await checklistService.deleteChecklist(id);
      toast.success('Checklist deleted');
      fetchChecklists();
    } catch (err) {
      toast.error(err.message || 'Deletion failed.');
    }
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { question: newItemText.trim(), type: newItemType, mandatory: newItemMandatory },
      ],
    }));
    setNewItemText('');
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error('A checklist template must contain at least one question.');
      return;
    }
    try {
      if (editingChecklist) {
        await checklistService.updateChecklist(editingChecklist._id, formData);
        toast.success('Checklist updated');
      } else {
        await checklistService.createChecklist(formData);
        toast.success('Checklist created');
      }
      setModalOpen(false);
      fetchChecklists();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <BlurFade>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
              Templates · {checklists.length} designs
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Checklists</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Design inspection templates with structured question nodes.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Build checklist
          </Button>
        </div>
      </BlurFade>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingScreen label="Loading checklist templates..." />
      ) : checklists.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No checklist templates"
          description="Build a template to standardize how auditors inspect each space."
          action={
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Build checklist
            </Button>
          }
        />
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {checklists.map((chk) => (
            <StaggerItem key={chk._id}>
              <SpotlightCard className="reg-marks flex h-full flex-col justify-between rounded-xl border border-border/70 bg-card/70 p-5 shadow-panel transition-colors hover:border-primary/35">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="info">
                      <Sparkles className="h-3 w-3" /> {chk.categoryId?.name || 'Uncategorized'}
                    </Badge>
                    <span className="font-mono-data text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      {chk.items?.length || 0} questions
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold leading-snug text-foreground">
                    {chk.title}
                  </h4>

                  <ul className="space-y-1 rounded-lg border border-border/50 bg-secondary/30 p-3 text-xs text-muted-foreground">
                    {chk.items?.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="truncate">
                        • {item.question}
                      </li>
                    ))}
                    {chk.items?.length > 3 && (
                      <li className="font-semibold italic text-primary">
                        and {chk.items.length - 3} more…
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-border/40 pt-3">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(chk)}>
                    <Pencil className="h-3.5 w-3.5 text-primary" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(chk._id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete
                  </Button>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingChecklist ? 'Modify checklist template' : 'Build checklist template'}
        description="Compose the questions auditors must answer for this space type."
        icon={ListChecks}
        className="max-w-lg"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="checklist-form">
              Save template
            </Button>
          </>
        }
      >
        <form id="checklist-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Template title" required>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Electrical Lab Audit"
              />
            </Field>
            <Field label="Space category" required>
              <Select
                value={formData.categoryId}
                onValueChange={(v) => setFormData((p) => ({ ...p, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-4">
            <span className="block border-b border-border/50 pb-2 font-mono-data text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
              Questions editor
            </span>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                placeholder="e.g. Is fire equipment active?"
                className="flex-1"
              />
              <Select value={newItemType} onValueChange={setNewItemType}>
                <SelectTrigger className="sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Yes / No</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Numeric</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="secondary" onClick={handleAddItem}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            <label className="flex select-none items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={newItemMandatory}
                onChange={(e) => setNewItemMandatory(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border accent-primary"
              />
              Mandatory question
            </label>

            <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {formData.items.length === 0 ? (
                <p className="p-3 text-center text-xs italic text-muted-foreground">
                  Add questions using the field above.
                </p>
              ) : (
                formData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-card/70 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground">
                        {idx + 1}. {item.question}
                      </span>
                      <span className="ml-2 font-mono-data text-[0.6rem] text-muted-foreground">
                        ({typeLabel[item.type] || item.type}
                        {item.mandatory ? ', required' : ''})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="shrink-0 text-destructive transition-colors hover:text-destructive/80"
                      aria-label="Remove question"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <p className="flex items-center gap-1 font-mono-data text-[0.6rem] uppercase tracking-wider text-muted-foreground">
              <Hash className="h-3 w-3" /> {formData.items.length} question node
              {formData.items.length === 1 ? '' : 's'}
            </p>
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default Checklists;
