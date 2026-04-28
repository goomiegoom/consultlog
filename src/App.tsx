import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { fetchProfile, fetchAppData, saveProject, deleteProject, addLog, removeLog, updateProfile } from './lib/db';
import type { Profile, AppData } from './lib/db';
import type { Project, Consultant, Customer, Log } from './data';
import { Avatar } from './components/ui';
import LoginPage from './components/LoginPage';
import SetPasswordPage from './components/SetPasswordPage';
import AdminView from './views/AdminView';
import ConsultantView from './views/ConsultantView';
import CustomerView from './views/CustomerView';

type Role = 'admin' | 'consultant' | 'customer';

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', flexDirection: 'column', gap: 16,
    }}>
      <img src="/logo.svg" alt="Conlog" style={{ width: 48, height: 48 }} />
      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Loading…</div>
    </div>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────

function TopBar({
  profile, previewRole, setPreviewRole, consultants, customers,
}: {
  profile: Profile;
  previewRole: Role | null;
  setPreviewRole: (r: Role | null) => void;
  consultants: Consultant[];
  customers: Customer[];
}) {
  const effectiveRole = previewRole ?? profile.role;

  const me: { name: string; subtitle: string } = effectiveRole === 'admin'
    ? { name: profile.name, subtitle: 'Admin' }
    : effectiveRole === 'consultant'
    ? (() => {
        const c = consultants.find((x) => x.id === profile.id);
        return { name: profile.name, subtitle: c?.role ?? 'Consultant' };
      })()
    : (() => {
        const u = customers.find((x) => x.id === profile.id);
        return { name: profile.name, subtitle: u?.company ?? profile.company };
      })();

  const handleSignOut = () => supabase.auth.signOut();

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
          <img src="/logo.svg" alt="Conlog" style={{ width: 28, height: 28 }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Consultation Log</span>
            <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>
              {profile.role}
            </span>
          </div>
        </div>

        {/* Role preview tabs — admin only */}
        {profile.role === 'admin' && (
          <div style={{
            display: 'inline-flex', padding: 3,
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 8,
          }}>
            {([null, 'consultant', 'customer'] as (Role | null)[]).map((r) => {
              const label = r === null ? 'Admin' : r.charAt(0).toUpperCase() + r.slice(1);
              const active = (previewRole ?? null) === r;
              return (
                <button key={String(r)} onClick={() => setPreviewRole(r)}
                  style={{
                    padding: '6px 14px',
                    background: active ? 'var(--surface-3)' : 'transparent',
                    color: active ? 'var(--text-1)' : 'var(--text-3)',
                    border: 0, borderRadius: 6, fontSize: 12, fontWeight: 500,
                    fontFamily: 'inherit', cursor: 'pointer',
                    transition: 'background .12s, color .12s',
                  }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* User + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{me.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{me.subtitle}</div>
          </div>
          <Avatar name={me.name} size={30} />
          <button onClick={handleSignOut} style={{
            height: 28, padding: '0 10px', borderRadius: 6,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-3)', fontSize: 11, fontFamily: 'inherit',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

type AppPhase =
  | { phase: 'loading' }
  | { phase: 'unauthenticated' }
  | { phase: 'ready'; profile: Profile; data: AppData };

export default function App() {
  const [state, setState] = React.useState<AppPhase>({ phase: 'loading' });
  const [previewRole, setPreviewRole] = React.useState<Role | null>(null);
  const [selectedProjectId, setSelectedProjectId] = React.useState('');
  // Detect invite / password-reset links (token is in the URL hash on first load)
  const [needsPassword, setNeedsPassword] = React.useState(
    () => window.location.hash.includes('type=invite') || window.location.hash.includes('type=recovery')
  );

  // ── Auth bootstrap ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadApp(session);
      else setState({ phase: 'unauthenticated' });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setState({ phase: 'unauthenticated' });
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadApp(session: Session) {
    setState({ phase: 'loading' });
    const [profile, data] = await Promise.all([
      fetchProfile(session.user.id),
      fetchAppData(),
    ]);
    if (!profile) { setState({ phase: 'unauthenticated' }); return; }
    // Default selected project to first one
    if (!selectedProjectId && data.projects.length > 0) {
      setSelectedProjectId(data.projects[0].id);
    }
    setState({ phase: 'ready', profile, data });
  }

  async function reload() {
    if (state.phase !== 'ready') return;
    const data = await fetchAppData();
    setState({ ...state, data });
  }

  // ── Early returns ───────────────────────────────────────────────────────────
  if (state.phase === 'loading') return <LoadingScreen />;
  if (needsPassword) return <SetPasswordPage onDone={() => { setNeedsPassword(false); supabase.auth.getSession().then(({ data: { session } }) => session && loadApp(session)); }} />;
  if (state.phase === 'unauthenticated') return <LoginPage onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => session && loadApp(session))} />;

  const { profile, data } = state;
  const { projects, logs, consultants, customers, profiles } = data;
  const effectiveRole: Role = previewRole ?? profile.role;

  // For previewing consultant/customer views, admin sees from first assigned user's perspective
  const currentConsultantId = profile.role === 'consultant' ? profile.id
    : consultants[0]?.id ?? '';
  const currentCustomerId = (() => {
    if (profile.role === 'customer') return profile.id;
    const proj = projects.find((p) => p.id === selectedProjectId);
    return proj?.customers[0] ?? customers[0]?.id ?? '';
  })();

  // Keep selected project valid
  const resolvedProjectId = projects.find((p) => p.id === selectedProjectId)
    ? selectedProjectId
    : projects[0]?.id ?? '';

  // ── Mutation wrappers (update Supabase then reload) ─────────────────────────
  // Patch AdminView's onSave/onDelete to also persist to Supabase
  const wrappedSetProjects: React.Dispatch<React.SetStateAction<Project[]>> = async (updater) => {
    const prev = projects;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    // Optimistic update so the UI responds immediately
    setState((s) => s.phase === 'ready' ? { ...s, data: { ...s.data, projects: next } } : s);
    const added = next.filter((p) => !prev.find((x) => x.id === p.id));
    const removed = prev.filter((p) => !next.find((x) => x.id === p.id));
    const updated = next.filter((p) => {
      const old = prev.find((x) => x.id === p.id);
      return old && JSON.stringify(old) !== JSON.stringify(p);
    });
    try {
      await Promise.all([
        ...added.map((p) => saveProject(p)),
        ...updated.map((p) => saveProject(p)),
        ...removed.map((p) => deleteProject(p.id)),
      ]);
    } catch (err) {
      console.error('saveProject error', err);
      alert(`Failed to save project:\n${(err as Error).message}`);
    }
    await reload();
  };

  const wrappedSetLogs: React.Dispatch<React.SetStateAction<Log[]>> = async (updater) => {
    const next = typeof updater === 'function' ? updater(logs) : updater;
    const added = next.filter((l) => !logs.find((x) => x.id === l.id));
    const removed = logs.filter((l) => !next.find((x) => x.id === l.id));
    try {
      await Promise.all([
        ...added.map((l) => addLog({ projectId: l.projectId, consultantId: l.consultantId, date: l.date, hours: l.hours, billable: l.billable, topic: l.topic })),
        ...removed.map((l) => removeLog(l.id)),
      ]);
    } catch (err) {
      console.error('saveLog error', err);
    }
    await reload();
  };

  const wrappedUpdateProfile = async (userId: string, updates: Partial<Omit<Profile, 'id'>>) => {
    await updateProfile(userId, updates);
    await reload();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        profile={profile} previewRole={previewRole} setPreviewRole={setPreviewRole}
        consultants={consultants} customers={customers} />

      <main style={{
        maxWidth: 1240, width: '100%', margin: '0 auto',
        padding: '32px 32px 64px', flex: 1,
      }}>
        {effectiveRole === 'admin' && (
          <AdminView
            projects={projects} setProjects={wrappedSetProjects}
            logs={logs} setLogs={wrappedSetLogs}
            consultants={consultants} customers={customers}
            profiles={profiles} onUpdateProfile={wrappedUpdateProfile}
            selectedProjectId={resolvedProjectId}
            setSelectedProjectId={setSelectedProjectId} />
        )}
        {effectiveRole === 'consultant' && (
          <ConsultantView
            projects={projects} logs={logs} setLogs={wrappedSetLogs}
            consultants={consultants} customers={customers}
            currentConsultantId={currentConsultantId}
            selectedProjectId={resolvedProjectId}
            setSelectedProjectId={setSelectedProjectId} />
        )}
        {effectiveRole === 'customer' && (
          <CustomerView
            projects={projects} logs={logs}
            consultants={consultants} customers={customers}
            currentCustomerId={currentCustomerId}
            selectedProjectId={resolvedProjectId}
            setSelectedProjectId={setSelectedProjectId} />
        )}
      </main>
    </div>
  );
}
