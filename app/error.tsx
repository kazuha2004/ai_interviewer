'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
      <h2>Something went wrong</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{error.message}</p>
      <button
        onClick={() => reset()}
        style={{
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #4f63e8, #7c3aed)',
          border: 'none',
          borderRadius: '0.75rem',
          color: 'white',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}