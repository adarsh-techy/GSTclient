import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addUserRole, listCarolEmployees, listUserRoles, removeUserRole } from '../../api';
import { apiErrorMessage } from '../../api';
import { PageError, PageLoading } from '../../components';
import { useToast } from '../../components';
import type { CarolEmployee } from '../../types/api';

const ROLES = ['Admin', 'User', 'ReadOnly'] as const;
type Role = typeof ROLES[number];

type Tab = 'assigned' | 'add';

function UserRoleBadge({ role }: { role: Role | string }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    Admin: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-800',
    },
    User: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-800',
    },
    ReadOnly: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      text: 'text-[#0096c7] dark:text-cyan-300',
      border: 'border-cyan-300 dark:border-cyan-800',
    },
  };

  const s = styles[role] || styles.User;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
      {role}
    </span>
  );
}

function UsersKpiCard({
  label,
  value,
  subtitle,
  icon,
  accent = 'cyan',
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'cyan' | 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber';
}) {
  const accentStyles = {
    cyan: {
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 text-[#00b4d8]',
      valColor: 'text-slate-900 dark:text-white',
      borderHover: 'hover:border-cyan-300 dark:hover:border-cyan-700',
    },
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      valColor: 'text-slate-900 dark:text-white',
      borderHover: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
    indigo: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
      valColor: 'text-indigo-600 dark:text-indigo-400',
      borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    },
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      valColor: 'text-emerald-600 dark:text-emerald-400',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
      valColor: 'text-purple-600 dark:text-purple-400',
      borderHover: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
    amber: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      valColor: 'text-amber-600 dark:text-amber-400',
      borderHover: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
  }[accent];

  return (
    <div
      className={`p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between gap-2.5 transition-all duration-200 hover:shadow-md ${accentStyles.borderHover}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${accentStyles.iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono truncate ${accentStyles.valColor}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function Users() {
  const [tab, setTab] = useState<Tab>('assigned');

  const { data: userRoles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: listUserRoles,
  });

  const rolesList = userRoles ?? [];
  const adminCount = rolesList.filter((r) => r.role === 'Admin').length;
  const userCount = rolesList.filter((r) => r.role === 'User').length;
  const readOnlyCount = rolesList.filter((r) => r.role === 'ReadOnly').length;

  return (
    <div className="flex flex-col gap-6">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            User Access &amp; Permissions
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Authorize CarolERP employee accounts and assign role-based access for this tenant
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <UsersKpiCard
          label="Total Authorized Users"
          value={rolesList.length}
          subtitle="Assigned tenant accounts"
          accent="emerald"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <UsersKpiCard
          label="Administrators"
          value={adminCount}
          subtitle="Full portal & filing control"
          accent="purple"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />

        <UsersKpiCard
          label="Standard Users"
          value={userCount}
          subtitle="Operations & reconciliation"
          accent="blue"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />

        <UsersKpiCard
          label="Read-Only Auditors"
          value={readOnlyCount}
          subtitle="Audit & report viewing only"
          accent="cyan"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
        />
      </section>

      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'assigned'}
          onClick={() => setTab('assigned')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
            tab === 'assigned'
              ? 'bg-[#e6f7fa] dark:bg-cyan-950/60 text-[#0096c7] dark:text-cyan-300 font-bold border border-cyan-400/30 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium'
          }`}
        >
          <span>Assigned Users</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              tab === 'assigned'
                ? 'bg-[#00b4d8] text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {rolesList.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'add'}
          onClick={() => setTab('add')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
            tab === 'add'
              ? 'bg-[#e6f7fa] dark:bg-cyan-950/60 text-[#0096c7] dark:text-cyan-300 font-bold border border-cyan-400/30 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium'
          }`}
        >
          <span>+ Add from CarolERP</span>
        </button>
      </div>

      {tab === 'assigned' ? <AssignedTab /> : <AddTab />}
    </div>
  );
}

function AssignedTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data, isPending, fetchStatus, isError, error, refetch } = useQuery({
    queryKey: ['user-roles'],
    queryFn: listUserRoles,
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeUserRole(id),
    onSuccess: () => {
      toast.show('User access removed.', 'success');
      qc.invalidateQueries({ queryKey: ['user-roles'] });
      qc.invalidateQueries({ queryKey: ['carol-employees'] });
    },
    onError: (err) => toast.show(`Remove failed: ${apiErrorMessage(err)}`, 'error'),
  });

  const rows = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.emplCode.toLowerCase().includes(q) ||
        (r.displayName ?? '').toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.show(`Copied Employee Code ${text}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isError) return <PageError error={error} what="users" onRetry={() => void refetch()} />;
  if (isPending) return <PageLoading label="Loading assigned users…" paused={fetchStatus === 'paused'} />;

  return (
    <div className="flex flex-col gap-3.5">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="relative min-w-[240px] sm:min-w-[320px] max-w-md">
          <input
            type="text"
            placeholder="Search employee code, name, role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium pl-8 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#00b4d8] shadow-2xs transition-all"
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#00b4d8] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No users assigned to this tenant yet
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Click "+ Add from CarolERP" above to select and authorize CarolERP employees for GSTAutoPilot.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No users match the search filter
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clear the search keyword to view all {rows.length} assigned users.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          
          <div className="flex items-center justify-end px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{filtered.length}</span> of {rows.length} assigned users
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Employee Code</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Full Name</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Permission Role</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Account Status</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Assigned Date</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.map((r) => {
                    const isCopied = copiedId === r.userRoleId;

                    return (
                      <tr key={r.userRoleId} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{r.emplCode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(r.emplCode, r.userRoleId)}
                              className="text-slate-400 hover:text-[#00b4d8] transition-colors p-0.5 cursor-pointer"
                              title="Copy employee code"
                            >
                              {isCopied ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                          {r.displayName || '—'}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          <UserRoleBadge role={r.role} />
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {r.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {new Date(r.createdOn).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            disabled={removeMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Revoke GSTAutoPilot access for ${r.displayName || r.emplCode}?`)) {
                                removeMutation.mutate(r.userRoleId);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer disabled:opacity-40"
                            title="Remove User Access"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                    <td colSpan={6} className="py-3 px-3.5 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                      TOTAL ASSIGNED USERS: {filtered.length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState<Record<number, Role>>({});
  const [filter, setFilter] = useState('');

  const employeesQuery = useQuery({
    queryKey: ['carol-employees'],
    queryFn: listCarolEmployees,
  });

  const addMutation = useMutation({
    mutationFn: (payload: { emp: CarolEmployee; role: Role }) =>
      addUserRole({
        emplId: payload.emp.emplId,
        emplCode: payload.emp.emplCode,
        displayName: payload.emp.displayName,
        role: payload.role,
      }),
    onSuccess: (_data, payload) => {
      toast.show(`Added ${payload.emp.emplCode} as ${payload.role}.`, 'success');
      qc.invalidateQueries({ queryKey: ['user-roles'] });
      qc.invalidateQueries({ queryKey: ['carol-employees'] });
    },
    onError: (err) => toast.show(`Add failed: ${apiErrorMessage(err)}`, 'error'),
  });

  const rows = useMemo(() => {
    const list = employeesQuery.data ?? [];
    const f = filter.trim().toLowerCase();
    if (!f) return list;
    return list.filter(
      (e) =>
        e.emplCode.toLowerCase().includes(f) ||
        e.displayName.toLowerCase().includes(f),
    );
  }, [employeesQuery.data, filter]);

  if (employeesQuery.isLoading) return <PageLoading label="Loading CarolERP employee directory…" />;
  if (employeesQuery.isError) {
    return <PageError error={employeesQuery.error} what="CarolERP employees" />;
  }

  return (
    <div className="flex flex-col gap-3.5">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md flex-1">
          <input
            type="text"
            placeholder="Search employee by code or name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full text-xs font-medium pl-8 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#00b4d8] shadow-2xs transition-all"
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {filter && (
            <button
              type="button"
              onClick={() => setFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        
        <div className="flex items-center justify-end px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{rows.length}</span> CarolERP employees
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Employee Code</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Employee Name</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Assign Permission Role</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {rows.map((emp) => {
                  const role = selectedRole[emp.emplId] ?? 'User';

                  return (
                    <tr key={emp.emplId} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {emp.emplCode}
                      </td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {emp.displayName || '—'}
                      </td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        {emp.isAssigned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Already Assigned
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Available</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <select
                          value={role}
                          onChange={(e) =>
                            setSelectedRole((s) => ({ ...s, [emp.emplId]: e.target.value as Role }))
                          }
                          disabled={emp.isAssigned}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8] disabled:opacity-40 cursor-pointer"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={emp.isAssigned || addMutation.isPending}
                          onClick={() => addMutation.mutate({ emp, role })}
                          className="px-3 py-1 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-2xs transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        >
                          {addMutation.isPending ? 'Adding…' : '+ Add User'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                  <td colSpan={5} className="py-3 px-3.5 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                    TOTAL EMPLOYEES: {rows.length}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Users as UserManagementPage, Users as default };
