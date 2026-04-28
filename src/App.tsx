import React from 'react';
import {
  Project, Consultant, Customer, Log,
  SEED_PROJECTS, SEED_CONSULTANTS, SEED_CUSTOMERS, SEED_LOGS,
  projectUsage,
} from './data';
import { Avatar } from './components/ui';
import { TweaksPanel, TweakSection, TweakRadio, TweakSelect, useTweaks } from './components/TweaksPanel';
import AdminView from './views/AdminView';
import ConsultantView from './views/ConsultantView';
import CustomerView from './views/CustomerView';

type Role = 'admin' | 'consultant' | 'customer';

// ── Top bar ───────────────────────────────────────────────────────────────────

function TopBar({
  role, setRole, consultants, customers, currentConsultantId, currentCustomerId,
}: {
  role: Role;
  setRole: (r: Role) => void;
  consultants: Consultant[];
  customers: Customer[];
  currentConsultantId: string;
  currentCustomerId: string;
}) {
  const me: { name: string; role: string } = role === 'admin'
    ? { name: 'Admin', role: 'Owner' }
    : role === 'consultant'
    ? (() => {
        const c = consultants.find((x) => x.id === currentConsultantId)!;
        return { name: c.name, role: c.role };
      })()
    : (() => {
        const u = customers.find((x) => x.id === currentCustomerId)!;
        return { name: u.name, role: u.company };
      })();

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '12px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#1a0f08',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.5" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Consultation Log</span>
            <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>
              v1.0
            </span>
          </div>
        </div>

        {/* Role switcher (segmented) */}
        <div style={{
          display: 'inline-flex', padding: 3,
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 8, position: 'relative',
        }}>
          {(['admin', 'consultant', 'customer'] as Role[]).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              style={{
                position: 'relative',
                padding: '6px 14px',
                background: role === r ? 'var(--surface-3)' : 'transparent',
                color: role === r ? 'var(--text-1)' : 'var(--text-3)',
                border: 0, borderRadius: 6,
                fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'background .12s, color .12s',
                textTransform: 'capitalize',
              }}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{me.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{me.role}</div>
          </div>
          <Avatar name={me.name} size={30} />
        </div>
      </div>
    </header>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [tweaks, setTweak] = useTweaks({ selectedProjectId: 'p1' });
  const [role, setRole] = React.useState<Role>('admin');
  const [projects, setProjects] = React.useState<Project[]>(SEED_PROJECTS);
  const [logs, setLogs] = React.useState<Log[]>(SEED_LOGS);
  const consultants: Consultant[] = SEED_CONSULTANTS;
  const customers: Customer[] = SEED_CUSTOMERS;

  const currentConsultantId = 'c1'; // Anna
  const currentCustomerId = (() => {
    const proj = projects.find((p) => p.id === tweaks.selectedProjectId);
    if (proj && proj.customers.length > 0) return proj.customers[0];
    return SEED_CUSTOMERS[0].id;
  })();

  // Keep selectedProjectId valid when projects change
  React.useEffect(() => {
    if (!projects.find((p) => p.id === tweaks.selectedProjectId) && projects.length > 0) {
      setTweak('selectedProjectId', projects[0].id);
    }
  }, [projects, tweaks.selectedProjectId, setTweak]);

  const setSelectedProjectId = (id: string) => setTweak('selectedProjectId', id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar role={role} setRole={setRole}
              consultants={consultants} customers={customers}
              currentConsultantId={currentConsultantId}
              currentCustomerId={currentCustomerId} />

      <main style={{
        maxWidth: 1240, width: '100%', margin: '0 auto',
        padding: '32px 32px 64px',
        flex: 1,
      }}>
        {role === 'admin' && (
          <AdminView
            projects={projects} setProjects={setProjects}
            logs={logs} setLogs={setLogs}
            consultants={consultants} customers={customers}
            selectedProjectId={tweaks.selectedProjectId}
            setSelectedProjectId={setSelectedProjectId} />
        )}
        {role === 'consultant' && (
          <ConsultantView
            projects={projects} logs={logs} setLogs={setLogs}
            consultants={consultants} customers={customers}
            currentConsultantId={currentConsultantId}
            selectedProjectId={tweaks.selectedProjectId}
            setSelectedProjectId={setSelectedProjectId} />
        )}
        {role === 'customer' && (
          <CustomerView
            projects={projects} logs={logs}
            consultants={consultants} customers={customers}
            currentCustomerId={currentCustomerId}
            selectedProjectId={tweaks.selectedProjectId}
            setSelectedProjectId={setSelectedProjectId} />
        )}
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="View as" />
        <TweakRadio label="Role" value={role}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'consultant', label: 'Consultant' },
            { value: 'customer', label: 'Customer' },
          ]}
          onChange={(v) => setRole(v as Role)} />
        <TweakSection label="Active project" />
        <TweakSelect label="Project" value={tweaks.selectedProjectId}
          options={projects.map((p) => {
            const u = projectUsage(p, logs);
            const tag = u.overHours > 0 ? ' (over)' : u.pct >= 80 ? ' (near limit)' : '';
            return { value: p.id, label: `${p.name}${tag}` };
          })}
          onChange={(v) => setTweak('selectedProjectId', v)} />
        <div style={{ fontSize: 10.5, color: 'rgba(41,38,27,.55)', padding: '4px 0 0', lineHeight: 1.4 }}>
          Try "Project Cinder" — it's already over budget so you can see overage states light up.
        </div>
      </TweaksPanel>
    </div>
  );
}
