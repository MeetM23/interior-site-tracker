import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const S = {
  card: { backgroundColor: 'var(--bg-white)', borderRadius: '12px', padding: '2rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' },
  label: { color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, margin: '0 0 0.4rem 0' },
  value: { margin: 0, fontSize: '1.05rem', fontWeight: 600 },
  input: { width: '100%', padding: '0.8rem 1rem', fontSize: '0.95rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'white', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.8rem 1rem', fontSize: '0.95rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'white', boxSizing: 'border-box' },
  btnPrimary: { padding: '0.8rem 1.6rem', backgroundColor: 'var(--text-dark)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' },
  btnDanger: { padding: '0.8rem 1.6rem', backgroundColor: '#fff0f0', color: '#ff3b30', border: '1px solid #ffcece', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' },
  sectionTitle: { fontSize: '1.3rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: 'var(--text-dark)' },
  tab: (active) => ({ padding: '0.7rem 1.4rem', border: 'none', borderBottom: active ? '2px solid var(--primary-orange)' : '2px solid transparent', background: 'none', fontWeight: active ? 700 : 500, color: active ? 'var(--primary-orange)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }),
};

const statusColors = { completed: '#34c759', in_progress: '#ff9500', delayed: '#ff3b30', pending: '#86868b', not_started: '#86868b', on_track: '#ff9500', on_hold: '#86868b', cancelled: '#ff3b30' };
const badge = (status) => ({ padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', backgroundColor: (statusColors[status] || '#86868b') + '20', color: statusColors[status] || '#86868b', display: 'inline-block', whiteSpace: 'nowrap' });

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();

  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Team (designers only for assignment)
  const [designers, setDesigners] = useState([]);

  // Task form
  const [taskForm, setTaskForm] = useState({ name: '', assignedTo: '', deadline: '', priority: 'Medium' });
  const [savingTask, setSavingTask] = useState(false);

  // Expense form
  const [expenseForm, setExpenseForm] = useState({ amount: '', method: 'Cash', notes: '', paymentDate: '' });
  const [savingExpense, setSavingExpense] = useState(false);

  // Gallery
  const [galleryFiles, setGalleryFiles] = useState(null);
  const [galleryCaption, setGalleryCaption] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Status quick change (owner)
  const [savingStatus, setSavingStatus] = useState(false);

  // Image modal
  const [activeImage, setActiveImage] = useState(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingProject(true);
      setError('');
      const r = await api.get(`/projects/${id}`);
      setProject(r.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load project');
      setProject(null);
    } finally {
      setLoadingProject(false);
      setFetchAttempted(true);
    }
  }, [id]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!id || !user || loading || !router.isReady) return;
    fetchProject();
    // Fetch designers only (not owner / super admin)
    if (user.role === 'OWNER') {
      api.get('/users').then(r => setDesigners(r.data?.data?.filter(u => u.role === 'DESIGNER') || [])).catch(() => {});
    }
  }, [id, loading, user, router.isReady]);

  // ── Handlers ──────────────────────────────────────────
  const handleAddTask = async (e) => {
    e.preventDefault();
    setSavingTask(true);
    try {
      await api.post('/tasks', { ...taskForm, projectId: id, type: 'task' });
      setTaskForm({ name: '', assignedTo: '', deadline: '', priority: 'Medium' });
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Task add failed');
    } finally { setSavingTask(false); }
  };

  const handleTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      await fetchProject(); // re-fetch means completionPercent and budgetSummary refresh too
    } catch (err) { setError(err.response?.data?.message || 'Task update failed'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      await fetchProject();
    } catch (err) { setError(err.response?.data?.message || 'Delete failed'); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSavingExpense(true);
    try {
      await api.post('/payments', { ...expenseForm, projectId: id, amount: Number(expenseForm.amount) });
      setExpenseForm({ amount: '', method: 'Cash', notes: '', paymentDate: '' });
      await fetchProject(); // refresh budget summary
    } catch (err) {
      setError(err.response?.data?.message || 'Expense add failed');
    } finally { setSavingExpense(false); }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (user?.role !== 'OWNER') return;
    setSavingStatus(true);
    try {
      await api.put(`/projects/${id}`, { status: newStatus });
      await fetchProject();
    } catch (err) { setError(err.response?.data?.message || 'Status update failed'); }
    finally { setSavingStatus(false); }
  };

  const handleUploadGallery = async (e) => {
    e.preventDefault();
    if (!galleryFiles) return;
    setUploadingGallery(true);
    try {
      const form = new FormData();
      Array.from(galleryFiles).forEach(f => form.append('photos', f));
      if (galleryCaption) form.append('caption', galleryCaption);
      await api.post(`/projects/${id}/gallery`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGalleryFiles(null);
      setGalleryCaption('');
      await fetchProject();
    } catch (err) { setError(err.response?.data?.message || 'Gallery upload failed'); }
    finally { setUploadingGallery(false); }
  };

  // ── Loading / Error states ──────────────────────────────
  if (loading || !user) return <p>Loading...</p>;
  if (loadingProject && !project) return (
    <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary-orange)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading project details...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!project && fetchAttempted) return (
    <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
      <p style={{ color: '#ff3b30', marginBottom: '1rem' }}>{error || 'Project not found'}</p>
      <button onClick={fetchProject} style={S.btnPrimary}>Retry</button>{' '}
      <button onClick={() => router.push('/projects')} style={{ ...S.btnPrimary, backgroundColor: 'transparent', color: 'var(--text-dark)', border: '1px solid var(--border-light)' }}>Back to Projects</button>
    </div>
  );
  if (!project) return null;

  const progress = project.completionPercent ?? 0;
  const budget = project.budgetSummary || { budget: project.budget || 0, totalSpent: 0, remaining: project.budget || 0 };
  const expenses = project.expenses || [];
  const tasks = project.tasks || [];
  const milestones = project.milestones || [];
  const isOwner = user?.role === 'OWNER';
  const isDesigner = user?.role === 'DESIGNER';

  const progressColor = progress === 100 ? '#34c759' : progress >= 50 ? '#ff9500' : '#0071e3';

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: 0, marginBottom: '0.5rem' }}>← Back to Projects</button>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.8rem' }}>{project.name}</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            {project.clientId?.name || 'Client'} · {project.location}
            {project.projectId && <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'var(--border-light)', borderRadius: '4px' }}>{project.projectId}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={badge(project.status)}>{project.status.split('_').join(' ')}</span>
          {isOwner && (
            <>
              <button onClick={() => router.push(`/projects/edit/${id}`)} style={S.btnPrimary}>Edit</button>
              <button style={S.btnDanger} onClick={async () => {
                if (window.confirm('Delete this project permanently?')) {
                  try { await api.delete(`/projects/${id}`); router.push('/projects'); }
                  catch (err) { setError(err.response?.data?.message || 'Delete failed'); }
                }
              }}>Delete</button>
            </>
          )}
        </div>
      </div>

      {error && <div style={{ backgroundColor: '#fff0f0', border:'1px solid #ffcece', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#ff3b30', fontWeight: 500 }}>{error}</div>}

      {/* ── PROGRESS SUMMARY STRIP ── */}
      <div style={{ ...S.card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', alignItems: 'center', padding: '1.5rem 2rem' }}>
        <div>
          <p style={S.label}>Completion</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, backgroundColor: progressColor, transition: 'width 0.4s ease', borderRadius: '4px' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: progressColor }}>{progress}%</span>
          </div>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tasks.filter(t => t.status === 'completed').length}/{tasks.length} tasks done</p>
        </div>
        <div>
          <p style={S.label}>Estimated Budget</p>
          <p style={{ ...S.value, color: '#1d1d1f' }}>₹{budget.budget.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p style={S.label}>Total Spent</p>
          <p style={{ ...S.value, color: '#ff3b30' }}>₹{budget.totalSpent.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p style={S.label}>Remaining</p>
          <p style={{ ...S.value, color: budget.remaining > 0 ? '#34c759' : '#ff3b30' }}>₹{budget.remaining.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p style={S.label}>Assigned To</p>
          <p style={S.value}>{project.assignedDesigner?.name || '—'}</p>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem' }}>
        {['overview', 'tasks', 'expenses', 'gallery', 'milestones'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={S.tab(activeTab === t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* ════════════════ TAB: OVERVIEW ════════════════ */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div style={S.card}>
              <p style={S.sectionTitle}>Project Details</p>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {[
                  ['Project Type', project.projectType],
                  ['Category', project.projectCategory],
                  ['Site Size', project.siteSize ? `${project.siteSize} sq ft` : '—'],
                  ['City', project.city || '—'],
                  ['State', project.state || '—'],
                  ['Start Date', project.startDate?.split('T')[0] || '—'],
                  ['End Date', project.endDate?.split('T')[0] || '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{l}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={S.card}>
                <p style={S.sectionTitle}>Client Info</p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div><p style={S.label}>Name</p><p style={S.value}>{project.clientId?.name || '—'}</p></div>
                  <div><p style={S.label}>Phone</p><p style={S.value}>{project.clientId?.phone || '—'}</p></div>
                  <div><p style={S.label}>Email</p><p style={S.value}>{project.clientId?.email || '—'}</p></div>
                </div>
              </div>
              {isOwner && (
                <div style={S.card}>
                  <p style={S.sectionTitle}>Update Project Status</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {['not_started','in_progress','on_hold','delayed','completed','cancelled'].map(s => (
                      <button key={s} disabled={project.status === s || savingStatus} onClick={() => handleUpdateStatus(s)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: `1px solid ${statusColors[s] || '#86868b'}`, backgroundColor: project.status === s ? (statusColors[s] || '#86868b') : 'white', color: project.status === s ? 'white' : (statusColors[s] || '#86868b'), fontWeight: 600, fontSize: '0.8rem', cursor: project.status === s ? 'default' : 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                        {s.split('_').join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {project.description && (
            <div style={S.card}>
              <p style={S.sectionTitle}>Description</p>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{project.description}</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ TAB: TASKS ════════════════ */}
      {activeTab === 'tasks' && (
        <div>
          {/* Task List */}
          {tasks.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {tasks.map(t => (
                <div key={t._id} style={{ ...S.card, padding: '1.5rem', marginBottom: 0, borderLeft: `4px solid ${statusColors[t.status] || '#86868b'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem' }}>{t.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {t.assignedTo ? `Assigned: ${t.assignedTo.name}` : 'Unassigned'}
                        {t.deadline && <> · Due: {new Date(t.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>}
                        {t.priority && <> · <span style={{ fontWeight: 600 }}>{t.priority}</span> priority</>}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={badge(t.status)}>{t.status.split('_').join(' ')}</span>
                      {isOwner && <button onClick={() => handleDeleteTask(t._id)} style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', border: '1px solid #ffcece', borderRadius: '4px', background: '#fff0f0', color: '#ff3b30', cursor: 'pointer' }}>Del</button>}
                    </div>
                  </div>
                  {/* Status toggle buttons (both roles) */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    {['pending', 'in_progress', 'completed', 'delayed'].map(s => (
                      <button key={s} disabled={t.status === s} onClick={() => handleTaskStatus(t._id, s)}
                        style={{ padding: '0.4rem 0.9rem', border: `1px solid ${s === t.status ? (statusColors[s] || '#86868b') : 'var(--border-light)'}`, borderRadius: '6px', backgroundColor: s === t.status ? (statusColors[s] || '#86868b') + '20' : 'transparent', color: s === t.status ? (statusColors[s] || '#86868b') : 'var(--text-muted)', fontWeight: 500, fontSize: '0.82rem', cursor: s === t.status ? 'default' : 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                        {s.split('_').join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tasks yet.</div>
          )}

          {/* Add Task Form — Owner only */}
          {isOwner && (
            <div style={S.card}>
              <p style={S.sectionTitle}>Assign New Task</p>
              <form onSubmit={handleAddTask}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={S.label}>Task Name *</p>
                    <input style={S.input} required value={taskForm.name} onChange={e => setTaskForm({...taskForm, name: e.target.value})} placeholder="e.g. Install false ceiling" />
                  </div>
                  <div>
                    <p style={S.label}>Assign to Designer</p>
                    <select style={S.select} value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                      <option value="">— Unassigned —</option>
                      {designers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={S.label}>Deadline</p>
                    <input type="date" style={S.input} value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
                  </div>
                  <div>
                    <p style={S.label}>Priority</p>
                    <select style={S.select} value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={savingTask} style={S.btnPrimary}>
                  {savingTask ? 'Adding...' : '+ Add Task'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ TAB: EXPENSES ════════════════ */}
      {activeTab === 'expenses' && (
        <div>
          {/* Budget Meter */}
          <div style={{ ...S.card, padding: '1.5rem 2rem' }}>
            <p style={S.sectionTitle}>Budget Overview</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={S.label}>Total Budget</p>
                <p style={{ ...S.value, fontSize: '1.5rem' }}>₹{budget.budget.toLocaleString('en-IN')}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={S.label}>Spent</p>
                <p style={{ ...S.value, fontSize: '1.5rem', color: '#ff3b30' }}>₹{budget.totalSpent.toLocaleString('en-IN')}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={S.label}>Remaining</p>
                <p style={{ ...S.value, fontSize: '1.5rem', color: budget.remaining > 0 ? '#34c759' : '#ff3b30' }}>₹{budget.remaining.toLocaleString('en-IN')}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={S.label}>Utilization</p>
                <p style={{ ...S.value, fontSize: '1.5rem', color: budget.budget > 0 ? progressColor : '#86868b' }}>{budget.budget > 0 ? Math.round((budget.totalSpent / budget.budget) * 100) : 0}%</p>
              </div>
            </div>
            {/* Budget bar */}
            {budget.budget > 0 && (
              <div style={{ height: '10px', backgroundColor: 'var(--border-light)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.round((budget.totalSpent / budget.budget) * 100))}%`, backgroundColor: budget.totalSpent > budget.budget ? '#ff3b30' : '#34c759', transition: 'width 0.4s ease', borderRadius: '5px' }} />
              </div>
            )}
          </div>

          {/* Add Expense Form */}
          <div style={S.card}>
            <p style={S.sectionTitle}>Log Expense</p>
            <form onSubmit={handleAddExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p style={S.label}>Amount (₹) *</p>
                  <input type="number" min="0" required style={S.input} value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <p style={S.label}>Payment Method</p>
                  <select style={S.select} value={expenseForm.method} onChange={e => setExpenseForm({...expenseForm, method: e.target.value})}>
                    {['Cash','Bank Transfer','UPI','Credit Card','Cheque','Other'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <p style={S.label}>Date</p>
                  <input type="date" style={S.input} value={expenseForm.paymentDate} onChange={e => setExpenseForm({...expenseForm, paymentDate: e.target.value})} />
                </div>
                <div>
                  <p style={S.label}>Notes / Description</p>
                  <input style={S.input} value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} placeholder="e.g. Raw material purchase" />
                </div>
              </div>
              <button type="submit" disabled={savingExpense} style={S.btnPrimary}>
                {savingExpense ? 'Logging...' : '+ Log Expense'}
              </button>
            </form>
          </div>

          {/* Expense History */}
          <div style={S.card}>
            <p style={S.sectionTitle}>Expense History</p>
            {expenses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No expenses logged yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Date', 'Amount', 'Method', 'Notes', 'Logged By'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp, i) => (
                      <tr key={exp._id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : '#fbfbfd' }}>
                        <td style={{ padding: '0.9rem 0.75rem', fontSize: '0.9rem' }}>{new Date(exp.paymentDate || exp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: '0.9rem 0.75rem', fontWeight: 700, color: '#ff3b30' }}>₹{Number(exp.amount).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.9rem 0.75rem', fontSize: '0.9rem' }}>{exp.method}</td>
                        <td style={{ padding: '0.9rem 0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{exp.notes || '—'}</td>
                        <td style={{ padding: '0.9rem 0.75rem', fontSize: '0.9rem' }}>{exp.recordedBy?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ TAB: GALLERY ════════════════ */}
      {activeTab === 'gallery' && (
        <div>
          {project.gallery && project.gallery.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {project.gallery.map(g => (
                <div key={g._id} onClick={() => setActiveImage(g.url)}
                  style={{ backgroundColor: 'var(--bg-white)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-light)', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                    <img src={g.url} alt="site" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {g.caption && <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{g.caption}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No photos in gallery yet.</div>
          )}
          <div style={S.card}>
            <p style={S.sectionTitle}>Upload Site Photos</p>
            <form onSubmit={handleUploadGallery} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px' }}>
                <p style={S.label}>Photos</p>
                <input type="file" multiple accept="image/*" required onChange={e => setGalleryFiles(e.target.files)} style={{ padding: '0.6rem', border: '1px dashed var(--border-light)', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: '2 1 250px' }}>
                <p style={S.label}>Caption</p>
                <input style={S.input} value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} placeholder="e.g., Site visit – Day 12" />
              </div>
              <button type="submit" disabled={uploadingGallery} style={S.btnPrimary}>{uploadingGallery ? 'Uploading...' : 'Upload'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: MILESTONES ════════════════ */}
      {activeTab === 'milestones' && (
        <div>
          {milestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No milestones set for this project.</div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {milestones.map((m, i) => (
                <div key={m._id} style={{ ...S.card, padding: '1.5rem', marginBottom: 0, borderLeft: `4px solid ${statusColors[m.status] || '#86868b'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>#{i + 1}</span>
                        {m.name}
                      </h3>
                      {m.deadline && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target: {new Date(m.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['pending','in_progress','completed'].map(s => (
                        <button key={s} disabled={m.status === s} onClick={() => handleTaskStatus(m._id, s)}
                          style={{ padding: '0.4rem 0.9rem', border: `1px solid ${s === m.status ? (statusColors[s] || '#86868b') : 'var(--border-light)'}`, borderRadius: '6px', backgroundColor: s === m.status ? (statusColors[s] || '#86868b') + '20' : 'white', color: s === m.status ? (statusColors[s] || '#86868b') : 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', cursor: s === m.status ? 'default' : 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                          {s.split('_').join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {activeImage && (
        <div onClick={() => setActiveImage(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img src={activeImage} alt="full" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px' }} />
            <button onClick={e => { e.stopPropagation(); setActiveImage(null); }} style={{ position: 'absolute', top: '-2.5rem', right: 0, width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'white', border: 'none', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
