import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [dataList, setDataList] = useState([]);
  const [error, setError] = useState('');
  
  // Forms
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'DESIGNER', companyId: '' });
  const [companiesForDropdown, setCompaniesForDropdown] = useState([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        fetchData();
      }
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      if (user.role === 'SUPER_ADMIN') {
        // Fetch companies
        const res = await api.get('/companies');
        setDataList(res.data.data || []);
      } else {
        // Fetch designers
        const res = await api.get('/users');
        setDataList(res.data.data || []);
      }
    } catch (e) {
      setError('Failed to load team data.');
    }
  };

  const loadCompaniesForDropdown = async () => {
    try {
       const res = await api.get('/companies');
       setCompaniesForDropdown(res.data.data || []);
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (user.role === 'SUPER_ADMIN' && formData.role === 'COMPANY') {
         await api.post('/companies', { name: formData.name });
      } else {
         await api.post('/users', formData);
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred');
    }
  };

  if (loading || !user) return <p>Loading secure data...</p>;

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>{user.role === 'SUPER_ADMIN' ? 'Companies & Owners' : 'Team Management'}</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
            {user.role === 'SUPER_ADMIN' ? 'Manage your isolated workspaces.' : 'Manage designers in your company.'}
          </p>
        </div>
        {(user.role === 'SUPER_ADMIN' || user.role === 'OWNER') && (
          <button 
            onClick={() => {
              setShowForm(!showForm);
              if (user.role === 'SUPER_ADMIN') loadCompaniesForDropdown();
            }}
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: 'var(--text-dark)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}
          >
            {showForm ? 'Cancel' : (user.role === 'SUPER_ADMIN' ? 'Add Entity' : 'Add Designer')}
          </button>
        )}
      </div>

      {error && <p style={{ color: 'var(--danger-red)', marginBottom: '1rem' }}>{error}</p>}

      {showForm && (
        <div style={{ backgroundColor: 'var(--bg-white)', padding: '2rem', borderRadius: '10px', border: '1px solid var(--border-light)', marginBottom: '2rem' }}>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
             {user.role === 'SUPER_ADMIN' && (
               <select 
                 value={formData.role} 
                 onChange={e => setFormData({...formData, role: e.target.value})}
                 style={{ padding: '0.75rem' }}
               >
                 <option value="COMPANY">New Company Workspace</option>
                 <option value="OWNER">New Owner User</option>
               </select>
             )}

             <input 
               type="text" placeholder="Name" required 
               value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
               style={{ padding: '0.75rem' }} 
             />

             {formData.role !== 'COMPANY' && (
               <>
                 <input 
                   type="email" placeholder="Email" required 
                   value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                   style={{ padding: '0.75rem' }} 
                 />
                 <input 
                   type="password" placeholder="Password" required 
                   value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                   style={{ padding: '0.75rem' }} 
                 />
                 {user.role === 'SUPER_ADMIN' && formData.role === 'OWNER' && (
                   <select 
                     required
                     value={formData.companyId} 
                     onChange={e => setFormData({...formData, companyId: e.target.value})}
                     style={{ padding: '0.75rem' }}
                   >
                     <option value="">Select Company</option>
                     {companiesForDropdown.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                   </select>
                 )}
               </>
             )}
             
             <button type="submit" style={{ padding: '0.75rem', backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', borderRadius: '6px' }}>
               Create
             </button>
          </form>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}>
        {dataList.length === 0 && <p>No records found.</p>}
        {dataList.map(item => (
          <div
            key={item._id}
            style={{
              backgroundColor: 'var(--bg-white)',
              padding: '2rem 1.75rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                 <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>{item.name}</h3>
                 {item.email && <small style={{ color: 'var(--text-muted)' }}>{item.email}</small>}
               </div>
            </div>
            
            <div style={{ 
              display: 'inline-block', 
              padding: '0.35rem 0.85rem', 
              backgroundColor: 'var(--bg-beige)', 
              color: 'var(--text-dark)',
              borderRadius: '4px', 
              fontSize: '0.8rem', 
              fontWeight: 600, 
            }}>
              {item.email ? `Role: ${item.role}` : 'Workspace'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
