'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function DataModal({ isOpen, onClose, title, children }: DataModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] modal-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

// Componente específico para mostrar datos de países
interface CountryDetail {
  country: string;
  totalClicks: number;
  links: Array<{
    linkId: string;
    slug: string;
    title?: string;
    originalUrl: string;
    clicks: number;
  }>;
}

interface CountryDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  countries: CountryDetail[];
}

export function CountryDataModal({ isOpen, onClose, countries }: CountryDataModalProps) {
  const totalClicks = countries.reduce((sum, country) => sum + country.totalClicks, 0);
  
  return (
    <DataModal isOpen={isOpen} onClose={onClose} title="Todos los Países">
      <div className="space-y-4">
        <div className="grid gap-3">
          {countries.map((country, index) => {
            const percentage = totalClicks > 0 ? (country.totalClicks / totalClicks) * 100 : 0;
            return (
              <div 
                key={country.country}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {country.country}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {country.totalClicks.toLocaleString()} clicks
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DataModal>
  );
}

// Componente específico para mostrar datos de referrers
interface ReferrerDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  referrers: Array<{ referrer: string; clicks: number }>;
  totalClicks: number;
}

export function ReferrerDataModal({ isOpen, onClose, referrers, totalClicks }: ReferrerDataModalProps) {
  const formatReferrer = (referrer: string) => {
    if (!referrer || referrer === 'null') return 'Tráfico Directo';
    try {
      const url = new URL(referrer);
      return url.hostname.replace('www.', '');
    } catch {
      return referrer;
    }
  };

  return (
    <DataModal isOpen={isOpen} onClose={onClose} title="Todos los Referrers">
      <div className="space-y-4">
        <div className="grid gap-3">
          {referrers.map((referrer, index) => {
            const percentage = totalClicks > 0 ? (referrer.clicks / totalClicks) * 100 : 0;
            return (
              <div 
                key={`${referrer.referrer}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    #{index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatReferrer(referrer.referrer)}
                    </div>
                    {referrer.referrer && referrer.referrer !== 'null' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {referrer.referrer}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {referrer.clicks.toLocaleString()} clicks
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DataModal>
  );
}

// Componente específico para mostrar datos de enlaces populares
interface PopularLinksDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: Array<{ linkId: string; slug: string; title?: string; clicks: number }>;
}

export function PopularLinksDataModal({ isOpen, onClose, links }: PopularLinksDataModalProps) {
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  
  return (
    <DataModal isOpen={isOpen} onClose={onClose} title="Todos los Enlaces Populares">
      <div className="space-y-4">
        <div className="grid gap-3">
          {links.map((link, index) => {
            const percentage = totalClicks > 0 ? (link.clicks / totalClicks) * 100 : 0;
            return (
              <a
                key={link.linkId}
                href={`/dashboard/links/${link.slug}/analytics`}
                className="block hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        /{link.slug}
                      </div>
                      {link.title && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {link.title}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {link.clicks.toLocaleString()} clicks
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </DataModal>
  );
}