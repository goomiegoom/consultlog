import React from 'react';
import { Project, Consultant, Customer, Log, projectUsage, fmtTHB, fmtHrs, fmtDate } from '../data';
import { ProgressBar, Button, StatusPill, statusForUsage, useIsMobile, IconPlus } from '../components/ui';
import { Card, CardHeader, SectionLabel, EmptyHint, LogMeetingModal } from './AdminView';

export default function ConsultantView({
  projects, logs, setLogs, consultants, customers,
  currentConsultantId, selectedProjectId, setSelectedProjectId,
}: {
  projects: Project[];
  logs: Log[];
  setLogs: React.Dispatch<React.SetStateAction<Log[]>>;
  consultants: Consultant[];
  customers: Customer[];
  currentConsultantId: string;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}) {
  const mob = useIsMobile();
  const [logFor, setLogFor] = React.useState<Project | null>(null);
  const me = consultants.find((c) => c.id === currentConsultantId)!;
  const myProjects = projects.filter((p) => p.consultants.includes(currentConsultantId));

  const onAddLog = (entry: Omit<Log, 'id'>) => {
    const id = 'l' + (Date.now() % 100000);
    setLogs((ls) => [{ ...entry, id }, ...ls]);
    setLogFor(null);
  };

  const myLogs = logs
    .filter((l) => l.consultantId === currentConsultantId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  const myHoursThisCycle = myLogs.reduce((s, l) => s + l.hours, 0);

  // Suppress unused warning — customers prop is passed through but not directly used in this view
  void customers;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
            Consultant
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
            Welcome back, {me.name.split(' ')[0]}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
            {myProjects.length} active project{myProjects.length !== 1 ? 's' : ''} · {fmtHrs(myHoursThisCycle)}h logged this cycle
          </div>
        </div>
      </div>

      {/* My projects grid */}
      <div>
        <SectionLabel>My projects</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${mob ? '260px' : '320px'}, 1fr))`, gap: 12 }}>
          {myProjects.map((p) => {
            const u = projectUsage(p, logs);
            const status = statusForUsage(u);
            const isSel = p.id === selectedProjectId;
            return (
              <div key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                style={{
                  background: 'var(--surface-1)',
                  border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 10, padding: 16, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  transition: 'border-color .12s',
                }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{p.customer}</div>
                  </div>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: u.overHours > 0 ? 'var(--danger)' : 'var(--text-1)' }}>
                    {fmtHrs(u.used)}h <span style={{ color: 'var(--text-3)' }}>used</span>
                  </span>
                  <span style={{ color: 'var(--text-3)' }}>of {fmtHrs(p.includedHours)}h</span>
                </div>
                <ProgressBar used={u.used} included={p.includedHours} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {u.overHours > 0
                      ? <span style={{ color: 'var(--danger)' }}>+{fmtHrs(u.overHours)}h over · {fmtTHB(u.overCost)}</span>
                      : <>{fmtHrs(u.remaining)}h remaining</>}
                  </div>
                  <Button size="sm" variant="ghost" icon={<IconPlus size={13} />}
                    onClick={(e) => { e?.stopPropagation(); setLogFor(p); }}>
                    Log meeting
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected project + my recent logs */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 360px', gap: 16, alignItems: 'flex-start' }}>
        {(() => {
          const proj = myProjects.find((p) => p.id === selectedProjectId) || myProjects[0];
          if (!proj) return <div />;
          const projectLogs = logs.filter((l) => l.projectId === proj.id)
            .sort((a, b) => b.date.localeCompare(a.date));
          return (
            <Card>
              <CardHeader
                title={proj.name}
                subtitle={`${projectLogs.length} meetings logged · ${fmtTHB(proj.overageRate)}/h overage`}
                action={
                  <Button size="sm" variant="primary" icon={<IconPlus size={13} />} onClick={() => setLogFor(proj)}>
                    Log meeting
                  </Button>
                } />
              <div style={{ padding: 16 }}>
                {projectLogs.slice(0, 8).map((l, i) => {
                  const c = consultants.find((x) => x.id === l.consultantId);
                  const isMine = l.consultantId === currentConsultantId;
                  return (
                    <div key={l.id} style={{
                      display: 'grid',
                      gridTemplateColumns: mob ? '1fr auto' : '70px 1fr auto auto',
                      alignItems: 'center', gap: mob ? 8 : 12, padding: '8px 4px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                      fontSize: 13,
                    }}>
                      {mob ? (
                        <span style={{ color: 'var(--text-1)' }}>
                          {l.topic || 'Meeting'}
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                            {fmtDate(l.date)}{c ? ` · ${c.name}` : ''}
                            {isMine && <span style={{ color: 'var(--accent)' }}> · you</span>}
                          </span>
                        </span>
                      ) : (
                        <>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{fmtDate(l.date)}</span>
                          <span style={{ color: 'var(--text-1)' }}>
                            {l.topic || 'Meeting'}
                            {isMine && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent)' }}>· you</span>}
                          </span>
                          <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{c?.name}</span>
                        </>
                      )}
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{fmtHrs(l.hours)}h</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}

        <Card>
          <CardHeader title="My recent logs" subtitle={`Across all projects · ${fmtHrs(myHoursThisCycle)}h total`} />
          <div style={{ padding: 4 }}>
            {myLogs.length === 0 && <EmptyHint>No meetings logged yet.</EmptyHint>}
            {myLogs.map((l, i) => {
              const p = projects.find((x) => x.id === l.projectId);
              return (
                <div key={l.id} style={{
                  padding: '10px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-1)' }}>{p?.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{fmtHrs(l.hours)}h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
                    <span>{l.topic || 'Meeting'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDate(l.date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <LogMeetingModal
        open={logFor !== null}
        project={logFor}
        consultants={consultants}
        lockedConsultantId={currentConsultantId}
        onClose={() => setLogFor(null)}
        onSave={onAddLog} />
    </div>
  );
}

