import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const FormField = ({ label, field, type="text", form, setForm }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
      {label}
    </label>
    <input
      type={type}
      value={form[field]}
      onChange={e => setForm({...form, [field]: type==='number' ? Number(e.target.value) : e.target.value})}
      required
      style={{ width: '100%', padding: '0.9rem 1.1rem', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '0.95rem', backgroundColor: 'var(--bg-white)', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
    />
  </div>
);

export default function NewProjectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name:'', clientName:'', location:'', startDate:'', endDate:'', assignedDesigner:'', budget:0, status:'on_track', completionPercent:0 });
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.get('/users').then(r => setUsers(r.data?.data || [])).catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/projects', form);
      router.push('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <p>Loading...</p>;



  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>New Project</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>Create a new interior site project workspace.</p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-white)', borderRadius: '8px', padding: '2.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 1.5rem' }}>
            <FormField label="Project Name" field="name" form={form} setForm={setForm} />
            <FormField label="Client Name" field="clientName" form={form} setForm={setForm} />
            <FormField label="Location" field="location" form={form} setForm={setForm} />
            <FormField label="Budget ($)" field="budget" type="number" form={form} setForm={setForm} />
            <FormField label="Start Date" field="startDate" type="date" form={form} setForm={setForm} />
            <FormField label="End Date" field="endDate" type="date" form={form} setForm={setForm} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>Assigned Designer</label>
              <select value={form.assignedDesigner} onChange={e=>setForm({...form,assignedDesigner:e.target.value})} style={{ width: '100%', padding: '0.9rem 1.1rem', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '0.95rem', backgroundColor: 'var(--bg-white)', boxSizing: 'border-box', transition: 'all 0.2s ease' }}>
                <option value="">-- Unassigned --</option>
                {users.map(u=> <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{ width: '100%', padding: '0.9rem 1.1rem', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '0.95rem', backgroundColor: 'var(--bg-white)', boxSizing: 'border-box', transition: 'all 0.2s ease' }}>
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="delayed">Delayed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <FormField label="Completion Percent" field="completionPercent" type="number" form={form} setForm={setForm} />

          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FFEBEB', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', color: 'var(--danger-red)', fontSize: '0.9rem', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => router.push('/projects')}
              style={{ padding: '0.9rem 1.8rem', backgroundColor: 'transparent', color: 'var(--text-dark)', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-beige)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '0.9rem 1.8rem', backgroundColor: 'var(--text-dark)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', opacity: isSubmitting ? 0.7 : 1 }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--primary-orange)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--text-dark)'; }}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
