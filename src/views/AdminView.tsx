import React from 'react';
import {
  Project, Consultant, Customer, Log,
  projectUsage, fmtTHB, fmtHrs, fmtDate, fmtDateLong,
} from '../data';
import {
  Avatar, ProgressBar, Modal, Button, Field, Input, Textarea, Select, Toggle,
  StatusPill, statusForUsage,
  IconPlus, IconEdit, IconTrash, IconClock,
} from '../components/ui';
import type { Profile } from '../lib/db';

// ── Shared sub-components used by multiple views ──────────────────────────────

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

export function CardHeader({
  title, subtitle, action,
}: {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '14px 18px', borderBottom: '1px solid var(--border)', gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase',
      letterSpacing: '.06em', marginBottom: 8, fontWeight: 500,
    }}>
      {children}
    </div>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)',
      fontSize: 12, border: '1px dashed var(--border)', borderRadius: 8,
    }}>{children}</div>
  );
}

// ── Log Meeting Modal (also used by ConsultantView) ───────────────────────────

export function LogMeetingModal({
  open, project, consultants, defaultConsultantId,
  onClose, onSave, title, lockedConsultantId,
}: {
  open: boolean;
  project: Project | null;
  consultants: Consultant[];
  defaultConsultantId?: string | null;
  onClose: () => void;
  onSave: (entry: Omit<Log, 'id'>) => void;
  title?: string;
  lockedConsultantId?: string | null;
}) {
  const [draft, setDraft] = React.useState<Omit<Log, 'id'> | null>(null);

  React.useEffect(() => {
    if (!open || !project) return;
    setDraft({
      projectId: project.id,
      date: new Date().toISOString().slice(0, 10),
      hours: 1.0,
      consultantId: lockedConsultantId || defaultConsultantId || project.consultants[0],
      billable: true,
      topic: '',
    });
  }, [open, project, defaultConsultantId, lockedConsultantId]);

  if (!draft || !project) return null;
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft({ ...draft, [k]: v });
  const valid = draft.hours > 0 && !!draft.date && !!draft.consultantId;
  const teamConsultants = consultants.filter((c) => project.consultants.includes(c.id));

  return (
    <Modal open={open} onClose={onClose}
      title={title || `Log meeting · ${project.name}`}
      width={420}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(draft)}>Log meeting</Button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Date">
            <Input type="date" value={draft.date} onChange={(v) => set('date', v as string)} />
          </Field>
          <Field label="Duration">
            <Input type="number" value={draft.hours} onChange={(v) => set('hours', v as number)} suffix="hours" />
          </Field>
        </div>
        <Field label="Consultant">
          {lockedConsultantId ? (() => {
            const c = consultants.find((x) => x.id === lockedConsultantId);
            return c ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', background: 'var(--surface-0)',
                border: '1px solid var(--border)', borderRadius: 7,
              }}>
                <Avatar name={c.name} size={22} />
                <span style={{ color: 'var(--text-1)', fontSize: 13 }}>{c.name}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 11 }}>· you</span>
              </div>
            ) : null;
          })() : (
            <Select value={draft.consultantId}
              onChange={(v) => set('consultantId', v)}
              options={teamConsultants.map((c) => ({ value: c.id, label: c.name }))} />
          )}
        </Field>
        <Field label="Topic" hint="Short note — visible to admin & consultant only.">
          <Input value={draft.topic} onChange={(v) => set('topic', v as string)} placeholder="e.g. Architecture review" />
        </Field>
        <Toggle value={draft.billable} onChange={(v) => set('billable', v)}
          label="Billable (count toward project hours)" />
      </div>
    </Modal>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function Stat({
  label, value, suffix, hint, tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  hint?: string;
  tone?: 'over' | 'default';
}) {
  return (
    <div style={{
      background: 'var(--surface-1)', padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 500,
        color: tone === 'over' ? 'var(--danger)' : 'var(--text-1)',
        fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
      }}>
        {value}{suffix && <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 2, fontWeight: 400 }}>{suffix}</span>}
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</div>}
    </div>
  );
}

// ── Table helpers ─────────────────────────────────────────────────────────────

const Th = ({ children, align = 'left', width }: { children?: React.ReactNode; align?: 'left' | 'right'; width?: number }) => (
  <th style={{ textAlign: align, fontWeight: 500, padding: '10px 14px', width, whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

const Td = ({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) => (
  <td style={{ textAlign: align, padding: '12px 14px', verticalAlign: 'middle' }}>
    {children}
  </td>
);

// ── Row menu (···) ────────────────────────────────────────────────────────────

function MenuItem({
  children, icon, onClick, danger,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '6px 10px', border: 0, borderRadius: 5, cursor: 'pointer',
        background: hov ? 'var(--surface-2)' : 'transparent',
        color: danger ? 'var(--danger)' : 'var(--text-2)',
        fontSize: 12, fontFamily: 'inherit', textAlign: 'left',
      }}>{icon}{children}</button>
  );
}

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: 28, height: 28, borderRadius: 6, background: 'transparent',
        border: 0, color: 'var(--text-3)', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-3)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="3" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="13" cy="8" r="1.3" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 4, minWidth: 140, zIndex: 50,
          boxShadow: '0 8px 24px rgba(0,0,0,.4)',
        }}>
          <MenuItem icon={<IconEdit size={13} />} onClick={() => { onEdit(); setOpen(false); }}>Edit project</MenuItem>
          <MenuItem icon={<IconTrash size={13} />} danger onClick={() => { onDelete(); setOpen(false); }}>Delete</MenuItem>
        </div>
      )}
    </div>
  );
}

// ── Projects table ────────────────────────────────────────────────────────────

function ProjectsTable({
  projects, logs, consultants, selectedId,
  onSelect, onEdit, onLog, onDelete,
}: {
  projects: Project[];
  logs: Log[];
  consultants: Consultant[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit: (p: Project) => void;
  onLog: (p: Project) => void;
  onDelete: (p: Project) => void;
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{
          background: 'var(--surface-0)', color: 'var(--text-3)',
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em',
        }}>
          <Th>Project</Th>
          <Th>Customer</Th>
          <Th>Consultants</Th>
          <Th align="right">Used / Included</Th>
          <Th width={180}>Usage</Th>
          <Th align="right">Overage</Th>
          <Th width={120} />
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => {
          const u = projectUsage(p, logs);
          const status = statusForUsage(u);
          const consultantList = p.consultants
            .map((id) => consultants.find((c) => c.id === id))
            .filter((c): c is Consultant => !!c);
          const isSel = p.id === selectedId;
          return (
            <tr key={p.id} onClick={() => onSelect(p.id)}
              style={{
                borderTop: '1px solid var(--border)',
                background: isSel ? 'var(--surface-2)' : 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-0)'; }}
              onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
              <Td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>{p.name}</span>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </div>
              </Td>
              <Td>
                <div style={{ color: 'var(--text-2)' }}>{p.customer}</div>
                <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{p.customerContact}</div>
              </Td>
              <Td>
                <div style={{ display: 'flex', marginLeft: 4 }}>
                  {consultantList.slice(0, 3).map((c) => (
                    <span key={c.id} title={c.name} style={{
                      marginLeft: -4, border: '2px solid var(--surface-1)', borderRadius: '50%',
                    }}>
                      <Avatar name={c.name} size={24} />
                    </span>
                  ))}
                  {consultantList.length > 3 && (
                    <span style={{ marginLeft: 6, alignSelf: 'center', color: 'var(--text-3)', fontSize: 11 }}>
                      +{consultantList.length - 3}
                    </span>
                  )}
                </div>
              </Td>
              <Td align="right">
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                  {fmtHrs(u.used)}
                </span>
                <span style={{ color: 'var(--text-3)' }}> / {fmtHrs(p.includedHours)}h</span>
              </Td>
              <Td>
                <ProgressBar used={u.used} included={p.includedHours} />
              </Td>
              <Td align="right">
                {u.overHours > 0 ? (
                  <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                    {fmtTHB(u.overCost)}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-3)' }}>—</span>
                )}
              </Td>
              <Td align="right">
                <div style={{ display: 'inline-flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" icon={<IconClock size={14} />} onClick={() => onLog(p)}>Log</Button>
                  <RowMenu onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} />
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── People picker (used in project form) ──────────────────────────────────────

function PeoplePicker({
  people, selected, onToggle, sub,
}: {
  people: (Consultant | Customer)[];
  selected: string[];
  onToggle: (id: string) => void;
  sub?: (p: Consultant | Customer) => string;
}) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6,
      padding: 6, background: 'var(--surface-0)',
      border: '1px solid var(--border)', borderRadius: 8,
    }}>
      {people.map((p) => {
        const isSel = selected.includes(p.id);
        return (
          <button key={p.id} type="button" onClick={() => onToggle(p.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px 4px 4px', borderRadius: 999,
              background: isSel ? 'var(--accent-soft)' : 'var(--surface-2)',
              border: `1px solid ${isSel ? 'var(--accent)' : 'transparent'}`,
              color: isSel ? 'var(--accent)' : 'var(--text-2)',
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            }}>
            <Avatar name={p.name} size={20} />
            <span>{p.name}</span>
            {sub && <span style={{ color: 'var(--text-3)', fontSize: 11 }}>· {sub(p)}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Project form modal ────────────────────────────────────────────────────────

function ProjectFormModal({
  open, project, consultants, customers, onClose, onSave,
}: {
  open: boolean;
  project: Project | null;
  consultants: Consultant[];
  customers: Customer[];
  onClose: () => void;
  onSave: (p: Project) => void;
}) {
  const [draft, setDraft] = React.useState<Project | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setDraft(project ? { ...project } : {
      id: '',
      name: '', customer: '', customerContact: '',
      includedHours: 10, overageRate: 2500,
      consultants: [], customers: [],
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      notes: '',
    });
  }, [open, project]);

  if (!draft) return null;
  const set = <K extends keyof Project>(k: K, v: Project[K]) => setDraft({ ...draft, [k]: v });
  const toggleId = (key: 'consultants' | 'customers', id: string) => {
    const arr = draft[key];
    set(key, arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };
  const valid = draft.name.trim() && draft.customer.trim() && draft.includedHours > 0 && draft.overageRate >= 0;

  return (
    <Modal open={open} onClose={onClose}
      title={project ? `Edit project · ${project.name}` : 'New project'}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(draft)}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Project name">
          <Input value={draft.name} onChange={(v) => set('name', v as string)} placeholder="e.g. Project Delphi" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Customer / company">
            <Input value={draft.customer} onChange={(v) => set('customer', v as string)} placeholder="Acme Corp" />
          </Field>
          <Field label="Primary contact">
            <Input value={draft.customerContact} onChange={(v) => set('customerContact', v as string)} placeholder="email@acme.com" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Included hours">
            <Input type="number" value={draft.includedHours} onChange={(v) => set('includedHours', v as number)} suffix="h" />
          </Field>
          <Field label="Overage rate">
            <Input type="number" value={draft.overageRate} onChange={(v) => set('overageRate', v as number)} suffix="฿/h" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Start date">
            <Input type="date" value={draft.startDate} onChange={(v) => set('startDate', v as string)} />
          </Field>
          <Field label="End date">
            <Input type="date" value={draft.endDate} onChange={(v) => set('endDate', v as string)} />
          </Field>
        </div>

        <Field label="Assign consultants" hint="Click to toggle.">
          <PeoplePicker people={consultants} selected={draft.consultants}
            onToggle={(id) => toggleId('consultants', id)} />
        </Field>
        <Field label="Assign customers" hint="Customers can view dashboard for this project.">
          <PeoplePicker people={customers} selected={draft.customers}
            onToggle={(id) => toggleId('customers', id)}
            sub={(p) => ('company' in p ? p.company : '')} />
        </Field>
        <Field label="Notes">
          <Textarea value={draft.notes} onChange={(v) => set('notes', v)} placeholder="Scope, billing details…" />
        </Field>
      </div>
    </Modal>
  );
}

// ── Project detail ────────────────────────────────────────────────────────────

function PeopleRow({
  label, people,
}: {
  label: string;
  people: (Consultant | Customer)[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
      <span style={{ color: 'var(--text-3)', width: 80 }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {people.length === 0 && <span style={{ color: 'var(--text-3)' }}>None assigned</span>}
        {people.map((p) => (
          <span key={p.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 8px 3px 3px', background: 'var(--surface-2)',
            borderRadius: 999,
          }}>
            <Avatar name={p.name} size={20} />
            <span style={{ color: 'var(--text-2)' }}>{p.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ProjectDetail({
  project, logs, setLogs, consultants, customers, onLog, onEdit,
}: {
  project: Project;
  logs: Log[];
  setLogs: React.Dispatch<React.SetStateAction<Log[]>>;
  consultants: Consultant[];
  customers: Customer[];
  onLog: () => void;
  onEdit: () => void;
}) {
  const u = projectUsage(project, logs);
  const projectLogs = logs.filter((l) => l.projectId === project.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const status = statusForUsage(u);
  const removeLog = (id: string) => setLogs((ls) => ls.filter((l) => l.id !== id));

  return (
    <Card>
      <CardHeader
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {project.name}
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </span>
        }
        subtitle={`${project.customer} · ${fmtDateLong(project.startDate)}${project.endDate ? ` – ${fmtDateLong(project.endDate)}` : ''} · ${fmtTHB(project.overageRate)}/h overage`}
        action={
          <div style={{ display: 'inline-flex', gap: 6 }}>
            <Button size="sm" variant="secondary" icon={<IconEdit size={13} />} onClick={onEdit}>Edit</Button>
            <Button size="sm" variant="primary" icon={<IconPlus size={13} />} onClick={onLog}>Log meeting</Button>
          </div>
        } />

      <div style={{ padding: '18px 18px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <SectionLabel>Hour usage this cycle</SectionLabel>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginBottom: 6,
            fontFamily: 'var(--font-mono)', fontSize: 13,
          }}>
            <span>
              <span style={{ color: u.overHours > 0 ? 'var(--danger)' : 'var(--text-1)', fontWeight: 600 }}>
                {fmtHrs(u.used)}h
              </span>
              <span style={{ color: 'var(--text-3)' }}> / {fmtHrs(project.includedHours)}h included</span>
            </span>
            <span style={{ color: 'var(--text-3)' }}>
              {u.overHours > 0
                ? <>{'+' + fmtHrs(u.overHours)}h over · <span style={{ color: 'var(--danger)' }}>{fmtTHB(u.overCost)}</span></>
                : <>{fmtHrs(u.remaining)}h remaining</>}
            </span>
          </div>
          <ProgressBar used={u.used} included={project.includedHours} height={10} />
        </div>
        <div>
          <SectionLabel>Team</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PeopleRow label="Consultants" people={project.consultants.map((id) => consultants.find((c) => c.id === id)).filter((c): c is Consultant => !!c)} />
            <PeopleRow label="Customers" people={project.customers.map((id) => customers.find((c) => c.id === id)).filter((c): c is Customer => !!c)} />
          </div>
        </div>
      </div>

      <div style={{ padding: 18, paddingTop: 8 }}>
        <SectionLabel>Meeting log ({projectLogs.length})</SectionLabel>
        {projectLogs.length === 0 ? (
          <EmptyHint>No meetings logged yet.</EmptyHint>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {projectLogs.map((l, i) => {
              const c = consultants.find((x) => x.id === l.consultantId);
              return (
                <div key={l.id} style={{
                  display: 'grid', gridTemplateColumns: '90px 1fr auto auto auto',
                  alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  fontSize: 13,
                }}>
                  <div style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmtDate(l.date)}</div>
                  <div>
                    <div style={{ color: 'var(--text-1)' }}>{l.topic || 'Meeting'}</div>
                    {c && <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 1 }}>{c.name}</div>}
                  </div>
                  <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{fmtHrs(l.hours)}h</span>
                  <StatusPill tone="muted">{l.billable ? 'Billable' : 'Non-billable'}</StatusPill>
                  <button onClick={() => removeLog(l.id)} title="Remove" style={{
                    background: 'transparent', border: 0, color: 'var(--text-3)',
                    cursor: 'pointer', padding: 4, borderRadius: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--danger)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                    <IconTrash size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── User management ───────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: Profile['role']; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'customer', label: 'Customer' },
];

function UserEditModal({
  open, profile, onClose, onSave,
}: {
  open: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSave: (updates: Partial<Omit<Profile, 'id'>>) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState<Partial<Omit<Profile, 'id'>>>({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open && profile) {
      setDraft({ name: profile.name, role: profile.role, job_title: profile.job_title, company: profile.company });
      setError('');
    }
  }, [open, profile]);

  if (!profile) return null;
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async () => {
    if (!draft.name?.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}
      title={`Edit user · ${profile.name}`}
      width={400}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Display name">
          <Input value={draft.name ?? ''} onChange={(v) => set('name', v as string)} placeholder="Full name" />
        </Field>
        <Field label="Role">
          <Select value={draft.role ?? 'customer'} onChange={(v) => set('role', v as Profile['role'])} options={ROLE_OPTIONS} />
        </Field>
        {draft.role === 'consultant' && (
          <Field label="Job title" hint="Shown as subtitle next to their name.">
            <Input value={draft.job_title ?? ''} onChange={(v) => set('job_title', v as string)} placeholder="e.g. Senior Consultant" />
          </Field>
        )}
        {draft.role === 'customer' && (
          <Field label="Company" hint="Shown on the customer dashboard.">
            <Input value={draft.company ?? ''} onChange={(v) => set('company', v as string)} placeholder="e.g. Acme Corp" />
          </Field>
        )}
        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 7,
            background: 'oklch(0.58 0.20 28 / 0.08)',
            border: '1px solid oklch(0.58 0.20 28 / 0.25)',
            fontSize: 12, color: 'var(--danger)',
          }}>{error}</div>
        )}
      </div>
    </Modal>
  );
}

function UserRow({
  profile, onEdit, onRoleChange,
}: {
  profile: Profile;
  onEdit: () => void;
  onRoleChange: (role: Profile['role']) => Promise<void>;
}) {
  const [saving, setSaving] = React.useState(false);

  const handleRoleChange = async (newRole: string) => {
    setSaving(true);
    try { await onRoleChange(newRole as Profile['role']); }
    finally { setSaving(false); }
  };

  const detail = profile.role === 'consultant' ? profile.job_title
    : profile.role === 'customer' ? profile.company
    : null;

  const roleBadgeColor = profile.role === 'admin' ? 'var(--accent)'
    : profile.role === 'consultant' ? 'oklch(0.58 0.14 250)'
    : 'var(--text-3)';

  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={profile.name} size={28} />
          <div>
            <div style={{ fontWeight: 500, color: 'var(--text-1)', fontSize: 13 }}>{profile.name}</div>
            {detail && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{detail}</div>}
          </div>
        </div>
      </Td>
      <Td>
        <select
          value={profile.role}
          disabled={saving}
          onChange={(e) => handleRoleChange(e.target.value)}
          style={{
            height: 28, padding: '0 24px 0 8px',
            background: 'var(--surface-0)',
            border: '1px solid var(--border)',
            borderRadius: 6, fontSize: 12,
            color: roleBadgeColor,
            fontFamily: 'inherit', cursor: 'pointer',
            opacity: saving ? 0.5 : 1,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 7px center',
          }}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Td>
      <Td align="right">
        <button
          onClick={onEdit}
          title="Edit user details"
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'transparent', border: 0,
            color: 'var(--text-3)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          <IconEdit size={13} />
        </button>
      </Td>
    </tr>
  );
}

function UserManagementCard({
  profiles, onUpdateProfile,
}: {
  profiles: Profile[];
  onUpdateProfile: (id: string, updates: Partial<Omit<Profile, 'id'>>) => Promise<void>;
}) {
  const [editingProfile, setEditingProfile] = React.useState<Profile | null>(null);

  return (
    <Card>
      <CardHeader
        title="Users"
        subtitle={`${profiles.length} user${profiles.length !== 1 ? 's' : ''} — change roles inline or click edit for full details.`} />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{
            background: 'var(--surface-0)', color: 'var(--text-3)',
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em',
          }}>
            <Th>User</Th>
            <Th>Role</Th>
            <Th width={48} />
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <UserRow
              key={p.id}
              profile={p}
              onEdit={() => setEditingProfile(p)}
              onRoleChange={(role) => onUpdateProfile(p.id, { role })} />
          ))}
        </tbody>
      </table>
      <UserEditModal
        open={editingProfile !== null}
        profile={editingProfile}
        onClose={() => setEditingProfile(null)}
        onSave={(updates) => onUpdateProfile(editingProfile!.id, updates)} />
    </Card>
  );
}

// ── AdminView ─────────────────────────────────────────────────────────────────

export default function AdminView({
  projects, setProjects, logs, setLogs,
  consultants, customers, profiles, onUpdateProfile,
  selectedProjectId, setSelectedProjectId,
}: {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  logs: Log[];
  setLogs: React.Dispatch<React.SetStateAction<Log[]>>;
  consultants: Consultant[];
  customers: Customer[];
  profiles: Profile[];
  onUpdateProfile: (id: string, updates: Partial<Omit<Profile, 'id'>>) => Promise<void>;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}) {
  const [editingProject, setEditingProject] = React.useState<Project | 'new' | null>(null);
  const [logFor, setLogFor] = React.useState<Project | null>(null);
  const [confirmDel, setConfirmDel] = React.useState<Project | null>(null);

  const onSaveProject = (proj: Project) => {
    if (proj.id) {
      setProjects((ps) => ps.map((p) => p.id === proj.id ? proj : p));
    } else {
      const id = 'p' + (Date.now() % 100000);
      setProjects((ps) => [...ps, { ...proj, id }]);
    }
    setEditingProject(null);
  };

  const onDelete = (id: string) => {
    setProjects((ps) => ps.filter((p) => p.id !== id));
    setLogs((ls) => ls.filter((l) => l.projectId !== id));
    setConfirmDel(null);
    if (selectedProjectId === id && projects.length > 1) {
      const next = projects.find((p) => p.id !== id);
      if (next) setSelectedProjectId(next.id);
    }
  };

  const onAddLog = (entry: Omit<Log, 'id'>) => {
    const id = 'l' + (Date.now() % 100000);
    setLogs((ls) => [{ ...entry, id }, ...ls]);
    setLogFor(null);
  };

  const totals = projects.reduce((acc, p) => {
    const u = projectUsage(p, logs);
    acc.used += u.used;
    acc.included += p.includedHours;
    acc.over += u.overCost;
    acc.overProjects += u.overHours > 0 ? 1 : 0;
    return acc;
  }, { used: 0, included: 0, over: 0, overProjects: 0 });

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
            Admin
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
            All projects
          </h1>
        </div>
        <Button variant="primary" icon={<IconPlus />} onClick={() => setEditingProject('new')}>
          New project
        </Button>
      </div>

      {/* Stat strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1, background: 'var(--border)', border: '1px solid var(--border)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <Stat label="Active projects" value={projects.length.toString()} />
        <Stat label="Hours used (all)" value={fmtHrs(totals.used)} suffix="h" />
        <Stat label="Hours included (all)" value={fmtHrs(totals.included)} suffix="h" />
        <Stat label="Overage this cycle"
          value={fmtTHB(totals.over)}
          tone={totals.over > 0 ? 'over' : 'default'}
          hint={totals.overProjects > 0 ? `${totals.overProjects} project${totals.overProjects > 1 ? 's' : ''} over budget` : 'All within budget'} />
      </div>

      {/* Projects table */}
      <Card>
        <CardHeader title="Projects" subtitle="Click a row to open details, or use actions on the right." />
        <ProjectsTable
          projects={projects} logs={logs} consultants={consultants}
          selectedId={selectedProjectId}
          onSelect={(id) => setSelectedProjectId(id)}
          onEdit={(p) => setEditingProject(p)}
          onLog={(p) => setLogFor(p)}
          onDelete={(p) => setConfirmDel(p)}
        />
      </Card>

      {/* Selected project detail */}
      {selectedProject && (
        <ProjectDetail
          project={selectedProject} logs={logs} setLogs={setLogs}
          consultants={consultants} customers={customers}
          onLog={() => setLogFor(selectedProject)}
          onEdit={() => setEditingProject(selectedProject)} />
      )}

      {/* User management */}
      <UserManagementCard profiles={profiles} onUpdateProfile={onUpdateProfile} />

      {/* Modals */}
      <ProjectFormModal
        open={editingProject !== null}
        project={editingProject === 'new' ? null : (editingProject as Project | null)}
        consultants={consultants} customers={customers}
        onClose={() => setEditingProject(null)}
        onSave={onSaveProject} />

      <LogMeetingModal
        open={logFor !== null}
        project={logFor}
        consultants={consultants}
        defaultConsultantId={logFor ? logFor.consultants[0] : null}
        title={logFor ? `Log meeting · ${logFor.name}` : ''}
        onClose={() => setLogFor(null)}
        onSave={onAddLog} />

      <Modal
        open={confirmDel !== null}
        onClose={() => setConfirmDel(null)}
        title="Delete project?"
        width={380}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDel(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => confirmDel && onDelete(confirmDel.id)}>Delete</Button>
          </>
        }>
        {confirmDel && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            This permanently removes <b style={{ color: 'var(--text-1)' }}>{confirmDel.name}</b> and all{' '}
            <b style={{ color: 'var(--text-1)' }}>{logs.filter((l) => l.projectId === confirmDel.id).length}</b>{' '}
            meeting logs associated with it. This can't be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}
