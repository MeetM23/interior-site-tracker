import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProfileView from '../../components/ProfileView';
import Link from 'next/link';

export default function UserProfile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  if (loading || !user || !id) return <p>Loading...</p>;

  if (user.role !== 'owner' && user._id !== id) {
     return <p style={{ color: 'var(--danger-red)', padding: '2rem' }}>Unauthorized access. You do not have permission to view this profile.</p>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <Link href="/team" style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ← Back to Team
        </Link>
        <h1 style={{ marginBottom: '0.5rem' }}>Worker Analytics</h1>
      </div>
      <ProfileView userId={id} />
    </div>
  );
}
