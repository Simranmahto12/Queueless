/**
 * QueueLess Institution, Department, Service, and Staff Service
 * Handles metadata queries and mutations with Firestore.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { Institution, Branch, Department, Service, Staff } from '../../types/models';
import {
  MOCK_INSTITUTIONS,
  MOCK_BRANCHES,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  MOCK_STAFF,
} from '../mockData';

// Fallback in-memory state
let inMemoryInstitutions: Institution[] = [...MOCK_INSTITUTIONS];
let inMemoryBranches: Branch[] = [...MOCK_BRANCHES];
let inMemoryDepartments: Department[] = [...MOCK_DEPARTMENTS];
let inMemoryServices: Service[] = [...MOCK_SERVICES];
let inMemoryStaff: Staff[] = [...MOCK_STAFF];

const deptSubscribers = new Map<
  (depts: Department[]) => void,
  { institutionId: string; branchId: string }
>();
const serviceSubscribers = new Map<
  (services: Service[]) => void,
  { institutionId: string; branchId: string }
>();
const staffSubscribers: Set<(staff: Staff[]) => void> = new Set();

/**
 * Listens to institutions in real time or fetches catalog.
 */
export function listenInstitutions(callback: (insts: Institution[]) => void): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    const q = query(collection(db, 'institutions'), where('isActive', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        const insts = snapshot.docs.map((d) => d.data() as Institution);
        callback(insts);
      },
      (err) => {
        console.warn('[QueueLess InstitutionService] Error fetching institutions, falling back:', err);
        callback(inMemoryInstitutions);
      }
    );
  }

  callback(inMemoryInstitutions);
  return () => {};
}

/**
 * Listens to departments in a branch.
 */
export function listenDepartments(
  institutionId: string,
  branchId: string,
  callback: (depts: Department[]) => void
): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    const q = query(
      collection(db, 'departments'),
      where('institutionId', '==', institutionId),
      where('branchId', '==', branchId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const depts = snapshot.docs.map((d) => d.data() as Department);
        callback(depts);
      },
      (err) => {
        console.warn('[QueueLess DepartmentService] Error fetching departments, falling back:', err);
        callback(
          inMemoryDepartments.filter(
            (d) => d.institutionId === institutionId && d.branchId === branchId
          )
        );
      }
    );
  }

  deptSubscribers.set(callback, { institutionId, branchId });
  callback(
    inMemoryDepartments.filter(
      (d) => d.institutionId === institutionId && d.branchId === branchId
    )
  );
  return () => {
    deptSubscribers.delete(callback);
  };
}

/**
 * Adds a new department document.
 */
export async function createDepartment(deptData: Partial<Department>): Promise<Department> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();
  const departmentId = `dep-${Date.now()}`;

  const newDept: Department = {
    id: departmentId,
    departmentId,
    institutionId: deptData.institutionId || 'inst-apex-health',
    branchId: deptData.branchId || 'branch-apex-main',
    name: deptData.name || 'New Department',
    code: deptData.code || 'DEP-NEW',
    description: deptData.description,
    floor: deptData.floor,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  if (db && isConfigured) {
    await setDoc(doc(db, 'departments', departmentId), newDept);
    return newDept;
  }

  inMemoryDepartments = [...inMemoryDepartments, newDept];
  deptSubscribers.forEach(({ institutionId, branchId }, callback) =>
    callback(
      inMemoryDepartments.filter(
        (d) => d.institutionId === institutionId && d.branchId === branchId
      )
    )
  );
  return newDept;
}

/**
 * Listens to services for a branch.
 */
export function listenServices(
  institutionId: string,
  branchId: string,
  callback: (services: Service[]) => void
): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    const q = query(
      collection(db, 'services'),
      where('institutionId', '==', institutionId),
      where('branchId', '==', branchId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const srvs = snapshot.docs.map((d) => d.data() as Service);
        callback(srvs);
      },
      (err) => {
        console.warn('[QueueLess ServiceService] Error fetching services, falling back:', err);
        callback(
          inMemoryServices.filter(
            (s) => s.institutionId === institutionId && s.branchId === branchId
          )
        );
      }
    );
  }

  serviceSubscribers.set(callback, { institutionId, branchId });
  callback(
    inMemoryServices.filter(
      (s) => s.institutionId === institutionId && s.branchId === branchId
    )
  );
  return () => {
    serviceSubscribers.delete(callback);
  };
}

/**
 * Adds a new service document.
 */
export async function createService(serviceData: Partial<Service>): Promise<Service> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();
  const serviceId = `srv-${Date.now()}`;

  const newService: Service = {
    id: serviceId,
    serviceId,
    institutionId: serviceData.institutionId || 'inst-apex-health',
    branchId: serviceData.branchId || 'branch-apex-main',
    departmentId: serviceData.departmentId || 'dep-cardio',
    name: serviceData.name || 'New Service',
    code: serviceData.code || 'SRV-NEW',
    estimatedDurationMinutes: serviceData.estimatedDurationMinutes || 15,
    bufferMinutes: serviceData.bufferMinutes || 5,
    requiresAppointment: serviceData.requiresAppointment ?? false,
    allowWalkIn: serviceData.allowWalkIn ?? true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  if (db && isConfigured) {
    await setDoc(doc(db, 'services', serviceId), newService);
    return newService;
  }

  inMemoryServices = [...inMemoryServices, newService];
  serviceSubscribers.forEach(({ institutionId, branchId }, callback) =>
    callback(
      inMemoryServices.filter(
        (s) => s.institutionId === institutionId && s.branchId === branchId
      )
    )
  );
  return newService;
}

/**
 * Listens to active branch staff.
 */
export function listenStaff(
  institutionId: string,
  branchId: string,
  callback: (staff: Staff[]) => void
): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    const q = query(
      collection(db, 'staff'),
      where('institutionId', '==', institutionId),
      where('branchId', '==', branchId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const staffList = snapshot.docs.map((d) => d.data() as Staff);
        callback(staffList);
      },
      (err) => {
        console.warn('[QueueLess StaffService] Error fetching staff, falling back:', err);
        callback(inMemoryStaff.filter((s) => s.institutionId === institutionId));
      }
    );
  }

  staffSubscribers.add(callback);
  callback(inMemoryStaff.filter((s) => s.institutionId === institutionId));
  return () => {
    staffSubscribers.delete(callback);
  };
}
