import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'owner') {
        router.replace('/dashboard');
      } else {
        fetchTeam();
      }
    }
  }, [user, loading, router]);

  const fetchTeam = async () => {
    try {
      const { data } = await api.get('/users');
      setTeam(data.data || []);
    } catch (e) {
      setError('Failed to load team data.');
    }
  };

  if (loading || !user || user.role !== 'owner') return <p>Loading secure data...</p>;

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Team Management</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
          Manage your enterprise workforce and analyze their active assignments.
        </p>
      </div>

      {error && <p style={{ color: 'var(--danger-red)' }}>{error}</p>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}>
        {team.map(member => (
          <div
            key={member._id}
            onClick={() => router.push(`/profile/${member._id}`)}
            style={{
              backgroundColor: 'var(--bg-white)',
              padding: '2rem 1.75rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
               {member.profilePhoto ? (
                  <img src={member.profilePhoto} alt={member.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
               ) : (
                 <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--text-dark)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-heading)'
                 }}>
                    {member.name.charAt(0).toUpperCase()}
                 </div>
               )}
               <div>
                 <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>{member.name}</h3>
                 <small style={{ color: 'var(--text-muted)' }}>{member.email}</small>
               </div>
            </div>
            
            <div style={{ 
              display: 'inline-block', 
              padding: '0.35rem 0.85rem', 
              backgroundColor: member.role === 'owner' ? 'var(--text-dark)' : 'var(--bg-beige)', 
              color: member.role === 'owner' ? 'white' : 'var(--text-dark)',
              borderRadius: '4px', 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {member.role === 'owner' ? 'Admin / Owner' : 'Designer'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
