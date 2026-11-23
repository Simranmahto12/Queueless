import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { Badge } from '../components/Badge';

export const StaffView: React.FC = () => {
  const { staff, departments, counters } = useAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-textMain tracking-tight">Staff Management</h2>
        <p className="text-xs text-textMuted mt-0.5">
          View assigned operational staff, departmental allocations, and duty availability
        </p>
      </div>

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
    </div>
  );
};
