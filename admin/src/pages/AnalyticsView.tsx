import React from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { analytics } = useAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-textMain tracking-tight">Queue & Footfall Analytics</h2>
        <p className="text-xs text-textMuted mt-0.5">
          Hourly arrival patterns, department service durations, and floor density metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Visitor Volume vs Capacity */}
        <div className="bg-white rounded-xl border border-borderSoft shadow-subtle p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-textMain">Hourly Visitor Traffic vs Capacity</h3>
            <p className="text-xs text-textMuted">Comparing actual arrivals against target safe throughput</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyVisitorVolume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF1" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 8, borderColor: '#E5EAF1', fontSize: 12 }}
                />
                <Bar dataKey="visitors" name="Actual Visitors" fill="#142B4A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" name="Safe Limit" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Trends */}
        <div className="bg-white rounded-xl border border-borderSoft shadow-subtle p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-textMain">Zone Occupancy Progression</h3>
            <p className="text-xs text-textMuted">Real-time crowd accumulation across monitored waiting lounges</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.occupancyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF1" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 8, borderColor: '#E5EAF1', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="reception" name="Reception Lobby" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cardio" name="Cardiology Lounge" stroke="#D99A25" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pharmacy" name="Pharmacy Area" stroke="#16A36A" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Average Wait Times Table */}
      <div className="bg-white rounded-xl border border-borderSoft shadow-subtle p-5">
        <h3 className="text-sm font-semibold text-textMain mb-3">Department Wait Times vs Target SLA</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.averageWaitTimesByDept.map((d) => (
            <div key={d.department} className="p-4 rounded-lg bg-slate-50 border border-borderSoft">
              <span className="text-xs font-semibold text-textMain">{d.department}</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-navy">{d.avgWait}m</span>
                <span className="text-xs text-textMuted">SLA: {d.sla}m</span>
              </div>
              <span className={`text-[11px] font-medium mt-1 inline-block ${d.avgWait <= d.sla ? 'text-emerald-600' : 'text-red-600'}`}>
                {d.avgWait <= d.sla ? '✓ Within target' : '⚠ Exceeding target'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
