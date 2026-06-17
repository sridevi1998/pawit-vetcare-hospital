export type PawItRole =
  | "ClinicAdmin"
  | "Veterinarian"
  | "Receptionist"
  | "VetTechnician"
  | "LabTechnician"
  | "PetParent"
  | "SuperAdmin";

export type SectionKey =
  | "dashboard"
  | "appointments"
  | "calendar"
  | "queue"
  | "patients"
  | "prescriptions"
  | "clinical-notes"
  | "lab-tests"
  | "billing"
  | "analytics"
  | "feedback"
  | "doctors"
  | "staff"
  | "tenants"
  | "audit-logs";

const roleSections: Record<PawItRole, SectionKey[]> = {
  SuperAdmin: ["dashboard", "tenants", "audit-logs"],
  ClinicAdmin: [
    "dashboard",
    "appointments",
    "calendar",
    "queue",
    "patients",
    "prescriptions",
    "clinical-notes",
    "lab-tests",
    "billing",
    "analytics",
    "feedback",
    "doctors",
    "staff",
    "audit-logs",
  ],
  Veterinarian: [
    "dashboard",
    "appointments",
    "calendar",
    "queue",
    "patients",
    "prescriptions",
    "clinical-notes",
    "lab-tests",
    "analytics",
    "doctors",
  ],
  Receptionist: [
    "dashboard",
    "appointments",
    "calendar",
    "queue",
    "patients",
    "prescriptions",
    "clinical-notes",
    "lab-tests",
    "billing",
    "feedback",
    "doctors",
  ],
  VetTechnician: [
    "dashboard",
    "appointments",
    "calendar",
    "patients",
    "prescriptions",
    "clinical-notes",
    "lab-tests",
    "analytics",
    "doctors",
  ],
  LabTechnician: ["dashboard", "lab-tests", "analytics"],
  PetParent: ["patients", "prescriptions", "clinical-notes", "lab-tests", "billing"],
};

const roleActions: Record<PawItRole, SectionKey[]> = {
  SuperAdmin: ["tenants"],
  ClinicAdmin: ["appointments", "calendar", "queue", "patients", "prescriptions", "clinical-notes", "lab-tests", "billing", "staff"],
  Veterinarian: ["appointments", "calendar", "queue", "prescriptions", "clinical-notes", "lab-tests"],
  Receptionist: ["appointments", "calendar", "queue", "patients", "lab-tests", "billing"],
  VetTechnician: ["appointments", "calendar", "prescriptions", "clinical-notes", "lab-tests"],
  LabTechnician: [],
  PetParent: ["appointments", "calendar", "patients"],
};

export function normalizeRole(role: string): PawItRole {
  if (isPawItRole(role)) {
    return role;
  }
  return "PetParent";
}

export function sectionsForRole(role: string): SectionKey[] {
  return roleSections[normalizeRole(role)];
}

export function defaultSectionForRole(role: string): SectionKey {
  return sectionsForRole(role)[0] ?? "patients";
}

export function canAccessSection(role: string, section: SectionKey): boolean {
  return sectionsForRole(role).includes(section);
}

export function canUseSectionActions(role: string, section: SectionKey): boolean {
  return roleActions[normalizeRole(role)].includes(section);
}

function isPawItRole(role: string): role is PawItRole {
  return ["SuperAdmin", "ClinicAdmin", "Veterinarian", "Receptionist", "VetTechnician", "LabTechnician", "PetParent"].includes(role);
}
