'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ApiResponse } from '../../types';

interface AnalyticsSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDays: number;
}

interface SummaryData {
  summary: string;
  stats: {
    totalLinks: number;
    totalClicks: number;
    avgClicksPerLink: number;
    topLinks: Array<{ slug: string; title?: string; clicks: number }>;
    topCountries: Array<{ country: string; clicks: number }>;
    topDevices: Array<{ device: string; clicks: number }>;
    topBrowsers: Array<{ browser: string; clicks: number }>;
  };
}

export const AnalyticsSummaryModal: React.FC<AnalyticsSummaryModalProps> = ({
  isOpen,
  onClose,
  selectedDays,
}) => {
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    setSummaryData(null);

    try {
      const response = await fetch('/api/analytics/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: selectedDays }),
      });

      const data: ApiResponse<SummaryData> = await response.json();

      if (data.success && data.data) {
        setSummaryData(data.data);
      } else {
        setError(data.error?.message || 'Error al generar el resumen');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Generate summary when modal opens
  React.useEffect(() => {
    if (isOpen && !summaryData && !loading) {
      generateSummary();
    }
  }, [isOpen]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSummaryData(null);
      setError(null);
    }
  }, [isOpen]);

  const formatSummaryText = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Handle headers (lines starting with emojis and **)
        if (line.match(/^[🎯🏆🌍📱💡📊]\s*\*\*.*\*\*:/)) {
          const cleanLine = line.replace(/\*\*(.*?)\*\*/, '$1');
          return (
            <h3 key={index} className="text-base sm:text-lg font-semibold text-card-foreground mt-4 mb-2 first:mt-0">
              {cleanLine}
            </h3>
          );
        }
        
        // Handle bullet points
        if (line.startsWith('•')) {
          const cleanLine = line.substring(1).trim();
          // Handle bold text within bullet points
          const parts = cleanLine.split(/\*\*(.*?)\*\*/);
          return (
            <li key={index} className="text-muted-foreground mb-1 ml-4">
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? (
                  <strong key={partIndex} className="text-card-foreground font-semibold">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </li>
          );
        }
        
        // Handle main title
        if (line.includes('📊 **Resumen de tus analíticas')) {
          return (
            <h2 key={index} className="text-lg sm:text-xl font-bold text-card-foreground mb-4">
              📊 Resumen de tus analíticas (últimos {selectedDays} días)
            </h2>
          );
        }
        
        // Handle empty lines
        if (line.trim() === '') {
          return <div key={index} className="h-2" />;
        }
        
        // Handle regular text
        const parts = line.split(/\*\*(.*?)\*\*/);
        return (
          <p key={index} className="text-muted-foreground mb-2">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? (
                <strong key={partIndex} className="text-card-foreground font-semibold">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resumen Inteligente de Analíticas"
      description={`Análisis detallado de tus enlaces de los últimos ${selectedDays} días`}
      size="lg"
    >
      <div className="space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground mt-4">
              Analizando tus datos y generando resumen...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700 dark:text-red-300 font-medium">
                Error al generar resumen
              </p>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {error}
            </p>
            <Button
              onClick={generateSummary}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Reintentar
            </Button>
          </div>
        )}

        {summaryData && (
          <div className="space-y-4">
            {/* Summary Text */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6">
              <div className="prose prose-sm max-w-none text-sm sm:text-base">
                {formatSummaryText(summaryData.summary)}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {summaryData.stats.totalLinks}
                </div>
                <div className="text-xs text-muted-foreground">
                  Enlaces Activos
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {summaryData.stats.totalClicks.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Clicks Totales
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {summaryData.stats.avgClicksPerLink}
                </div>
                <div className="text-xs text-muted-foreground">
                  Promedio por Enlace
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {summaryData.stats.topCountries.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Países Alcanzados
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button
                onClick={generateSummary}
                variant="outline"
                disabled={loading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                🔄 Actualizar Resumen
              </Button>
              <Button onClick={onClose} className="w-full sm:w-auto order-1 sm:order-2">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};