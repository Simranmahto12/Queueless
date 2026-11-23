import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Users, Clock, CheckCircle2, Flame, AlertTriangle, ArrowRight, Play } from 'lucide-react';
import { AdminTab } from '../layouts/Sidebar';

interface OverviewViewProps {
  onNavigate: (tab: AdminTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { tokens, counters, zones, alerts, callNextToken } = useAdmin();

  // Metrics
  const activeTokens = tokens.filter(
    (t) => t.status === 'WAITING' || t.status === 'CHECKED_IN' || t.status === 'IN_PROGRESS' || t.status === 'CALLED'
  );
  const waitingTokens = tokens.filter((t) => t.status === 'WAITING' || t.status === 'CHECKED_IN');
  const openCounters = counters.filter((c) => c.status === 'OPEN' || c.status === 'BUSY');
  const totalZoneCapacity = zones.reduce((acc, z) => acc + z.maxCapacity, 0);
  const totalZoneOccupancy = zones.reduce((acc, z) => acc + z.currentOccupancy, 0);
  const overallOccupancyPct = totalZoneCapacity > 0 ? Math.round((totalZoneOccupancy / totalZoneCapacity) * 100) : 0;

  const firstAvailableOpenCounter = counters.find((c) => c.status === 'OPEN');

  return (
    <div className="space-y-6">
      {/* Top Banner / Philosophy Note */}
      <div className="flex items-center justify-between p-4 bg-navy text-white rounded-xl shadow-card">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Active Floor Control</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Smart arrival slots are staggering arrivals across 3 active waiting zones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {firstAvailableOpenCounter && waitingTokens.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Play className="w-3.5 h-3.5" />}
              onClick={() => callNextToken(firstAvailableOpenCounter.counterId)}
            >
              Call Next to {firstAvailableOpenCounter.counterNumber.split(' ')[0]}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-navy border-slate-300 hover:bg-slate-100"
            onClick={() => onNavigate('queue')}
          >
            Live Dispatcher
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Tokens"
          value={activeTokens.length}
          subtitle={`${waitingTokens.length} waiting, ${activeTokens.length - waitingTokens.length} at counters`}
          icon={<Users className="w-4 h-4" />}
          trend={{ value: 'Normal Flow', isPositive: true }}
          onClick={() => onNavigate('queue')}
        />
        <MetricCard
          title="Avg. Wait Time"
          value="11.4 min"
          subtitle="Target threshold: 15.0 min"
          icon={<Clock className="w-4 h-4" />}
          trend={{ value: '-2.1m vs yesterday', isPositive: true }}
          onClick={() => onNavigate('analytics')}
        />
        <MetricCard
          title="Counters Active"
          value={`${openCounters.length} / ${counters.length}`}
          subtitle="2 counters paused for shift handover"
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => onNavigate('counters')}
        />
        <MetricCard
          title="Lobby Occupancy"
          value={`${overallOccupancyPct}%`}
          subtitle={`${totalZoneOccupancy} visitors inside building`}
          icon={<Flame className="w-4 h-4" />}
          trend={{ value: overallOccupancyPct > 80 ? 'Elevated' : 'Stable', isPositive: overallOccupancyPct <= 80 }}
          onClick={() => onNavigate('crowd')}
        />
      </div>

      {/* Two Column Layout: Live Queue Snapshot & Floor Heatmap Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Queue Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-borderSoft shadow-subtle p-5">
          <div className="flex items-center justify-between pb-4 border-b border-borderSoft">
            <div>
              <h3 className="text-sm font-semibold text-textMain">Live Queue Activity</h3>
              <p className="text-xs text-textMuted">Latest token transitions and calls</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('queue')}
            >
              View Full Dispatcher
            </Button>
          </div>

          <div className="divide-y divide-borderSoft">
            {tokens.slice(0, 5).map((t) => (
              <div key={t.tokenId} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-textMain text-sm">{t.tokenNumber}</span>
                  <div>
                    <p className="font-medium text-textMain">{t.visitorName}</p>
                    <p className="text-[11px] text-textMuted">{t.scheduledSlot.startTime} • {t.assignedCounterNumber || 'Awaiting Desk'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={t.status} />
                  <span className="text-textMuted text-[11px] font-mono">{t.estimatedWaitMinutes}m wait</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Zone Occupancy & Safety alerts */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-borderSoft shadow-subtle p-5">
            <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
              <h3 className="text-sm font-semibold text-textMain">Zone Occupancy</h3>
              <Button size="sm" variant="ghost" onClick={() => onNavigate('crowd')}>
                Details
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {zones.map((z) => {
                const pct = Math.round((z.currentOccupancy / z.maxCapacity) * 100);
                return (
                  <div key={z.zoneId} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-textMain truncate">{z.name}</span>
                      <span className="font-mono text-textMuted">{z.currentOccupancy}/{z.maxCapacity} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Alert Card */}
          {alerts.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{alerts[0].title}</span>
              </div>
              <p className="text-amber-700 text-[11px] leading-relaxed">{alerts[0].message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
