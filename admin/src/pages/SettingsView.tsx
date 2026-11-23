import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Button } from '../components/Button';

export const SettingsView: React.FC = () => {
  const { currentInstitution, currentBranch, addToast } = useAdmin();

  const [orgName, setOrgName] = useState(currentInstitution.name);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(currentInstitution.settings.maxAdvanceBookingDays.toString());
  const [slotDuration, setSlotDuration] = useState(currentInstitution.settings.defaultSlotDurationMinutes.toString());
  const [threshold, setThreshold] = useState(currentInstitution.settings.overcrowdingAlertThresholdPercent.toString());

  const handleSave = () => {
    addToast('success', 'Institutional settings updated successfully.');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-textMain tracking-tight">Institution & Branch Configuration</h2>
        <p className="text-xs text-textMuted mt-0.5">
          General parameters, crowd safety thresholds, and operating hours
        </p>
      </div>

      <div className="bg-white rounded-xl border border-borderSoft shadow-subtle p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-textMain mb-1">Organization Title</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-textMain mb-1">Max Advance Booking (Days)</label>
            <input
              type="number"
              value={maxAdvanceDays}
              onChange={(e) => setMaxAdvanceDays(e.target.value)}
              className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-textMain mb-1">Default Slot (Minutes)</label>
            <input
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-textMain mb-1">Overcrowding Alert Threshold (%)</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-borderSoft flex justify-end">
          <Button variant="primary" onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};
