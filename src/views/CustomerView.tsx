import { Project, Consultant, Customer, Log, projectUsage, fmtTHB, fmtHrs, fmtDate, fmtDateLong } from '../data';
import { Avatar, ProgressBar, Select, StatusPill, statusForUsage, IconWarning } from '../components/ui';
import { Card, CardHeader, EmptyHint } from './AdminView';

function MiniStat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div style={{
      padding: '16px 20px', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label}
      </div>
      <div style={{
        fontSize: 18, fontWeight: 500, color: 'var(--text-1)',
        fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em',
      }}>
        {value}{suffix && <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 2 }}>{suffix}</span>}
      </div>
    </div>
  );
}

export default function CustomerView({
  projects, logs, customers, consultants, currentCustomerId,
  selectedProjectId, setSelectedProjectId,
}: {
  projects: Project[];
  logs: Log[];
  customers: Customer[];
  consultants: Consultant[];
  currentCustomerId: string;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}) {
  const me = customers.find((c) => c.id === currentCustomerId)!;
  const myProjects = projects.filter((p) => p.customers.includes(currentCustomerId));
  const proj = myProjects.find((p) => p.id === selectedProjectId) || myProjects[0];

  if (!proj) {
    return <EmptyHint>No projects assigned to your account.</EmptyHint>;
  }

  const u = projectUsage(proj, logs);
  const status = statusForUsage(u);
  const projectLogs = logs.filter((l) => l.projectId === proj.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
            {me.company}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
            Hi {me.name.split(' ')[0]} — here's where things stand.
          </h1>
        </div>
        {myProjects.length > 1 && (
          <Select value={proj.id} onChange={setSelectedProjectId}
            options={myProjects.map((p) => ({ value: p.id, label: p.name }))} />
        )}
      </div>

      {/* Hero card */}
      <Card>
        <div style={{ padding: '28px 28px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
                Project · started {fmtDateLong(proj.startDate)}
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                {proj.name}
              </div>
            </div>
            <StatusPill tone={status.tone}>
              {u.overHours > 0 && <IconWarning size={11} />}
              {status.label}
            </StatusPill>
          </div>

          {/* Big numbers */}
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontSize: 44, fontWeight: 500,
                color: u.overHours > 0 ? 'var(--danger)' : 'var(--text-1)',
                fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em',
              }}>{fmtHrs(u.used)}</span>
              <span style={{ fontSize: 16, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                / {fmtHrs(proj.includedHours)}h
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {u.overHours > 0 ? 'Extra charges accrued' : 'Remaining'}
              </div>
              <div style={{
                fontSize: 22, fontWeight: 500,
                color: u.overHours > 0 ? 'var(--danger)' : 'var(--text-1)',
                fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', marginTop: 2,
              }}>
                {u.overHours > 0 ? fmtTHB(u.overCost) : `${fmtHrs(u.remaining)}h`}
              </div>
            </div>
          </div>

          <ProgressBar used={u.used} included={proj.includedHours} height={14} />

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 8, fontSize: 11, color: 'var(--text-3)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span>0h</span>
            <span>{fmtHrs(proj.includedHours)}h included</span>
            {u.overHours > 0 && (
              <span style={{ color: 'var(--danger)' }}>+{fmtHrs(u.overHours)}h over</span>
            )}
          </div>

          {/* Overage banner */}
          {u.overHours > 0 && (
            <div style={{
              marginTop: 20, padding: '14px 16px',
              background: 'oklch(0.58 0.20 28 / 0.08)',
              border: '1px solid oklch(0.58 0.20 28 / 0.30)',
              borderRadius: 8,
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ color: 'var(--danger)', marginTop: 1 }}><IconWarning size={16} /></span>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                You've used{' '}
                <b style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{fmtHrs(u.overHours)}h</b>{' '}
                beyond your included{' '}
                <b style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{fmtHrs(proj.includedHours)}h</b>.{' '}
                At <b style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{fmtTHB(proj.overageRate)}/h</b>,{' '}
                this adds{' '}
                <b style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{fmtTHB(u.overCost)}</b>{' '}
                to your end-of-month invoice.
              </div>
            </div>
          )}
        </div>

        {/* Mini stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--border)' }}>
          <MiniStat label="Meetings this cycle" value={projectLogs.length.toString()} />
          <MiniStat label="Avg. meeting"
            value={projectLogs.length ? fmtHrs(u.used / projectLogs.length) : '—'}
            suffix={projectLogs.length ? 'h' : undefined} />
          <MiniStat label="Last meeting"
            value={projectLogs[0] ? fmtDate(projectLogs[0].date) : '—'} />
        </div>
      </Card>

      {/* Meeting history */}
      <Card>
        <CardHeader title="Meeting history" subtitle="Every consultation logged on this project." />
        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: '100px 1fr auto auto',
            gap: 12, padding: '10px 18px',
            background: 'var(--surface-0)',
            fontSize: 11, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '.06em',
            borderBottom: '1px solid var(--border)',
          }}>
            <div>Date</div>
            <div>Topic</div>
            <div>Consultant</div>
            <div style={{ textAlign: 'right' }}>Duration</div>
          </div>
          {projectLogs.length === 0 ? (
            <div style={{ padding: 24 }}><EmptyHint>No meetings logged yet.</EmptyHint></div>
          ) : projectLogs.map((l, i) => {
            const c = consultants.find((x) => x.id === l.consultantId);
            return (
              <div key={l.id} style={{
                display: 'grid', gridTemplateColumns: '100px 1fr auto auto',
                gap: 12, padding: '12px 18px', alignItems: 'center',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                fontSize: 13,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>{fmtDate(l.date)}</span>
                <span style={{ color: 'var(--text-1)' }}>{l.topic || 'Meeting'}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                  {c && <Avatar name={c.name} size={20} />}
                  {c?.name}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)', textAlign: 'right', minWidth: 50 }}>
                  {fmtHrs(l.hours)}h
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '8px 0 16px' }}>
        Questions about your hours? Contact your account admin.
      </div>
    </div>
  );
}
