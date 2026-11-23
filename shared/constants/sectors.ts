/**
 * QueueLess Multi-Sector Configurations
 * Pre-defined metadata and templates for non-hospital and hospital sectors alike.
 */

import { InstitutionSector } from '../types/enums';

export interface SectorPreset {
  sector: InstitutionSector;
  displayName: string;
  defaultDepartments: {
    name: string;
    code: string;
    defaultServices: {
      name: string;
      code: string;
      estimatedDurationMinutes: number;
    }[];
  }[];
  defaultZones: {
    name: string;
    recommendedCapacity: number;
  }[];
}

export const SECTOR_PRESETS: Record<InstitutionSector, SectorPreset> = {
  [InstitutionSector.HEALTHCARE]: {
    sector: InstitutionSector.HEALTHCARE,
    displayName: 'Healthcare & Medical Centers',
    defaultDepartments: [
      {
        name: 'General Consultation',
        code: 'MED-GEN',
        defaultServices: [
          { name: 'Physician Consultation', code: 'SRV-GEN-CONS', estimatedDurationMinutes: 15 },
          { name: 'Follow-up Checkup', code: 'SRV-GEN-FOL', estimatedDurationMinutes: 10 },
        ],
      },
      {
        name: 'Diagnostics & Pathology',
        code: 'MED-DIAG',
        defaultServices: [
          { name: 'Blood Sample Collection', code: 'SRV-DIAG-BLD', estimatedDurationMinutes: 8 },
          { name: 'X-Ray & Radiology', code: 'SRV-DIAG-XRAY', estimatedDurationMinutes: 20 },
        ],
      },
      {
        name: 'Pharmacy & Billing',
        code: 'MED-PHARM',
        defaultServices: [
          { name: 'Medicine Dispensation', code: 'SRV-PHARM-DISP', estimatedDurationMinutes: 6 },
          { name: 'Insurance & Billing Claim', code: 'SRV-PHARM-BILL', estimatedDurationMinutes: 12 },
        ],
      },
    ],
    defaultZones: [
      { name: 'Outpatient Reception Hall', recommendedCapacity: 80 },
      { name: 'Radiology Waiting Lounge', recommendedCapacity: 30 },
      { name: 'Pharmacy Queue Area', recommendedCapacity: 40 },
    ],
  },

  [InstitutionSector.BANKING]: {
    sector: InstitutionSector.BANKING,
    displayName: 'Banking & Financial Institutions',
    defaultDepartments: [
      {
        name: 'Teller Services',
        code: 'BNK-TEL',
        defaultServices: [
          { name: 'Cash Deposit & Withdrawal', code: 'SRV-BNK-CASH', estimatedDurationMinutes: 7 },
          { name: 'Demand Draft / Cheque Clearance', code: 'SRV-BNK-CHQ', estimatedDurationMinutes: 8 },
        ],
      },
      {
        name: 'Customer Relationship',
        code: 'BNK-CRM',
        defaultServices: [
          { name: 'New Account Opening', code: 'SRV-BNK-ACC', estimatedDurationMinutes: 25 },
          { name: 'KYC & Document Update', code: 'SRV-BNK-KYC', estimatedDurationMinutes: 12 },
          { name: 'Debit / Credit Card Services', code: 'SRV-BNK-CRD', estimatedDurationMinutes: 10 },
        ],
      },
      {
        name: 'Loans & Mortgages',
        code: 'BNK-LOAN',
        defaultServices: [
          { name: 'Personal / Home Loan Advisory', code: 'SRV-BNK-LNADV', estimatedDurationMinutes: 30 },
          { name: 'Loan Documentation & Disbursal', code: 'SRV-BNK-LNDIS', estimatedDurationMinutes: 35 },
        ],
      },
    ],
    defaultZones: [
      { name: 'Main Banking Hall', recommendedCapacity: 60 },
      { name: 'Priority Relationship Lounge', recommendedCapacity: 20 },
      { name: 'Self-Service ATM & Kiosk Area', recommendedCapacity: 15 },
    ],
  },

  [InstitutionSector.EDUCATION]: {
    sector: InstitutionSector.EDUCATION,
    displayName: 'Universities & Academic Institutions',
    defaultDepartments: [
      {
        name: 'Registrar & Admissions',
        code: 'EDU-REG',
        defaultServices: [
          { name: 'Document Verification & Enrollment', code: 'SRV-EDU-ENR', estimatedDurationMinutes: 15 },
          { name: 'Transcript & Degree Issuance', code: 'SRV-EDU-TRN', estimatedDurationMinutes: 10 },
        ],
      },
      {
        name: 'Student Finance & Accounts',
        code: 'EDU-ACC',
        defaultServices: [
          { name: 'Semester Tuition Fee Payment', code: 'SRV-EDU-FEE', estimatedDurationMinutes: 8 },
          { name: 'Scholarship Processing', code: 'SRV-EDU-SCHOL', estimatedDurationMinutes: 18 },
        ],
      },
      {
        name: 'Examination Cell',
        code: 'EDU-EXAM',
        defaultServices: [
          { name: 'Admit Card Collection', code: 'SRV-EDU-ADMIT', estimatedDurationMinutes: 5 },
          { name: 'Re-evaluation Application', code: 'SRV-EDU-REEV', estimatedDurationMinutes: 12 },
        ],
      },
    ],
    defaultZones: [
      { name: 'Administration Complex Lobby', recommendedCapacity: 100 },
      { name: 'Accounts Waiting Gallery', recommendedCapacity: 50 },
    ],
  },

  [InstitutionSector.GOVERNMENT]: {
    sector: InstitutionSector.GOVERNMENT,
    displayName: 'Government & Municipal Offices',
    defaultDepartments: [
      {
        name: 'Citizen Identity & Registry',
        code: 'GOV-REG',
        defaultServices: [
          { name: 'Biometric Enrollment & Update', code: 'SRV-GOV-BIO', estimatedDurationMinutes: 12 },
          { name: 'Address & Details Modification', code: 'SRV-GOV-MOD', estimatedDurationMinutes: 10 },
        ],
      },
      {
        name: 'Transport & Driving Licenses',
        code: 'GOV-RTO',
        defaultServices: [
          { name: 'Learner License Test & Verification', code: 'SRV-GOV-LLR', estimatedDurationMinutes: 15 },
          { name: 'Vehicle Registration (RC)', code: 'SRV-GOV-RC', estimatedDurationMinutes: 18 },
        ],
      },
      {
        name: 'Revenue & Certificates',
        code: 'GOV-REV',
        defaultServices: [
          { name: 'Income / Caste Certificate Issuance', code: 'SRV-GOV-CERT', estimatedDurationMinutes: 12 },
          { name: 'Property Tax Assessment', code: 'SRV-GOV-TAX', estimatedDurationMinutes: 20 },
        ],
      },
    ],
    defaultZones: [
      { name: 'Public Concourse Waiting Hall', recommendedCapacity: 150 },
      { name: 'Document Verification Waiting Bay', recommendedCapacity: 60 },
    ],
  },

  [InstitutionSector.PUBLIC_SERVICES]: {
    sector: InstitutionSector.PUBLIC_SERVICES,
    displayName: 'Public Services & Utility Providers',
    defaultDepartments: [
      {
        name: 'Customer Support & Billing',
        code: 'PUB-CS',
        defaultServices: [
          { name: 'Utility Bill Payment & Inquiries', code: 'SRV-PUB-BILL', estimatedDurationMinutes: 8 },
          { name: 'New Connection Application', code: 'SRV-PUB-CONN', estimatedDurationMinutes: 20 },
        ],
      },
    ],
    defaultZones: [
      { name: 'Customer Service Lounge', recommendedCapacity: 50 },
    ],
  },

  [InstitutionSector.RETAIL_SERVICE]: {
    sector: InstitutionSector.RETAIL_SERVICE,
    displayName: 'Customer Service & Repair Centers',
    defaultDepartments: [
      {
        name: 'Device Intake & Diagnostics',
        code: 'RET-INTAKE',
        defaultServices: [
          { name: 'Warranty Claim & Hardware Drop-off', code: 'SRV-RET-WARR', estimatedDurationMinutes: 15 },
          { name: 'Repair Collection & Payment', code: 'SRV-RET-PICKUP', estimatedDurationMinutes: 7 },
        ],
      },
    ],
    defaultZones: [
      { name: 'Storefront Service Waiting Area', recommendedCapacity: 40 },
    ],
  },

  [InstitutionSector.OTHER]: {
    sector: InstitutionSector.OTHER,
    displayName: 'General Service Provider',
    defaultDepartments: [
      {
        name: 'General Service Window',
        code: 'OTH-GEN',
        defaultServices: [
          { name: 'Standard Service Inquiry', code: 'SRV-OTH-GEN', estimatedDurationMinutes: 15 },
        ],
      },
    ],
    defaultZones: [
      { name: 'General Waiting Area', recommendedCapacity: 50 },
    ],
  },
};
