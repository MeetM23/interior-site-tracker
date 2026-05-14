import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useToast } from '../../components/ToastProvider';

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '2.5rem' },
  title: { fontSize: '2rem', fontWeight: 600, color: '#1d1d1f', margin: '0 0 0.5rem 0' },
  subtitle: { fontSize: '1.05rem', color: '#86868b', margin: 0 },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' },
  btnToggle: { padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 500, borderRadius: '6px', cursor: 'pointer', border: 'none' },
  btnEdit: { padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 500, borderRadius: '6px', cursor: 'pointer', border: '1px solid #d2d2d7', backgroundColor: '#f5f5f7' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' },
  th: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid #e5e5ea', color: '#86868b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' },
  td: { padding: '1rem', borderBottom: '1px solid #e5e5ea', color: '#1d1d1f', fontSize: '0.95rem' }
};

export default function OwnersAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const [owners, setOwners] = useState([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPER_ADMIN')) router.replace('/login');
    if (user?.role === 'SUPER_ADMIN') fetchOwners();
  }, [user, loading, router]);

  const fetchOwners = async () => {
    try {
      const { data } = await api.get('/admin/owners');
      setOwners(data.data);
    } catch (err) { }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/owners/${id}`, { isActive: !currentStatus });
      addToast('success', `Owner is now ${!currentStatus ? 'Active' : 'Deactivated'}`);
      fetchOwners();
    } catch (err) {
      addToast('error', 'Failed to toggle status');
    }
  };

  const resetPassword = async (id) => {
    const newPass = prompt("Enter the new password for this owner:");
    if (!newPass) return;
    try {
      await api.put(`/admin/owners/${id}`, { password: newPass });
      addToast('success', `Password has been forcefully reset`);
    } catch (err) {
      addToast('error', 'Failed to reset password');
    }
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
       <div style={styles.header}>
        <h1 style={styles.title}>Tenant Owners</h1>
        <p style={styles.subtitle}>Direct control over the root accounts of configured companies.</p>
      </div>

      <div style={styles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Owner Info</th>
                <th style={styles.th}>Company (Linked)</th>
                <th style={styles.th}>Access State</th>
                <th style={styles.th}>SysActions</th>
              </tr>
            </thead>
            <tbody>
              {owners.map(o => (
                <tr key={o._id}>
                  <td style={styles.td}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{o.name}</p>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#86868b' }}>{o.email}</p>
                    {o.phone && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#86868b' }}>{o.phone}</p>}
                  </td>
                  <td style={styles.td}>
                    {o.companyId ? o.companyId.name : <em style={{color:'#ff3b30'}}>Orphaned</em>}
                  </td>
                  <td style={styles.td}>
                    <span style={{ 
                      padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: o.isActive ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                      color: o.isActive ? '#34c759' : '#ff3b30'
                    }}>
                      {o.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => toggleStatus(o._id, o.isActive)}
                          style={{
                            ...styles.btnToggle,
                            backgroundColor: o.isActive ? '#fff0f0' : '#f0fdf4',
                            color: o.isActive ? '#ff3b30' : '#34c759'
                          }}>
                          {o.isActive ? 'Cut Access' : 'Restore'}
                        </button>

                        <button onClick={() => resetPassword(o._id)} style={styles.btnEdit}>
                           Reset Pass
                        </button>
                      </div>
                  </td>
                </tr>
              ))}
              {owners.length === 0 && <tr><td colSpan="4" style={{...styles.td, textAlign: 'center', color: '#86868b'}}>No owners created.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
