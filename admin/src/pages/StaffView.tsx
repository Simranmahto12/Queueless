import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Badge } from '../components/Badge';
import { UserPlus, X, Loader2, ShieldCheck } from 'lucide-react';
import { UserRole } from '@queueless/shared';

export const StaffView: React.FC = () => {
  const { staff, departments, counters, provisionStaff, addToast } = useAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.COUNTER_STAFF);
  const [departmentId, setDepartmentId] = useState('');
  const [assignedCounterId, setAssignedCounterId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleOpenModal = () => {
    setDisplayName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole(UserRole.COUNTER_STAFF);
    setDepartmentId(departments[0]?.departmentId || '');
    setAssignedCounterId(counters[0]?.counterId || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Please provide the employee full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid institutional email address.');
      return;
    }
    if (password.length < 6) {
      setError('Initial temporary password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await provisionStaff({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        role,
        departmentId: departmentId || undefined,
        assignedCounterId: assignedCounterId || undefined,
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to provision staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Provision Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-textMain tracking-tight">Staff Management</h2>
          <p className="text-xs text-textMuted mt-0.5">
            Authorized operational personnel, counter assignments, and duty allocations
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-borderSoft shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-borderSoft text-textMuted font-medium uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Employee Code</th>
              <th className="py-3 px-4">Assigned Department</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Active Counter</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderSoft">
            {staff.map((member) => {
              const dept = departments.find((d) => d.departmentId === member.departmentId);
              const counter = counters.find((c) => c.counterId === member.assignedCounterId);

              return (
                <tr key={member.staffId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-textMain">
                    {member.employeeCode}
                  </td>
                  <td className="py-3 px-4 font-medium text-textMain">
                    {dept?.name || member.departmentId}
                  </td>
                  <td className="py-3 px-4 text-textMuted font-medium">
                    {member.role.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4">
                    {counter ? (
                      <span className="font-semibold text-textMain">{counter.counterNumber}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not stationed</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={member.isAvailable ? 'OPEN' : 'CLOSED'} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Provision Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-borderSoft max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-borderSoft flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-textMain">Provision Staff Account</h3>
                  <p className="text-[11px] text-textMuted">Authorized institutional access allocation</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-3.5 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-semibold text-textMain mb-1">Employee Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Officer Marcus Chen"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-textMain mb-1">Institutional Email</label>
                <input
                  type="email"
                  placeholder="marcus.chen@institution.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-textMain mb-1">Initial Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-textMain mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-textMain mb-1">Role & Authority</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                >
                  <option value={UserRole.COUNTER_STAFF}>Counter Staff (Desk Operations)</option>
                  <option value={UserRole.DEPARTMENT_MANAGER}>Department Manager (Flow Supervision)</option>
                  <option value={UserRole.BRANCH_ADMIN}>Branch Administrator (Branch Control)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-textMain mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-textMain mb-1">Assigned Counter</label>
                  <select
                    value={assignedCounterId}
                    onChange={(e) => setAssignedCounterId(e.target.value)}
                    className="w-full px-3 py-2 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                  >
                    <option value="">Unassigned</option>
                    {counters.map((c) => (
                      <option key={c.counterId} value={c.counterId}>
                        {c.counterNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-borderSoft flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-textMuted hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-navy hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
