import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Plus, Clock, FileText } from 'lucide-react';

export const DepartmentsView: React.FC = () => {
  const { departments, services, addDepartment, addService } = useAdmin();

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  // New Department Form State
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptFloor, setDeptFloor] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // New Service Form State
  const [srvName, setSrvName] = useState('');
  const [srvCode, setSrvCode] = useState('');
  const [srvDeptId, setSrvDeptId] = useState(departments[0]?.departmentId || '');
  const [srvDuration, setSrvDuration] = useState('15');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-textMain tracking-tight">Departments & Services</h2>
          <p className="text-xs text-textMuted mt-0.5">
            Configure institutional taxonomy, service handling SLAs, and buffer durations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setServiceModalOpen(true)}
          >
            Add Service
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setDeptModalOpen(true)}
          >
            Add Department
          </Button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="space-y-6">
        {departments.map((dept) => {
          const deptServices = services.filter((s) => s.departmentId === dept.departmentId);

          return (
            <div key={dept.departmentId} className="bg-white rounded-xl border border-borderSoft shadow-subtle p-5">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-semibold text-textMain">{dept.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {dept.code}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted mt-0.5">{dept.description} • Location: {dept.floor || 'Main Wing'}</p>
                </div>
                <span className="text-xs text-textMuted font-mono font-medium">
                  {deptServices.length} Active Services
                </span>
              </div>

              {/* Department Services List */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {deptServices.map((srv) => (
                  <div
                    key={srv.serviceId}
                    className="p-3.5 rounded-lg border border-borderSoft bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-textMain">{srv.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{srv.code}</span>
                      </div>
                      <p className="text-[11px] text-textMuted mt-1 line-clamp-2">{srv.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 text-[11px] text-textMuted">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {srv.estimatedDurationMinutes}m avg
                      </span>
                      <span>
                        {srv.allowWalkIn ? 'Walk-ins OK' : 'Appt Only'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Add Department"
        description="Create a new institutional division (e.g. Cardiology, Cashier, Registrar)"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (deptName) {
                  addDepartment({ name: deptName, code: deptCode, floor: deptFloor, description: deptDesc });
                  setDeptModalOpen(false);
                  setDeptName('');
                  setDeptCode('');
                }
              }}
            >
              Create Department
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-textMain mb-1">Department Name</label>
            <input
              type="text"
              placeholder="e.g. Outpatient Diagnostics"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-textMain mb-1">Department Code</label>
            <input
              type="text"
              placeholder="e.g. DEP-DIAG-01"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-textMain mb-1">Floor / Wing</label>
            <input
              type="text"
              placeholder="e.g. Floor 2, East Corridor"
              value={deptFloor}
              onChange={(e) => setDeptFloor(e.target.value)}
              className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>
        </div>
      </Modal>

      {/* Add Service Modal */}
      <Modal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title="Add Service"
        description="Define a distinct procedure or consultation offered to visitors"
        footer={
          <>
            <Button variant="ghost" onClick={() => setServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (srvName) {
                  addService({
                    name: srvName,
                    code: srvCode,
                    departmentId: srvDeptId,
                    estimatedDurationMinutes: parseInt(srvDuration) || 15,
                  });
                  setServiceModalOpen(false);
                  setSrvName('');
                  setSrvCode('');
                }
              }}
            >
              Save Service
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-textMain mb-1">Department</label>
            <select
              value={srvDeptId}
              onChange={(e) => setSrvDeptId(e.target.value)}
              className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy bg-white"
            >
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-textMain mb-1">Service Name</label>
            <input
              type="text"
              placeholder="e.g. Comprehensive Blood Profile"
              value={srvName}
              onChange={(e) => setSrvName(e.target.value)}
              className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-textMain mb-1">Estimated Duration (Minutes)</label>
            <input
              type="number"
              value={srvDuration}
              onChange={(e) => setSrvDuration(e.target.value)}
              className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy font-mono"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
