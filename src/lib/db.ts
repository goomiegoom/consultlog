import { supabase } from './supabase';
import type { Project, Consultant, Customer, Log } from '../data';

// ── Types matching Supabase rows ──────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  role: 'admin' | 'consultant' | 'customer';
  job_title: string;
  company: string;
}

interface DBProject {
  id: string;
  name: string;
  customer_company: string;
  customer_contact: string;
  included_hours: number;
  overage_rate: number;
  start_date: string;
  notes: string;
}

interface DBMember {
  project_id: string;
  user_id: string;
  member_type: 'consultant' | 'customer';
}

interface DBLog {
  id: string;
  project_id: string;
  consultant_id: string;
  date: string;
  hours: number;
  billable: boolean;
  topic: string;
}

// ── Fetch profile for logged-in user ─────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('fetchProfile', error); return null; }
  return data as Profile;
}

// ── Fetch all app data ────────────────────────────────────────────────────────

export interface AppData {
  projects: Project[];
  logs: Log[];
  consultants: Consultant[];
  customers: Customer[];
}

export async function fetchAppData(): Promise<AppData> {
  const [
    { data: dbProjects },
    { data: dbMembers },
    { data: dbLogs },
    { data: dbProfiles },
  ] = await Promise.all([
    supabase.from('projects').select('*').order('created_at'),
    supabase.from('project_members').select('*'),
    supabase.from('logs').select('*').order('date', { ascending: false }),
    supabase.from('profiles').select('*').order('name'),
  ]);

  const projects: Project[] = (dbProjects as DBProject[] ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    customer: p.customer_company,
    customerContact: p.customer_contact,
    includedHours: p.included_hours,
    overageRate: p.overage_rate,
    startDate: p.start_date,
    notes: p.notes,
    consultants: (dbMembers as DBMember[] ?? [])
      .filter((m) => m.project_id === p.id && m.member_type === 'consultant')
      .map((m) => m.user_id),
    customers: (dbMembers as DBMember[] ?? [])
      .filter((m) => m.project_id === p.id && m.member_type === 'customer')
      .map((m) => m.user_id),
  }));

  const logs: Log[] = (dbLogs as DBLog[] ?? []).map((l) => ({
    id: l.id,
    projectId: l.project_id,
    consultantId: l.consultant_id,
    date: l.date,
    hours: l.hours,
    billable: l.billable,
    topic: l.topic,
  }));

  const profiles = dbProfiles as Profile[] ?? [];
  const consultants: Consultant[] = profiles
    .filter((p) => p.role === 'consultant' || p.role === 'admin')
    .map((p) => ({
      id: p.id,
      name: p.name,
      role: p.job_title || (p.role.charAt(0).toUpperCase() + p.role.slice(1)),
    }));
  const customers: Customer[] = profiles
    .filter((p) => p.role === 'customer')
    .map((p) => ({ id: p.id, name: p.name, company: p.company }));

  return { projects, logs, consultants, customers };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function saveProject(project: Project): Promise<string> {
  const isNew = !project.id;
  const row = {
    ...(isNew ? {} : { id: project.id }),
    name: project.name,
    customer_company: project.customer,
    customer_contact: project.customerContact,
    included_hours: project.includedHours,
    overage_rate: project.overageRate,
    start_date: project.startDate,
    notes: project.notes,
  };

  const { data, error } = await supabase
    .from('projects')
    .upsert(row)
    .select('id')
    .single();
  if (error) throw error;

  const projectId = (data as { id: string }).id;

  // Replace all members for this project
  await supabase.from('project_members').delete().eq('project_id', projectId);
  const memberRows = [
    ...project.consultants.map((uid) => ({ project_id: projectId, user_id: uid, member_type: 'consultant' as const })),
    ...project.customers.map((uid) => ({ project_id: projectId, user_id: uid, member_type: 'customer' as const })),
  ];
  if (memberRows.length > 0) {
    const { error: membErr } = await supabase.from('project_members').insert(memberRows);
    if (membErr) throw membErr;
  }

  return projectId;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}

export async function addLog(entry: Omit<Log, 'id'>): Promise<Log> {
  const { data, error } = await supabase
    .from('logs')
    .insert({
      project_id:    entry.projectId,
      consultant_id: entry.consultantId,
      date:          entry.date,
      hours:         entry.hours,
      billable:      entry.billable,
      topic:         entry.topic,
    })
    .select('*')
    .single();
  if (error) throw error;
  const l = data as DBLog;
  return { id: l.id, projectId: l.project_id, consultantId: l.consultant_id, date: l.date, hours: l.hours, billable: l.billable, topic: l.topic };
}

export async function removeLog(logId: string): Promise<void> {
  const { error } = await supabase.from('logs').delete().eq('id', logId);
  if (error) throw error;
}
