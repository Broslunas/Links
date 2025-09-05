'use client';

import { useState } from 'react';

export type RefreshInterval = 1 | 3 | 5 | 10 | 15 | 30 | 60 | 0; // 0 = manual

interface RefreshOption {
    value: RefreshInterval;
    label: string;
    description: string;
}

interface RefreshSettingsProps {
    selectedInterval: RefreshInterval;
    onIntervalChange: (interval: RefreshInterval) => void;
    onManualRefresh: () => void;
    isRefreshing?: boolean;
}

const refreshOptions: RefreshOption[] = [
    { value: 1, label: '1s', description: 'Cada segundo (muy rápido)' },
    { value: 3, label: '3s', description: 'Cada 3 segundos (rápido)' },
    { value: 5, label: '5s', description: 'Cada 5 segundos (normal)' },
    { value: 10, label: '10s', description: 'Cada 10 segundos (moderado)' },
    { value: 15, label: '15s', description: 'Cada 15 segundos (lento)' },
    { value: 30, label: '30s', description: 'Cada 30 segundos (muy lento)' },
    { value: 60, label: '1m', description: 'Cada minuto (mínimo)' },
    { value: 0, label: 'Manual', description: 'Solo actualización manual' },
];

export function RefreshSettings({
    selectedInterval,
    onIntervalChange,
    onManualRefresh,
    isRefreshing = false
}: RefreshSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = refreshOptions.find(opt => opt.value === selectedInterval);

    return (
        <div className="relative">
            {/* Refresh Control Button */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-lg transition-colors"
                    title="Configurar actualización automática"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{selectedOption?.label}</span>
                    <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Manual Refresh Button */}
                <button
                    onClick={onManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Actualizar ahora"
                >
                    <svg
                        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 z-50 mt-2 w-64 p-2 bg-card border border-border rounded-lg shadow-lg">
                    <div className="space-y-1">
                        <div className="px-3 py-2 text-sm font-medium text-card-foreground border-b border-border">
                            Frecuencia de actualización
                        </div>

                        {refreshOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onIntervalChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${selectedInterval === option.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-card-foreground hover:bg-muted'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">{option.label}</span>
                                    {option.value === 1 && (
                                        <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-500 rounded">
                                            Alto CPU
                                        </span>
                                    )}
                                    {option.value === 3 && (
                                        <span className="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-500 rounded">
                                            Recomendado
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {option.description}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 pt-2 border-t border-border">
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                            💡 <strong>Consejo:</strong> Intervalos muy cortos pueden consumir más recursos del navegador y servidor.
                        </div>
                    </div>
                </div>
            )}

            {/* Status Indicator */}
            <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${selectedInterval === 0
                        ? 'bg-gray-400'
                        : isRefreshing
                            ? 'bg-green-500 animate-pulse'
                            : 'bg-green-500'
                    }`}></div>
                <span>
                    {selectedInterval === 0
                        ? 'Actualización manual'
                        : `Auto-actualización cada ${selectedOption?.label}`
                    }
                </span>
            </div>
        </div>
    );
}