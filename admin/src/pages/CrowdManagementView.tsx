import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { recommendStaffing } from '@queueless/shared';
import { Flame, AlertTriangle, Users, Plus, Minus, ArrowUpRight } from 'lucide-react';

export const CrowdManagementView: React.FC = () => {
  const { zones, counters, tokens, updateZoneOccupancy } = useAdmin();

  // Dynamic Staffing Recommendation based on current waiting queues
  const waitingTokensCount = tokens.filter((t) => t.status === 'WAITING' || t.status === 'CHECKED_IN').length;
  const activeCountersCount = counters.filter((c) => c.status === 'OPEN' || c.status === 'BUSY').length;

  const recommendation = recommendStaffing({
    waitingTokensCount,
    activeCountersCount,
    averageServiceDurationMinutes: 10,
    targetMaxWaitTimeMinutes: 15,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-textMain tracking-tight">Crowd & Occupancy Management</h2>
        <p className="text-xs text-textMuted mt-0.5">
          Real-time physical zone density, lobby thresholds, and AI staffing recommendations
        </p>
      </div>

      {/* Staffing Recommendation Banner */}
      <div
        className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
          recommendation.actionNeeded === 'OPEN_COUNTERS'
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${
              recommendation.actionNeeded === 'OPEN_COUNTERS' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {recommendation.actionNeeded === 'OPEN_COUNTERS'
                ? `Staffing Recommendation: Open ${recommendation.countersDelta} Additional Counter(s)`
                : 'Staffing Status: Well-Balanced'}
            </h3>
            <p className="text-xs mt-0.5 opacity-90">{recommendation.reason}</p>
            <div className="flex items-center gap-4 mt-2 text-[11px] font-mono">
              <span>Waiting Queue: {waitingTokensCount} visitors</span>
              <span>Active Desks: {activeCountersCount}</span>
              <span>Projected Wait: {recommendation.currentEstimatedWaitMinutes} mins</span>
            </div>
          </div>
        </div>

        {recommendation.actionNeeded === 'OPEN_COUNTERS' && (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-600 text-white shadow-subtle flex items-center gap-1">
            Action Advised <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Physical Floor Zone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {zones.map((zone) => {
          const pct = Math.round((zone.currentOccupancy / zone.maxCapacity) * 100);

          return (
            <div
              key={zone.zoneId}
              className="bg-white rounded-xl border border-borderSoft shadow-subtle p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-textMain">{zone.name}</h3>
                    <p className="text-[11px] text-textMuted mt-0.5">{zone.floor}</p>
                  </div>
                  <Badge status={zone.occupancyStatus} />
                </div>

                {/* Big Occupancy Metric */}
                <div className="flex items-baseline gap-2 my-4">
                  <span className="text-3xl font-extrabold text-textMain tracking-tight">
                    {zone.currentOccupancy}
                  </span>
                  <span className="text-xs text-textMuted font-mono">/ {zone.maxCapacity} max capacity</span>
                  <span
                    className={`text-xs font-bold ml-auto ${
                      pct >= 95 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {pct}% full
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      pct >= 95
                        ? 'bg-red-500'
                        : pct >= 80
                        ? 'bg-amber-500'
                        : pct >= 60
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                {/* Safe Threshold Marker */}
                <div className="text-[11px] text-textMuted flex justify-between py-1 border-t border-slate-100">
                  <span>Safe Threshold: {zone.safeCapacity} persons</span>
                  <span>Sensor: {zone.monitoredBySensorOrCamera ? 'Optical Count' : 'Check-in Sync'}</span>
                </div>
              </div>

              {/* Simulation Controls to Test Overcrowding Alerts */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Simulate footfall:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateZoneOccupancy(zone.zoneId, -5)}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    title="Simulate 5 departures"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateZoneOccupancy(zone.zoneId, 5)}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    title="Simulate 5 arrivals"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
