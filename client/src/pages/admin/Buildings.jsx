import React, { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Trash2, MapPin, Hash } from 'lucide-react';
import { toast } from 'sonner';

import { buildingService } from '../../services/api';
import { AppModal, Field } from '@/components/AppModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { BlurFade } from '@/components/fx/blur-fade';
import { Stagger, StaggerItem } from '@/components/fx/stagger';
import { SpotlightCard } from '@/components/fx/spotlight-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const emptyForm = { name: '', code: '', address: '', description: '' };

const Buildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

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
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (building) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name,
      code: building.code,
      address: building.address || '',
      description: building.description || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this building? All rooms linked to it will require updates.')) return;
    try {
      await buildingService.deleteBuilding(id);
      toast.success('Building removed');
      fetchBuildings();
    } catch (err) {
      toast.error(err.message || 'Deletion failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBuilding) {
        await buildingService.updateBuilding(editingBuilding._id, formData);
        toast.success('Building updated');
      } else {
        await buildingService.createBuilding(formData);
        toast.success('Building registered');
      }
      setModalOpen(false);
      fetchBuildings();
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
              Registry · {buildings.length} structures
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Buildings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add and manage campus buildings and physical structures.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Add building
          </Button>
        </div>
      </BlurFade>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingScreen label="Loading buildings directory..." />
      ) : buildings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No buildings registered"
          description="Register your first campus building to start mapping rooms."
          action={
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Add building
            </Button>
          }
        />
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {buildings.map((b) => (
            <StaggerItem key={b._id}>
              <SpotlightCard className="reg-marks flex h-full flex-col justify-between rounded-xl border border-border/70 bg-card/70 p-5 shadow-panel transition-colors hover:border-primary/35">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-3">
                    <Badge variant="outline" className="font-mono-data">
                      <Hash className="h-3 w-3" />
                      {b.code}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(b)}>
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(b._id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <h4 className="font-display text-base font-bold leading-snug text-foreground">
                    {b.name}
                  </h4>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {b.description || 'No description provided.'}
                  </p>
                </div>
                {b.address && (
                  <p className="mt-4 flex items-center gap-1.5 border-t border-border/50 pt-3 text-[0.7rem] text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary" /> {b.address}
                  </p>
                )}
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingBuilding ? 'Edit building details' : 'Register new building'}
        description="Buildings group the rooms that auditors will inspect."
        icon={Building2}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="building-form">
              {editingBuilding ? 'Save changes' : 'Register building'}
            </Button>
          </>
        }
      >
        <form id="building-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Building code" required hint="Short unique identifier, e.g. BLDG-A">
            <Input
              required
              disabled={!!editingBuilding}
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="BLDG-A"
              className="font-mono-data uppercase"
            />
          </Field>

          <Field label="Building name" required>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Science Complex"
            />
          </Field>

          <Field label="Address / location">
            <Input
              value={formData.address}
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              placeholder="North Campus, Ring Road"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Contains Physics and Chemistry laboratories"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60"
            />
          </Field>
        </form>
      </AppModal>
    </div>
  );
};

export default Buildings;
