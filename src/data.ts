export interface Project {
  id: string;
  name: string;
  customer: string;
  customerContact: string;
  includedHours: number;
  overageRate: number; // THB / hour
  consultants: string[];
  customers: string[];
  startDate: string;
  notes: string;
}

export interface Consultant {
  id: string;
  name: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
}

export interface Log {
  id: string;
  projectId: string;
  date: string;
  hours: number;
  consultantId: string;
  billable: boolean;
  topic: string;
}

export interface ProjectUsage {
  used: number;
  remaining: number;
  overHours: number;
  overCost: number;
  pct: number;
}

export const SEED_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Project Aurora',
    customer: 'Northwind Co.',
    customerContact: 'j.lee@northwind.example',
    includedHours: 20,
    overageRate: 2500,
    consultants: ['c1', 'c2'],
    customers: ['u1'],
    startDate: '2026-04-01',
    notes: 'Quarterly strategy + implementation review.',
  },
  {
    id: 'p2',
    name: 'Project Borealis',
    customer: 'Helix Labs',
    customerContact: 'ops@helix.example',
    includedHours: 10,
    overageRate: 3000,
    consultants: ['c2', 'c3'],
    customers: ['u2'],
    startDate: '2026-04-08',
    notes: 'Data pipeline design + onboarding.',
  },
  {
    id: 'p3',
    name: 'Project Cinder',
    customer: 'Meridian Group',
    customerContact: 'pm@meridian.example',
    includedHours: 15,
    overageRate: 2800,
    consultants: ['c1', 'c3'],
    customers: ['u3'],
    startDate: '2026-03-15',
    notes: 'Rollout support, training, weekly office hours.',
  },
];

export const SEED_CONSULTANTS: Consultant[] = [
  { id: 'c1', name: 'Anna Sirikanya', role: 'Senior Consultant' },
  { id: 'c2', name: 'Marcus Lin', role: 'Consultant' },
  { id: 'c3', name: 'Priya Raman', role: 'Principal' },
  { id: 'c4', name: 'Tomás García', role: 'Consultant' },
];

export const SEED_CUSTOMERS: Customer[] = [
  { id: 'u1', name: 'Jamie Lee', company: 'Northwind Co.' },
  { id: 'u2', name: 'Sasha Petrov', company: 'Helix Labs' },
  { id: 'u3', name: 'Daniel Okafor', company: 'Meridian Group' },
];

// Project Aurora — 20h included, well under
// Project Borealis — 10h included, near limit (9h used)
// Project Cinder — 15h included, OVER (~18.5h used)
export const SEED_LOGS: Log[] = [
  { id: 'l1',  projectId: 'p1', date: '2026-04-03', hours: 1.5, consultantId: 'c1', billable: true, topic: 'Kickoff' },
  { id: 'l2',  projectId: 'p1', date: '2026-04-09', hours: 2.0, consultantId: 'c2', billable: true, topic: 'Discovery' },
  { id: 'l3',  projectId: 'p1', date: '2026-04-14', hours: 1.0, consultantId: 'c1', billable: true, topic: 'Workshop' },
  { id: 'l4',  projectId: 'p1', date: '2026-04-18', hours: 2.5, consultantId: 'c2', billable: true, topic: 'Design review' },
  { id: 'l5',  projectId: 'p1', date: '2026-04-22', hours: 1.5, consultantId: 'c1', billable: true, topic: 'Stakeholder sync' },

  { id: 'l6',  projectId: 'p2', date: '2026-04-09', hours: 2.0, consultantId: 'c2', billable: true, topic: 'Architecture' },
  { id: 'l7',  projectId: 'p2', date: '2026-04-12', hours: 1.5, consultantId: 'c3', billable: true, topic: 'Schema review' },
  { id: 'l8',  projectId: 'p2', date: '2026-04-16', hours: 2.0, consultantId: 'c2', billable: true, topic: 'Pipeline build' },
  { id: 'l9',  projectId: 'p2', date: '2026-04-20', hours: 1.5, consultantId: 'c3', billable: true, topic: 'Onboarding' },
  { id: 'l10', projectId: 'p2', date: '2026-04-24', hours: 2.0, consultantId: 'c2', billable: true, topic: 'QA + handoff prep' },

  { id: 'l11', projectId: 'p3', date: '2026-03-18', hours: 2.0, consultantId: 'c1', billable: true, topic: 'Rollout planning' },
  { id: 'l12', projectId: 'p3', date: '2026-03-25', hours: 1.5, consultantId: 'c3', billable: true, topic: 'Training prep' },
  { id: 'l13', projectId: 'p3', date: '2026-04-01', hours: 3.0, consultantId: 'c1', billable: true, topic: 'Training session' },
  { id: 'l14', projectId: 'p3', date: '2026-04-07', hours: 2.0, consultantId: 'c3', billable: true, topic: 'Office hours' },
  { id: 'l15', projectId: 'p3', date: '2026-04-12', hours: 2.5, consultantId: 'c1', billable: true, topic: 'Issue triage' },
  { id: 'l16', projectId: 'p3', date: '2026-04-17', hours: 2.5, consultantId: 'c3', billable: true, topic: 'Office hours' },
  { id: 'l17', projectId: 'p3', date: '2026-04-21', hours: 2.0, consultantId: 'c1', billable: true, topic: 'Migration support' },
  { id: 'l18', projectId: 'p3', date: '2026-04-25', hours: 3.0, consultantId: 'c3', billable: true, topic: 'Extended workshop' },
];

export const fmtTHB = (n: number) => '฿' + Math.round(n).toLocaleString('en-US');
export const fmtHrs = (n: number) => (Math.round(n * 10) / 10).toString();

export function projectUsage(project: Project, logs: Log[]): ProjectUsage {
  const used = logs
    .filter((l) => l.projectId === project.id && l.billable)
    .reduce((s, l) => s + l.hours, 0);
  const remaining = Math.max(0, project.includedHours - used);
  const overHours = Math.max(0, used - project.includedHours);
  const overCost = overHours * project.overageRate;
  const pct = project.includedHours === 0 ? 0 : (used / project.includedHours) * 100;
  return { used, remaining, overHours, overCost, pct };
}

export function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtDateLong(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
