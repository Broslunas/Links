'use client';

import { ModernStatsViewerGlobal } from '../../../components/features/ModernStatsViewerGlobal';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analíticas</h1>
        <p className="text-muted-foreground">
          Información detallada sobre el rendimiento de tus enlaces
        </p>
      </div>

      {/* Modern Stats Viewer */}
      <ModernStatsViewerGlobal />
    </div>
  );
}
