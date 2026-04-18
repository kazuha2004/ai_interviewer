'use client';

import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050508',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: 'sans-serif',
      color: 'white',
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
      <p style={{ color: '#94a3b8' }}>Page not found</p>
      <button
        onClick={() => router.push('/')}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #4f63e8, #7c3aed)',
          border: 'none',
          borderRadius: '0.75rem',
          color: 'white',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Go Home
      </button>
    </div>
  );
}