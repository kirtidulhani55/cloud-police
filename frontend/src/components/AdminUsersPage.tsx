import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  Loader2,
  MailCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import { AccessRole } from '../services/authService';
import {
  AdminApiError,
  createManagedUser,
  listManagedUsers,
  ManagedUser,
  updateManagedUser,
} from '../services/adminService';
import { useDialogFocus } from '../hooks/useDialogFocus';


interface AdminUsersPageProps {
  currentUserId: string;
}

interface Notice {
  tone: 'success' | 'error';
  message: string;
}

const ROLE_OPTIONS: AccessRole[] = ['OPERATOR', 'APPROVER', 'ADMIN'];

const roleLabel = (role: AccessRole | null) => {
  if (!role) return 'Unassigned';
  return role.charAt(0) + role.slice(1).toLowerCase();
};

const formatDate = (value: string | null) => {
  if (!value) return 'Never';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const errorMessage = (error: unknown) => {
  if (error instanceof AdminApiError || error instanceof Error) {
    return error.message;
  }
  return 'The request could not be completed.';
};


export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({
  currentUserId,
}) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const manageDialogRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<AccessRole>('OPERATOR');

  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [editRole, setEditRole] = useState<AccessRole>('OPERATOR');
  const [editDisabled, setEditDisabled] = useState(false);
  const [editReason, setEditReason] = useState('');

  useDialogFocus(Boolean(selectedUser), manageDialogRef, () => {
    if (!saving) setSelectedUser(null);
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      setUsers(await listManagedUsers());
    } catch (error) {
      setNotice({
        tone: 'error',
        message: errorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      return [
        user.display_name,
        user.email,
        user.role,
        user.disabled ? 'disabled' : 'active',
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [searchQuery, users]);

  const activeCount = users.filter((user) => !user.disabled).length;
  const approverCount = users.filter(
    (user) => user.role === 'APPROVER' || user.role === 'ADMIN'
  ).length;
  const adminCount = users.filter((user) => user.role === 'ADMIN').length;

  const resetCreateForm = () => {
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('OPERATOR');
    setShowCreateForm(false);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const createdUser = await createManagedUser({
        email: createEmail,
        temporaryPassword: createPassword,
        role: createRole,
        displayName: createName,
        reason: 'Account created by a Cloud Police administrator.',
      });

      setUsers((current) =>
        [...current, createdUser].sort((left, right) =>
          left.email.localeCompare(right.email)
        )
      );
      resetCreateForm();
      setNotice({
        tone: 'success',
        message: `${createdUser.email} was created as ${roleLabel(createdUser.role)}.`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: errorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const openManagePanel = (user: ManagedUser) => {
    setSelectedUser(user);
    setEditRole(user.role || 'OPERATOR');
    setEditDisabled(user.disabled);
    setEditReason('');
    setNotice(null);
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    setNotice(null);

    try {
      const updatedUser = await updateManagedUser(selectedUser.user_id, {
        role: editRole,
        disabled: editDisabled,
        reason: editReason,
      });

      setUsers((current) =>
        current.map((user) =>
          user.user_id === updatedUser.user_id ? updatedUser : user
        )
      );
      setSelectedUser(null);
      setNotice({
        tone: 'success',
        message: `${updatedUser.email} was updated successfully.`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: errorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in text-[#2B2417] dark:text-[#E4EFED]">
      <div className="flex flex-col gap-4 border-b border-[#EAE6DD] pb-5 dark:border-[#29484C] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B8720A] dark:text-[#48B8AE]">
            <ShieldCheck className="h-4 w-4" />
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#2B2417] dark:text-white">
            User Management
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#607578] dark:text-[#AFC3C1]">
            Manage who can inspect Cloud Police data, review decisions and administer the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm(true);
            setSelectedUser(null);
            setNotice(null);
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#B8720A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9A5E05] focus:outline-none focus:ring-2 focus:ring-[#B8720A]/30"
        >
          <UserPlus className="h-4 w-4" />
          Add user
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Active users', value: activeCount, icon: Users },
          { label: 'Decision makers', value: approverCount, icon: ShieldCheck },
          { label: 'Administrators', value: adminCount, icon: UserCog },
        ].map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between rounded-xl border border-[#EAE6DD] bg-white px-4 py-3 dark:border-[#29484C] dark:bg-[#13282D]"
          >
            <div>
              <p className="text-xs font-medium text-[#6A7E80] dark:text-[#AFC3C1]">
                {metric.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#2B2417] dark:text-white">
                {metric.value}
              </p>
            </div>
            <metric.icon className="h-5 w-5 text-[#B8720A] dark:text-[#48B8AE]" />
          </div>
        ))}
      </div>

      {notice && (
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
            notice.tone === 'success'
              ? 'border-[#A9D7CD] bg-[#EDF9F6] text-[#1C665A] dark:border-[#316A61] dark:bg-[#16352F] dark:text-[#9ADBCB]'
              : 'border-[#E7B8BD] bg-[#FFF2F3] text-[#8D343D] dark:border-[#74434A] dark:bg-[#3A2328] dark:text-[#F1B2B8]'
          }`}
          role="status"
        >
          {notice.tone === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[#EAE6DD] bg-white p-5 shadow-sm dark:border-[#315258] dark:bg-[#13282D]"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#2B2417] dark:text-white">
                Create a user account
              </h2>
              <p className="mt-1 text-xs text-[#6A7E80] dark:text-[#AFC3C1]">
                The password is sent to Identity Platform and is never stored by Cloud Police.
              </p>
            </div>
            <button
              type="button"
              onClick={resetCreateForm}
              className="rounded-md p-1.5 text-[#6A7E80] transition hover:bg-[#FAF7F2] hover:text-[#2B2417] dark:hover:bg-[#203A3F] dark:hover:text-white"
              aria-label="Close create-user form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5 text-xs font-semibold">
              Display name
              <input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#EAE6DD] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#B8720A] focus:ring-2 focus:ring-[#B8720A]/15 dark:border-[#36565A] dark:bg-[#0F2024]"
                placeholder="Demo Reviewer"
              />
            </label>

            <label className="space-y-1.5 text-xs font-semibold">
              Email
              <input
                type="email"
                required
                value={createEmail}
                onChange={(event) => setCreateEmail(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#EAE6DD] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#B8720A] focus:ring-2 focus:ring-[#B8720A]/15 dark:border-[#36565A] dark:bg-[#0F2024]"
                placeholder="reviewer@example.com"
              />
            </label>

            <label className="space-y-1.5 text-xs font-semibold">
              Temporary password
              <input
                type="password"
                required
                minLength={8}
                value={createPassword}
                onChange={(event) => setCreatePassword(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#EAE6DD] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#B8720A] focus:ring-2 focus:ring-[#B8720A]/15 dark:border-[#36565A] dark:bg-[#0F2024]"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </label>

            <label className="space-y-1.5 text-xs font-semibold">
              Role
              <select
                value={createRole}
                onChange={(event) => setCreateRole(event.target.value as AccessRole)}
                className="h-10 w-full rounded-lg border border-[#EAE6DD] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#B8720A] focus:ring-2 focus:ring-[#B8720A]/15 dark:border-[#36565A] dark:bg-[#0F2024]"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetCreateForm}
              className="h-9 rounded-lg border border-[#EAE6DD] px-4 text-sm font-semibold transition hover:bg-[#FBF5EA] dark:border-[#36565A] dark:hover:bg-[#203A3F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#B8720A] px-4 text-sm font-semibold text-white transition hover:bg-[#9A5E05] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create user
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border border-[#EAE6DD] bg-white dark:border-[#29484C] dark:bg-[#13282D]">
        <div className="flex flex-col gap-3 border-b border-[#EAE6DD] p-4 dark:border-[#29484C] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718588]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, role or status"
              className="h-10 w-full rounded-lg border border-[#EAE6DD] bg-[#FCFAF7] pl-9 pr-3 text-sm outline-none transition focus:border-[#B8720A] focus:ring-2 focus:ring-[#B8720A]/15 dark:border-[#36565A] dark:bg-[#0F2024]"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#EAE6DD] px-3 text-sm font-semibold transition hover:bg-[#FBF5EA] disabled:opacity-60 dark:border-[#36565A] dark:hover:bg-[#203A3F]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-[#6A7E80] dark:text-[#AFC3C1]">
            <Loader2 className="h-5 w-5 animate-spin text-[#B8720A]" />
            Loading authorized users…
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <Users className="mb-3 h-7 w-7 text-[#7A9192]" />
            <p className="text-sm font-semibold">No users found</p>
            <p className="mt-1 text-xs text-[#6A7E80] dark:text-[#AFC3C1]">
              Change the search or create the first managed account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E0ECE9] dark:divide-[#29484C]">
            {filteredUsers.map((user) => {
              const isCurrentUser = user.user_id === currentUserId;

              return (
                <div
                  key={user.user_id}
                  className="grid gap-4 px-4 py-4 transition hover:bg-[#FCFAF7] dark:hover:bg-[#173036] md:grid-cols-[minmax(0,1.7fr)_minmax(130px,0.7fr)_minmax(180px,1fr)_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#2B2417] dark:text-white">
                        {user.display_name || 'Unnamed user'}
                      </p>
                      {isCurrentUser && (
                        <span className="rounded-full bg-[#E7F4F1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#B8720A] dark:bg-[#21453F] dark:text-[#79CEC0]">
                          You
                        </span>
                      )}
                      {user.email_verified && (
                        <MailCheck
                          className="h-4 w-4 text-[#2E8B75]"
                          aria-label="Email verified"
                      />
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-[#647A7C] dark:text-[#AFC3C1]">
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full border border-[#BFD7D3] bg-[#F0F7F6] px-2.5 py-1 text-xs font-semibold text-[#256E69] dark:border-[#39615E] dark:bg-[#1A3737] dark:text-[#8DD3C8]">
                      {roleLabel(user.role)}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      {user.disabled ? (
                        <Ban className="h-3.5 w-3.5 text-[#C8545E]" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#2E8B75]" />
                      )}
                      <span className={user.disabled ? 'text-[#B44751]' : 'text-[#39776C] dark:text-[#79C9B9]'}>
                        {user.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#718588] dark:text-[#AFC3C1]">
                      <Clock3 className="h-3.5 w-3.5" />
                      Last sign-in: {formatDate(user.last_sign_in_at)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openManagePanel(user)}
                    className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[#EAE6DD] px-3 text-xs font-semibold text-[#B8720A] transition hover:bg-[#FFF4DF] dark:border-[#36565A] dark:text-[#7CCBC0] dark:hover:bg-[#203A3F]"
                  >
                    <UserCog className="h-3.5 w-3.5" />
                    Manage
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedUser && (
        <div
          ref={manageDialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2023]/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-user-title"
          tabIndex={-1}
        >
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-lg rounded-2xl border border-[#EAE6DD] bg-white p-6 shadow-2xl dark:border-[#36565A] dark:bg-[#13282D]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8720A] dark:text-[#48B8AE]">
                  Manage account
                </p>
                <h2 id="manage-user-title" className="mt-1 text-xl font-semibold text-[#2B2417] dark:text-white">
                  {selectedUser.display_name || selectedUser.email}
                </h2>
                <p className="mt-1 text-xs text-[#6A7E80] dark:text-[#AFC3C1]">
                  {selectedUser.email}
                </p>
              </div>
              <button
                type="button"
                data-dialog-initial-focus
                onClick={() => setSelectedUser(null)}
                className="rounded-md p-1.5 text-[#6A7E80] transition hover:bg-[#FAF7F2] dark:hover:bg-[#203A3F]"
                aria-label="Close user-management panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block space-y-1.5 text-xs font-semibold">
                Role
                <select
                  value={editRole}
                  disabled={selectedUser.user_id === currentUserId}
                  onChange={(event) => setEditRole(event.target.value as AccessRole)}
                  className="h-10 w-full rounded-lg border border-[#EAE6DD] bg-white px-3 text-sm font-normal outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#36565A] dark:bg-[#0F2024]"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-start justify-between gap-4 rounded-lg border border-[#EAE6DD] p-3 dark:border-[#36565A]">
                <span>
                  <span className="block text-sm font-semibold">Disable account</span>
                  <span className="mt-0.5 block text-xs text-[#6A7E80] dark:text-[#AFC3C1]">
                    Blocks future sign-ins without deleting audit history.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={editDisabled}
                  disabled={selectedUser.user_id === currentUserId}
                  onChange={(event) => setEditDisabled(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#B8720A] disabled:opacity-50"
                />
              </label>

              {selectedUser.user_id === currentUserId && (
                <div className="flex gap-2 rounded-lg bg-[#FFF7E7] p-3 text-xs text-[#835B18] dark:bg-[#3A301B] dark:text-[#E5C47B]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Your own Admin role and account status are protected.
                </div>
              )}

              <label className="block space-y-1.5 text-xs font-semibold">
                Reason for change
                <textarea
                  required
                  maxLength={1000}
                  rows={3}
                  value={editReason}
                  onChange={(event) => setEditReason(event.target.value)}
                  className="w-full resize-none rounded-lg border border-[#EAE6DD] bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-[#B8720A] focus:ring-2 focus:ring-[#B8720A]/15 dark:border-[#36565A] dark:bg-[#0F2024]"
                  placeholder="Explain why this access change is needed."
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="h-9 rounded-lg border border-[#EAE6DD] px-4 text-sm font-semibold transition hover:bg-[#FBF5EA] dark:border-[#36565A] dark:hover:bg-[#203A3F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !editReason.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#B8720A] px-4 text-sm font-semibold text-white transition hover:bg-[#9A5E05] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
