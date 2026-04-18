import React, { Suspense } from 'react';
import { InterviewClientComponent } from './interview-client';

export const dynamic = 'force-dynamic';

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🎓</div>
          <p className="text-gray-400">Loading interview...</p>
        </div>
      </div>
    }>
      <InterviewClientComponent />
    </Suspense>
  );
}