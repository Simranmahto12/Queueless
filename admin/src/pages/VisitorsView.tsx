import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Badge } from '../components/Badge';
import { Search } from 'lucide-react';

export const VisitorsView: React.FC = () => {
  const { tokens, departments } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = tokens.filter(
    (t) =>
      t.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.visitorPhone && t.visitorPhone.includes(searchTerm)) ||
      t.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-textMain tracking-tight">Visitor Directory</h2>
          <p className="text-xs text-textMuted mt-0.5">
            Registered visitors, booking appointments, and check-in history
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-borderSoft shadow-subtle max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by visitor name, phone, or token..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs text-textMain bg-transparent focus:outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-borderSoft shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-borderSoft text-textMuted font-medium uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Visitor Name</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Latest Token</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Booking Date</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderSoft">
            {filtered.map((t) => {
              const dept = departments.find((d) => d.departmentId === t.departmentId);
              return (
                <tr key={t.tokenId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-textMain">{t.visitorName}</td>
                  <td className="py-3 px-4 text-textMuted font-mono">{t.visitorPhone || t.visitorEmail || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-navy">{t.tokenNumber}</td>
                  <td className="py-3 px-4 text-textMain">{dept?.name || t.departmentId}</td>
                  <td className="py-3 px-4 text-textMuted">{t.scheduledSlot.date} {t.scheduledSlot.startTime}</td>
                  <td className="py-3 px-4">
                    <Badge status={t.status} />
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
