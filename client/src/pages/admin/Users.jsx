import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Pencil, Trash2, Users as UsersIcon, ShieldCheck, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

import { userService } from '../../services/api';
import { AppModal, Field } from '@/components/AppModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { BlurFade } from '@/components/fx/blur-fade';
import { StatusBadge } from '@/components/StatusBadge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'Auditor',
  status: 'Active',
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

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
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role || 'Auditor',
      status: user.status || 'Active',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user account? This cannot be undone.')) return;
    try {
      await userService.deleteUser(id);
      toast.success('User removed');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Deletion failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updatePayload = { ...formData };
        if (!updatePayload.password) delete updatePayload.password;
        await userService.updateUser(editingUser.id, updatePayload);
        toast.success('User profile updated');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new users.');
          return;
        }
        await userService.createUser(formData);
        toast.success('User account created');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  const admins = users.filter((u) => u.role === 'Admin').length;
  const auditors = users.filter((u) => u.role === 'Auditor').length;

  return (
    <div className="space-y-6">
      <BlurFade>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
              Access control · {users.length} accounts
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Users</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage institution administrators and field auditors.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <UserPlus className="h-4 w-4" /> Add user
          </Button>
        </div>
      </BlurFade>

      <div className="flex flex-wrap gap-2">
        <Badge variant="info">
          <ShieldCheck className="h-3 w-3" /> {admins} admin
        </Badge>
        <Badge variant="success">
          <ScanLine className="h-3 w-3" /> {auditors} auditor
        </Badge>
        {roles.length > 0 && <Badge variant="outline">{roles.length} roles defined</Badge>}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingScreen label="Loading user registry..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No user accounts yet"
          description="Create the first administrator or auditor account to get started."
          action={
            <Button size="sm" onClick={handleOpenCreate}>
              <UserPlus className="h-4 w-4" /> Add user
            </Button>
          }
        />
      ) : (
        <div className="reg-marks overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-panel">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {item.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {item.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.role === 'Admin' ? 'info' : 'success'}>{item.role}</Badge>
                  </TableCell>
                  <TableCell className="hidden font-mono-data text-xs text-muted-foreground lg:table-cell">
                    {item.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-sm text-foreground">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.status === 'Active' ? 'bg-success' : 'bg-muted-foreground'
                        }`}
                      />
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                        <Pencil className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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
        title={editingUser ? 'Edit user profile' : 'Register new user'}
        description={editingUser ? 'Update account details and access level.' : 'Create an account for an administrator or field auditor.'}
        icon={UserPlus}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="user-form">
              {editingUser ? 'Save changes' : 'Create account'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Display name" required>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. John Doe"
            />
          </Field>

          <Field label="Email address" required>
            <Input
              type="email"
              required
              disabled={!!editingUser}
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              placeholder="john@s7.com"
            />
          </Field>

          <Field
            label="Password"
            hint={editingUser ? 'Leave blank to keep the current password.' : undefined}
            required={!editingUser}
          >
            <Input
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Phone number (optional)">
            <Input
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+123456789"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Access level">
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auditor">Auditor (field staff)</SelectItem>
                  <SelectItem value="Admin">Admin (full control)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Status">
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default Users;
