import { Suspense } from 'react';
import { ResultsClient } from '../results-client';

export const dynamic = 'force-dynamic';

interface ResultsPageProps {
  params: { id: string };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { id } = params;
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin">📊</div>
          <p className="text-gray-400 text-lg">Loading your evaluation...</p>
        </div>
      </div>
    }>
      <ResultsClient sessionId={id} />
    </Suspense>
  );
}