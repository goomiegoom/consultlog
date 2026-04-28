// Admin view — projects list, create/edit modal, assign panel, log on behalf

function AdminView({
  projects, setProjects, logs, setLogs,
  consultants, customers, selectedProjectId, setSelectedProjectId,
}) {
  const [editingProject, setEditingProject] = React.useState(null); // project obj or "new"
  const [logFor, setLogFor] = React.useState(null); // project obj
  const [confirmDel, setConfirmDel] = React.useState(null);

  const onSaveProject = (proj) => {
    if (proj.id) {
      setProjects((ps) => ps.map((p) => p.id === proj.id ? proj : p));
    } else {
      const id = "p" + (Date.now() % 100000);
      setProjects((ps) => [...ps, { ...proj, id }]);
    }
    setEditingProject(null);
  };

  const onDelete = (id) => {
    setProjects((ps) => ps.filter((p) => p.id !== id));
    setLogs((ls) => ls.filter((l) => l.projectId !== id));
    setConfirmDel(null);
    if (selectedProjectId === id && projects.length > 1) {
      const next = projects.find((p) => p.id !== id);
      if (next) setSelectedProjectId(next.id);
    }
  };

  const onAddLog = (entry) => {
    const id = "l" + (Date.now() % 100000);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>
            Admin
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
            All projects
          </h1>
        </div>
        <Button variant="primary" icon={<IconPlus />} onClick={() => setEditingProject("new")}>
          New project
        </Button>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <Stat label="Active projects" value={projects.length.toString()} />
        <Stat label="Hours used (all)" value={fmtHrs(totals.used)} suffix="h" />
        <Stat label="Hours included (all)" value={fmtHrs(totals.included)} suffix="h" />
        <Stat label="Overage this cycle"
          value={fmtTHB(totals.over)}
          tone={totals.over > 0 ? "over" : "default"}
          hint={totals.overProjects > 0 ? `${totals.overProjects} project${totals.overProjects > 1 ? "s" : ""} over budget` : "All within budget"} />
      </div>

      {/* Projects table */}
      <Card>
        <CardHeader title="Projects" subtitle="Click a row to open details, or use actions on the right." />
        <ProjectsTable
          projects={projects} logs={logs} consultants={consultants} customers={customers}
          selectedId={selectedProjectId}
          onSelect={(id) => setSelectedProjectId(id)}
          onEdit={(p) => setEditingProject(p)}
          onLog={(p) => setLogFor(p)}
          onDelete={(p) => setConfirmDel(p)}
        />
      </Card>

      {/* Selected project detail */}
      {(() => {
        const proj = projects.find((p) => p.id === selectedProjectId);
        if (!proj) return null;
        return (
          <ProjectDetail project={proj} logs={logs} setLogs={setLogs}
            consultants={consultants} customers={customers}
            onLog={() => setLogFor(proj)}
            onEdit={() => setEditingProject(proj)} />
        );
      })()}

      {/* Modals */}
      <ProjectFormModal
        open={editingProject !== null}
        project={editingProject === "new" ? null : editingProject}
        consultants={consultants} customers={customers}
        onClose={() => setEditingProject(null)}
        onSave={onSaveProject} />

      <LogMeetingModal
        open={logFor !== null}
        project={logFor}
        consultants={consultants}
        defaultConsultantId={logFor ? logFor.consultants[0] : null}
        title={logFor ? `Log meeting · ${logFor.name}` : ""}
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
            <Button variant="primary" onClick={() => onDelete(confirmDel.id)}>Delete</Button>
          </>
        }>
        {confirmDel && (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
            This permanently removes <b style={{ color: "var(--text-1)" }}>{confirmDel.name}</b> and all <b style={{ color: "var(--text-1)" }}>{logs.filter((l) => l.projectId === confirmDel.id).length}</b> meeting logs associated with it. This can't be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────────
function Stat({ label, value, suffix, hint, tone }) {
  return (
    <div style={{
      background: "var(--surface-1)", padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 500,
        color: tone === "over" ? "var(--danger)" : "var(--text-1)",
        fontFamily: "var(--font-mono)", letterSpacing: "-0.02em",
      }}>
        {value}{suffix && <span style={{ fontSize: 13, color: "var(--text-3)", marginLeft: 2, fontWeight: 400 }}>{suffix}</span>}
      </div>
      {hint && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{hint}</div>}
    </div>
  );
}

// ── Card / CardHeader ──────────────────────────────────────────────────────
function Card({ children }) {
  return (
    <div style={{
      background: "var(--surface-1)",
      border: "1px solid var(--border)",
      borderRadius: 10, overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "14px 18px", borderBottom: "1px solid var(--border)", gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Projects table ─────────────────────────────────────────────────────────
function ProjectsTable({ projects, logs, consultants, customers, selectedId, onSelect, onEdit, onLog, onDelete }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ background: "var(--surface-0)", color: "var(--text-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>
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
            .filter(Boolean);
          const isSel = p.id === selectedId;
          return (
            <tr key={p.id} onClick={() => onSelect(p.id)}
              style={{
                borderTop: "1px solid var(--border)",
                background: isSel ? "var(--surface-2)" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--surface-0)"; }}
              onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
              <Td>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 500, color: "var(--text-1)" }}>{p.name}</span>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </div>
              </Td>
              <Td>
                <div style={{ color: "var(--text-2)" }}>{p.customer}</div>
                <div style={{ color: "var(--text-3)", fontSize: 11 }}>{p.customerContact}</div>
              </Td>
              <Td>
                <div style={{ display: "flex", marginLeft: 4 }}>
                  {consultantList.slice(0, 3).map((c, i) => (
                    <span key={c.id} title={c.name} style={{
                      marginLeft: -4, border: "2px solid var(--surface-1)", borderRadius: "50%",
                    }}>
                      <Avatar name={c.name} size={24} />
                    </span>
                  ))}
                  {consultantList.length > 3 && (
                    <span style={{ marginLeft: 6, alignSelf: "center", color: "var(--text-3)", fontSize: 11 }}>
                      +{consultantList.length - 3}
                    </span>
                  )}
                </div>
              </Td>
              <Td align="right">
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)" }}>
                  {fmtHrs(u.used)}
                </span>
                <span style={{ color: "var(--text-3)" }}> / {fmtHrs(p.includedHours)}h</span>
              </Td>
              <Td>
                <ProgressBar used={u.used} included={p.includedHours} />
              </Td>
              <Td align="right">
                {u.overHours > 0 ? (
                  <span style={{ color: "var(--danger)", fontFamily: "var(--font-mono)" }}>
                    {fmtTHB(u.overCost)}
                  </span>
                ) : (
                  <span style={{ color: "var(--text-3)" }}>—</span>
                )}
              </Td>
              <Td align="right">
                <div style={{ display: "inline-flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
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

const Th = ({ children, align = "left", width }) => (
  <th style={{
    textAlign: align, fontWeight: 500, padding: "10px 14px",
    width, whiteSpace: "nowrap",
  }}>{children}</th>
);
const Td = ({ children, align = "left" }) => (
  <td style={{ textAlign: align, padding: "12px 14px", verticalAlign: "middle" }}>{children}</td>
);

function RowMenu({ onEdit, onDelete }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: 28, height: 28, borderRadius: 6, background: "transparent",
        border: 0, color: "var(--text-3)", cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-3)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="3" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="13" cy="8" r="1.3" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: 4,
          background: "var(--surface-1)", border: "1px solid var(--border)",
          borderRadius: 8, padding: 4, minWidth: 140, zIndex: 50,
          boxShadow: "0 8px 24px rgba(0,0,0,.4)",
        }}>
          <MenuItem icon={<IconEdit size={13} />} onClick={() => { onEdit(); setOpen(false); }}>Edit project</MenuItem>
          <MenuItem icon={<IconTrash size={13} />} danger onClick={() => { onDelete(); setOpen(false); }}>Delete</MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, icon, onClick, danger }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "6px 10px", border: 0, borderRadius: 5, cursor: "pointer",
        background: hov ? "var(--surface-2)" : "transparent",
        color: danger ? "var(--danger)" : "var(--text-2)",
        fontSize: 12, fontFamily: "inherit", textAlign: "left",
      }}>{icon}{children}</button>
  );
}

// ── Project detail ─────────────────────────────────────────────────────────
function ProjectDetail({ project, logs, setLogs, consultants, customers, onLog, onEdit }) {
  const u = projectUsage(project, logs);
  const projectLogs = logs.filter((l) => l.projectId === project.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const status = statusForUsage(u);

  const removeLog = (id) => setLogs((ls) => ls.filter((l) => l.id !== id));

  return (
    <Card>
      <CardHeader
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {project.name}
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </span>
        }
        subtitle={`${project.customer} · started ${fmtDateLong(project.startDate)} · ${fmtTHB(project.overageRate)}/h overage`}
        action={
          <div style={{ display: "inline-flex", gap: 6 }}>
            <Button size="sm" variant="secondary" icon={<IconEdit size={13} />} onClick={onEdit}>Edit</Button>
            <Button size="sm" variant="primary" icon={<IconPlus size={13} />} onClick={onLog}>Log meeting</Button>
          </div>
        } />

      <div style={{ padding: "18px 18px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionLabel>Hour usage this cycle</SectionLabel>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "var(--font-mono)", fontSize: 13 }}>
            <span>
              <span style={{ color: u.overHours > 0 ? "var(--danger)" : "var(--text-1)", fontWeight: 600 }}>
                {fmtHrs(u.used)}h
              </span>
              <span style={{ color: "var(--text-3)" }}> / {fmtHrs(project.includedHours)}h included</span>
            </span>
            <span style={{ color: "var(--text-3)" }}>
              {u.overHours > 0
                ? <>+{fmtHrs(u.overHours)}h over · <span style={{ color: "var(--danger)" }}>{fmtTHB(u.overCost)}</span></>
                : <>{fmtHrs(u.remaining)}h remaining</>}
            </span>
          </div>
          <ProgressBar used={u.used} included={project.includedHours} height={10} />
        </div>
        <div>
          <SectionLabel>Team</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <PeopleRow label="Consultants" people={project.consultants.map((id) => consultants.find((c) => c.id === id)).filter(Boolean)} />
            <PeopleRow label="Customers" people={project.customers.map((id) => customers.find((c) => c.id === id)).filter(Boolean)} />
          </div>
        </div>
      </div>

      <div style={{ padding: 18, paddingTop: 8 }}>
        <SectionLabel>Meeting log ({projectLogs.length})</SectionLabel>
        {projectLogs.length === 0 ? (
          <EmptyHint>No meetings logged yet.</EmptyHint>
        ) : (
          <div style={{
            border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden",
          }}>
            {projectLogs.map((l, i) => {
              const c = consultants.find((x) => x.id === l.consultantId);
              return (
                <div key={l.id} style={{
                  display: "grid", gridTemplateColumns: "90px 1fr auto auto auto",
                  alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  fontSize: 13,
                }}>
                  <div style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(l.date)}</div>
                  <div>
                    <div style={{ color: "var(--text-1)" }}>{l.topic || "Meeting"}</div>
                    {c && <div style={{ color: "var(--text-3)", fontSize: 11, marginTop: 1 }}>{c.name}</div>}
                  </div>
                  <span style={{ color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>{fmtHrs(l.hours)}h</span>
                  {l.billable
                    ? <StatusPill tone="muted">Billable</StatusPill>
                    : <StatusPill tone="muted">Non-billable</StatusPill>}
                  <button onClick={() => removeLog(l.id)} title="Remove" style={{
                    background: "transparent", border: 0, color: "var(--text-3)",
                    cursor: "pointer", padding: 4, borderRadius: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--danger)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}>
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

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 500 }}>
      {children}
    </div>
  );
}

function PeopleRow({ label, people }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
      <span style={{ color: "var(--text-3)", width: 80 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {people.length === 0 && <span style={{ color: "var(--text-3)" }}>None assigned</span>}
        {people.map((p) => (
          <span key={p.id} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 8px 3px 3px", background: "var(--surface-2)",
            borderRadius: 999,
          }}>
            <Avatar name={p.name} size={20} />
            <span style={{ color: "var(--text-2)" }}>{p.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyHint({ children }) {
  return (
    <div style={{
      padding: "24px 16px", textAlign: "center", color: "var(--text-3)",
      fontSize: 12, border: "1px dashed var(--border)", borderRadius: 8,
    }}>{children}</div>
  );
}

// ── Project form modal ────────────────────────────────────────────────────
function ProjectFormModal({ open, project, consultants, customers, onClose, onSave }) {
  const [draft, setDraft] = React.useState(null);

  React.useEffect(() => {
    if (!open) return;
    setDraft(project ? { ...project } : {
      name: "", customer: "", customerContact: "",
      includedHours: 10, overageRate: 2500,
      consultants: [], customers: [],
      startDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  }, [open, project]);

  if (!draft) return null;

  const set = (k, v) => setDraft({ ...draft, [k]: v });
  const toggleId = (key, id) => {
    const arr = draft[key];
    set(key, arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };
  const valid = draft.name.trim() && draft.customer.trim() && draft.includedHours > 0 && draft.overageRate >= 0;

  return (
    <Modal open={open} onClose={onClose}
      title={project ? `Edit project · ${project.name}` : "New project"}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(draft)}>
            {project ? "Save changes" : "Create project"}
          </Button>
        </>
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Project name">
          <Input value={draft.name} onChange={(v) => set("name", v)} placeholder="e.g. Project Delphi" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Customer / company">
            <Input value={draft.customer} onChange={(v) => set("customer", v)} placeholder="Acme Corp" />
          </Field>
          <Field label="Primary contact">
            <Input value={draft.customerContact} onChange={(v) => set("customerContact", v)} placeholder="email@acme.com" />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="Included hours">
            <Input type="number" value={draft.includedHours} onChange={(v) => set("includedHours", v)} suffix="h" />
          </Field>
          <Field label="Overage rate">
            <Input type="number" value={draft.overageRate} onChange={(v) => set("overageRate", v)} suffix="฿/h" />
          </Field>
          <Field label="Start date">
            <Input type="date" value={draft.startDate} onChange={(v) => set("startDate", v)} />
          </Field>
        </div>

        <Field label="Assign consultants" hint="Click to toggle.">
          <PeoplePicker people={consultants} selected={draft.consultants}
            onToggle={(id) => toggleId("consultants", id)} />
        </Field>
        <Field label="Assign customers" hint="Customers can view dashboard for this project.">
          <PeoplePicker people={customers} selected={draft.customers}
            onToggle={(id) => toggleId("customers", id)}
            sub={(p) => p.company} />
        </Field>
        <Field label="Notes">
          <Textarea value={draft.notes} onChange={(v) => set("notes", v)}
            placeholder="Scope, billing details…" />
        </Field>
      </div>
    </Modal>
  );
}

function PeoplePicker({ people, selected, onToggle, sub }) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 6,
      padding: 6, background: "var(--surface-0)",
      border: "1px solid var(--border)", borderRadius: 8,
    }}>
      {people.map((p) => {
        const isSel = selected.includes(p.id);
        return (
          <button key={p.id} type="button" onClick={() => onToggle(p.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px 4px 4px", borderRadius: 999,
              background: isSel ? "var(--accent-soft)" : "var(--surface-2)",
              border: `1px solid ${isSel ? "var(--accent)" : "transparent"}`,
              color: isSel ? "var(--accent)" : "var(--text-2)",
              cursor: "pointer", fontSize: 12, fontFamily: "inherit",
            }}>
            <Avatar name={p.name} size={20} />
            <span>{p.name}</span>
            {sub && <span style={{ color: "var(--text-3)", fontSize: 11 }}>· {sub(p)}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Log meeting modal (used by both admin & consultant) ───────────────────
function LogMeetingModal({ open, project, consultants, defaultConsultantId, onClose, onSave, title, lockedConsultantId }) {
  const [draft, setDraft] = React.useState(null);

  React.useEffect(() => {
    if (!open || !project) return;
    setDraft({
      projectId: project.id,
      date: new Date().toISOString().slice(0, 10),
      hours: 1.0,
      consultantId: lockedConsultantId || defaultConsultantId || project.consultants[0],
      billable: true,
      topic: "",
    });
  }, [open, project, defaultConsultantId, lockedConsultantId]);

  if (!draft || !project) return null;
  const set = (k, v) => setDraft({ ...draft, [k]: v });
  const valid = draft.hours > 0 && draft.date && draft.consultantId;

  const u = projectUsage(project, []); // for context only — show included
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
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Date">
            <Input type="date" value={draft.date} onChange={(v) => set("date", v)} />
          </Field>
          <Field label="Duration">
            <Input type="number" value={draft.hours} onChange={(v) => set("hours", v)} suffix="hours" />
          </Field>
        </div>
        <Field label="Consultant">
          {lockedConsultantId ? (
            (() => {
              const c = consultants.find((x) => x.id === lockedConsultantId);
              return (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", background: "var(--surface-0)",
                  border: "1px solid var(--border)", borderRadius: 7,
                }}>
                  <Avatar name={c.name} size={22} />
                  <span style={{ color: "var(--text-1)", fontSize: 13 }}>{c.name}</span>
                  <span style={{ color: "var(--text-3)", fontSize: 11 }}>· you</span>
                </div>
              );
            })()
          ) : (
            <Select value={draft.consultantId} onChange={(v) => set("consultantId", v)}
              options={teamConsultants.map((c) => ({ value: c.id, label: c.name }))} />
          )}
        </Field>
        <Field label="Topic" hint="Short note — visible to admin & consultant only.">
          <Input value={draft.topic} onChange={(v) => set("topic", v)} placeholder="e.g. Architecture review" />
        </Field>
        <Toggle value={draft.billable} onChange={(v) => set("billable", v)}
          label="Billable (count toward project hours)" />
      </div>
    </Modal>
  );
}

Object.assign(window, { AdminView, LogMeetingModal, Card, CardHeader, Stat });
