import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { Button } from '../components/Button';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { alerts, acknowledgeAlert } = useAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-textMain tracking-tight">Alerts & Safety Management</h2>
        <p className="text-xs text-textMuted mt-0.5">
          Real-time alerts for overcrowding, counter bottlenecks, and extended wait times
        </p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.alertId}
            className={`p-5 rounded-xl border transition-all ${
              alert.isAcknowledged
                ? 'bg-white border-borderSoft opacity-80'
                : alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                ? 'bg-red-50/50 border-red-200'
                : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-textMain">{alert.title}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted mt-1 leading-relaxed">{alert.message}</p>
                  <div className="text-[11px] text-textMuted mt-2 font-mono">
                    Triggered at: {new Date(alert.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {!alert.isAcknowledged ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => acknowledgeAlert(alert.alertId)}
                >
                  Acknowledge
                </Button>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
