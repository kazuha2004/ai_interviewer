'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0 }}>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          background: '#050508',
          minHeight: '100vh',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <h2>Something went wrong</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{error.message}</p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4f63e8',
              border: 'none',
              borderRadius: '0.75rem',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}