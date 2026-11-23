import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { CounterStatus } from '@queueless/shared';
import { Play, Pause, Power, User } from 'lucide-react';

export const CountersView: React.FC = () => {
  const { counters, departments, staff, tokens, updateCounterStatus, callNextToken } = useAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-textMain tracking-tight">Counters & Physical Desks</h2>
        <p className="text-xs text-textMuted mt-0.5">
          Manage operational desk availability, active staff assignments, and dispatch states
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {counters.map((counter) => {
          const dept = departments.find((d) => d.departmentId === counter.departmentId);
          const currentStaff = staff.find((s) => s.staffId === counter.currentStaffId);
          const activeToken = tokens.find((t) => t.tokenId === counter.currentServedTokenId);

          return (
            <div
              key={counter.counterId}
              className="bg-white rounded-xl border border-borderSoft shadow-subtle p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-textMain">{counter.counterNumber}</h3>
                    <p className="text-[11px] text-textMuted mt-0.5">{dept?.name || 'General Desk'}</p>
                  </div>
                  <Badge status={counter.status} />
                </div>

                {/* Assigned Staff */}
                <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-borderSoft flex items-center gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-textMain truncate">
                      {currentStaff ? currentStaff.employeeCode : 'Unstaffed Desk'}
                    </p>
                    <p className="text-[11px] text-textMuted truncate">
                      {currentStaff ? currentStaff.role.replace('_', ' ') : 'Ready for check-in'}
                    </p>
                  </div>
                </div>

                {/* Currently Served Token */}
                <div className="my-4">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-textMuted">
                    Serving Token
                  </span>
                  {activeToken ? (
                    <div className="mt-1 flex items-baseline justify-between p-2 rounded bg-blue-50/60 border border-blue-100">
                      <span className="font-mono font-bold text-base text-blue-900">
                        {activeToken.tokenNumber}
                      </span>
                      <span className="text-xs text-blue-800 font-medium truncate max-w-[120px]">
                        {activeToken.visitorName}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 p-2 rounded bg-slate-50 text-slate-400 text-xs italic">
                      No token actively at counter
                    </div>
                  )}
                </div>
              </div>

              {/* Operational Controls */}
              <div className="pt-3 border-t border-borderSoft flex items-center justify-between gap-2">
                {counter.status === CounterStatus.OPEN ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Play className="w-3 h-3" />}
                      onClick={() => callNextToken(counter.counterId)}
                      className="flex-1"
                    >
                      Call Next
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Pause className="w-3 h-3" />}
                      onClick={() => updateCounterStatus(counter.counterId, CounterStatus.PAUSED)}
                      title="Pause for break"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Power className="w-3 h-3 text-red-500" />}
                      onClick={() => updateCounterStatus(counter.counterId, CounterStatus.CLOSED)}
                      title="Close counter"
                    />
                  </>
                ) : counter.status === CounterStatus.PAUSED ? (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Play className="w-3 h-3" />}
                      onClick={() => updateCounterStatus(counter.counterId, CounterStatus.OPEN)}
                      className="flex-1"
                    >
                      Resume Desk
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Power className="w-3 h-3 text-red-500" />}
                      onClick={() => updateCounterStatus(counter.counterId, CounterStatus.CLOSED)}
                      title="Close counter"
                    />
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Power className="w-3 h-3 text-emerald-400" />}
                    onClick={() => updateCounterStatus(counter.counterId, CounterStatus.OPEN)}
                    className="w-full"
                  >
                    Open Desk
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
