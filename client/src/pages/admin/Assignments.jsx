import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Send, ClipboardList, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

import { auditService, userService, roomService, checklistService } from '../../services/api';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { BlurFade } from '@/components/fx/blur-fade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/AppModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    auditorId: '',
    roomId: '',
    checklistId: '',
    dueDate: '',
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

      setFormData({
        auditorId: auds.data?.[0]?.id || '',
        roomId: rms.data?.[0]?._id || '',
        checklistId: chks.data?.[0]?._id || '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.auditorId || !formData.roomId || !formData.checklistId || !formData.dueDate) {
      toast.error('Please fill out all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await auditService.createAssignment(formData);
      fetchAssignments();
      toast.success('Audit assignment created');
    } catch (err) {
      toast.error(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = assignments.filter((a) =>
    ['Assigned', 'In Progress'].includes(a.status)
  ).length;

  return (
    <div className="space-y-6">
      <BlurFade>
        <div>
          <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
            Dispatch · {pending} open tasks
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Assignments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Allocate room inspections to active field auditors.
          </p>
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form panel */}
        <BlurFade className="lg:col-span-1">
          <section className="reg-marks h-fit rounded-xl border border-border/70 bg-card/70 p-5 shadow-panel">
            <div className="mb-4 border-b border-border/50 pb-3">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                <Send className="h-4 w-4 text-primary" /> New assignment
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Route a room audit to an auditor with a due date.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Auditor" required>
                <Select
                  value={formData.auditorId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, auditorId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select auditor" />
                  </SelectTrigger>
                  <SelectContent>
                    {auditors.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} — {a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Room" required>
                <Select
                  value={formData.roomId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, roomId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r._id} value={r._id}>
                        Room {r.roomNumber} · {r.buildingId?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Checklist" required>
                <Select
                  value={formData.checklistId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, checklistId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select checklist" />
                  </SelectTrigger>
                  <SelectContent>
                    {checklists.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Due date" required>
                <Input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </Field>

              <Button type="submit" disabled={submitting} className="w-full">
                <UserCheck className="h-4 w-4" />
                {submitting ? 'Creating…' : 'Assign inspection'}
              </Button>
            </form>
          </section>
        </BlurFade>

        {/* List panel */}
        <BlurFade delay={0.1} className="lg:col-span-2">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                <ClipboardList className="h-4 w-4 text-primary" /> Active assignments
              </h3>
              <span className="font-mono-data text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {assignments.length} total
              </span>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {loading ? (
              <LoadingScreen label="Loading assignments..." />
            ) : assignments.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No inspections assigned"
                description="Use the panel to assign your first room audit."
                className="py-16"
              />
            ) : (
              <div className="reg-marks overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-panel">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Location</TableHead>
                      <TableHead>Auditor</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((item, i) => (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.03 }}
                        className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                      >
                        <TableCell>
                          <p className="font-semibold text-foreground">
                            Room {item.roomId?.roomNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.roomId?.buildingId?.name}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground">{item.auditorId?.name}</p>
                          <p className="font-mono-data text-[0.65rem] text-muted-foreground">
                            {item.auditorId?.email}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="h-3 w-3" />
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <StatusBadge status={item.status} />
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </BlurFade>
      </div>
    </div>
  );
};

export default Assignments;
