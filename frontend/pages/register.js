import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-beige)',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <p style={{ color: '#86868b', fontSize: '1rem' }}>
        This platform is invite-only. Redirecting to login...
      </p>
    </div>
  );
}
