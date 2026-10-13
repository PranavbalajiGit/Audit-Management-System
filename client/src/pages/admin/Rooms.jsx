import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DoorOpen, Plus, Pencil, Trash2, QrCode, MapPin, Printer, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { roomService, buildingService } from '../../services/api';
import { AppModal, Field } from '@/components/AppModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { BlurFade } from '@/components/fx/blur-fade';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ROOM_TYPES = ['Classroom', 'Laboratory', 'Hostel', 'Library', 'Office', 'Other'];

const emptyRoom = {
  buildingId: '',
  roomNumber: '',
  roomType: 'Classroom',
  latitude: '11.0168',
  longitude: '76.9558',
  referenceImages: [],
};

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState(emptyRoom);

  const [qrOpen, setQrOpen] = useState(false);
  const [activeQr, setActiveQr] = useState(null);

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
    setFormData({ ...emptyRoom, buildingId: buildings[0]?._id || '' });
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
      referenceImages: room.referenceImages || [],
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this room? Its QR tag will be invalidated.'))
      return;
    try {
      await roomService.deleteRoom(id);
      toast.success('Room removed');
      fetchRooms();
    } catch (err) {
      toast.error(err.message || 'Deletion failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom._id, formData);
        toast.success('Room details updated');
      } else {
        await roomService.createRoom(formData);
        toast.success('Room registered');
      }
      setModalOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  const showQr = (room) => {
    if (room.qrCodeId) {
      setActiveQr({
        roomNumber: room.roomNumber,
        buildingName: room.buildingId?.name,
        code: room.qrCodeId.encodedData,
      });
      setQrOpen(true);
    } else {
      toast.error('QR code not generated yet. Try re-saving this room.');
    }
  };

  return (
    <div className="space-y-6">
      <BlurFade>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
              Registry · {rooms.length} spaces
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Campus rooms</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage rooms, registered GPS coordinates, and print QR tags.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Add room
          </Button>
        </div>
      </BlurFade>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingScreen label="Loading rooms registry..." />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No rooms registered"
          description="Add rooms under a building to generate QR tags for inspection."
          action={
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Add room
            </Button>
          }
        />
      ) : (
        <div className="reg-marks overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-panel">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Room</TableHead>
                <TableHead className="hidden md:table-cell">Building</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden lg:table-cell">Coordinates</TableHead>
                <TableHead className="text-center">QR tag</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((item, i) => (
                <motion.tr
                  key={item._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                >
                  <TableCell className="font-semibold text-foreground">
                    Room {item.roomNumber}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {item.buildingId?.name}{' '}
                    <span className="font-mono-data text-xs">({item.buildingId?.code})</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.roomType}</Badge>
                  </TableCell>
                  <TableCell className="hidden font-mono-data text-xs text-muted-foreground lg:table-cell">
                    {item.latitude?.toFixed(6)}, {item.longitude?.toFixed(6)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={() => showQr(item)}
                    >
                      <QrCode className="h-3.5 w-3.5" /> View
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                        <Pencil className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingRoom ? 'Edit room details' : 'Register new room'}
        description="Coordinates are used to verify auditor presence on-site."
        icon={DoorOpen}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="room-form">
              Save room
            </Button>
          </>
        }
      >
        <form id="room-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Parent building" required>
            <Select
              value={formData.buildingId}
              onValueChange={(v) => setFormData((p) => ({ ...p, buildingId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a building" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Room number / ID" required>
              <Input
                required
                value={formData.roomNumber}
                onChange={(e) => setFormData((p) => ({ ...p, roomNumber: e.target.value }))}
                placeholder="e.g. 101"
              />
            </Field>
            <Field label="Room type">
              <Select
                value={formData.roomType}
                onValueChange={(v) => setFormData((p) => ({ ...p, roomType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude" required>
              <Input
                type="number"
                step="0.000001"
                required
                className="font-mono-data"
                value={formData.latitude}
                onChange={(e) => setFormData((p) => ({ ...p, latitude: e.target.value }))}
                placeholder="11.0168"
              />
            </Field>
            <Field label="Longitude" required>
              <Input
                type="number"
                step="0.000001"
                required
                className="font-mono-data"
                value={formData.longitude}
                onChange={(e) => setFormData((p) => ({ ...p, longitude: e.target.value }))}
                placeholder="76.9558"
              />
            </Field>
          </div>
        </form>
      </AppModal>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center justify-center gap-2 text-base">
              <QrCode className="h-4 w-4 text-primary" /> Room QR signboard
            </DialogTitle>
            <DialogDescription className="sr-only">
              Printable QR tag for the selected room.
            </DialogDescription>
          </DialogHeader>

          {activeQr && (
            <div className="space-y-4">
              <div className="print-signboard overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-lg">
                <div className="flex items-center justify-between gap-3 bg-slate-900 px-5 py-3 text-white">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div className="text-left leading-tight">
                      <p className="font-display text-sm font-bold">Audit Console</p>
                      <p className="font-mono-data text-[0.55rem] uppercase tracking-[0.22em] text-white/60">
                        Inspection tag
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono-data text-[0.55rem] uppercase tracking-[0.18em] text-white/80">
                    Scan
                  </span>
                </div>

                <div className="px-6 py-6">
                  <div className="mx-auto w-fit rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(
                        activeQr.code
                      )}`}
                      alt="Room QR code"
                      className="h-44 w-44"
                    />
                  </div>

                  <div className="mt-5">
                    <p className="font-mono-data text-[0.55rem] uppercase tracking-[0.26em] text-slate-400">
                      Room
                    </p>
                    <h4 className="font-display text-3xl font-black leading-tight tracking-tight text-slate-900">
                      {activeQr.roomNumber}
                    </h4>
                    <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500">
                      <MapPin className="h-3.5 w-3.5" /> {activeQr.buildingName}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-dashed border-slate-300 pt-3">
                    <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.2em] text-slate-400">
                      Scan with the Audit Console app to begin inspection
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-secondary/40 p-3 text-left print:hidden">
                <span className="block font-mono-data text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
                  QR payload
                </span>
                <code className="break-all font-mono-data text-xs text-primary">
                  {activeQr.code}
                </code>
              </div>

              <Button className="w-full print:hidden" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print signboard
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rooms;
