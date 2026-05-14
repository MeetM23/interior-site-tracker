import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useToast } from '../../components/ToastProvider';

const styles = {
  // reusing standard minimal UI styles
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '2.5rem' },
  title: { fontSize: '2rem', fontWeight: 600, color: '#1d1d1f', margin: '0 0 0.5rem 0' },
  subtitle: { fontSize: '1.05rem', color: '#86868b', margin: 0 },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' },
  input: { width: '100%', padding: '0.85rem 1rem', fontSize: '0.95rem', border: '1px solid #d2d2d7', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#515154', marginBottom: '0.5rem' },
  btnPrimary: { padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 500, color: '#ffffff', backgroundColor: '#0071e3', border: 'none', borderRadius: '9px', cursor: 'pointer' },
  btnToggle: { padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, borderRadius: '6px', cursor: 'pointer', border: 'none' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' },
  th: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid #e5e5ea', color: '#86868b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' },
  td: { padding: '1rem', borderBottom: '1px solid #e5e5ea', color: '#1d1d1f', fontSize: '0.95rem' }
};

export default function CompaniesAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ companyName: '', ownerName: '', ownerEmail: '', ownerPassword: '', ownerPhone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPER_ADMIN')) router.replace('/login');
    if (user?.role === 'SUPER_ADMIN') fetchCompanies();
  }, [user, loading, router]);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/admin/companies');
      setCompanies(data.data);
    } catch (err) { }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/admin/onboard', form);
      addToast('success', 'Company & Owner Provisioned Successfully');
      setForm({ companyName: '', ownerName: '', ownerEmail: '', ownerPassword: '', ownerPhone: '' });
      fetchCompanies();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Provisioning failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    if (!window.confirm(`Are you sure you want to change this company to ${newStatus}?`)) return;
    try {
      await api.put(`/admin/companies/${id}`, { status: newStatus });
      addToast('success', `Company is now ${newStatus}`);
      fetchCompanies();
    } catch (err) {
      addToast('error', 'Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete this suspended company? This will revoke all its users' access.`)) return;
    try {
      await api.delete(`/admin/companies/${id}`);
      addToast('success', `Company has been deleted`);
      fetchCompanies();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to delete company');
    }
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
       <div style={styles.header}>
        <h1 style={styles.title}>Company Logistics</h1>
        <p style={styles.subtitle}>Provision new companies atomically. Suspend active accounts.</p>
      </div>

      <div style={styles.card}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>Create New Tenant</h2>
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div><label style={styles.label}>Company Name</label><input style={styles.input} required value={form.companyName} onChange={e => setForm({...form, companyName:e.target.value})} /></div>
          <div><label style={styles.label}>Owner Full Name</label><input style={styles.input} required value={form.ownerName} onChange={e => setForm({...form, ownerName:e.target.value})} /></div>
          <div><label style={styles.label}>Owner Email</label><input style={styles.input} type="email" required value={form.ownerEmail} onChange={e => setForm({...form, ownerEmail:e.target.value})} /></div>
          <div><label style={styles.label}>Owner Phone</label><input style={styles.input} value={form.ownerPhone} onChange={e => setForm({...form, ownerPhone:e.target.value})} /></div>
          <div><label style={styles.label}>Owner Initial Password</label><input style={styles.input} required value={form.ownerPassword} onChange={e => setForm({...form, ownerPassword:e.target.value})} /></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1rem' }}>
            <button type="submit" disabled={isSubmitting} style={{...styles.btnPrimary, width: '100%'}}>
               {isSubmitting ? 'Provisioning...' : 'Provision Tenant'}
            </button>
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Master Company Record</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Company Name</th>
                <th style={styles.th}>Configured Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c._id}>
                  <td style={styles.td}><strong>{c.name}</strong></td>
                  <td style={styles.td}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <span style={{ 
                      padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                      backgroundColor: c.status === 'Active' ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                      color: c.status === 'Active' ? '#34c759' : '#ff3b30'
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleStatus(c._id, c.status)}
                        style={{
                          ...styles.btnToggle,
                          backgroundColor: c.status === 'Active' ? '#fff0f0' : '#f0fdf4',
                          color: c.status === 'Active' ? '#ff3b30' : '#34c759'
                        }}>
                        {c.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      
                      {c.status === 'Suspended' && (
                        <button
                          onClick={() => handleDelete(c._id)}
                          style={{
                            ...styles.btnToggle,
                            backgroundColor: 'white',
                            border: '1px solid #ff3b30',
                            color: '#ff3b30'
                          }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && <tr><td colSpan="4" style={{...styles.td, textAlign: 'center', color: '#86868b'}}>No companies created.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
