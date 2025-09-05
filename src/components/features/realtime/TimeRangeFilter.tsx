'use client';

import { useState } from 'react';

export type TimeRange = '5m' | '15m' | '30m' | '1h' | '3h' | '6h' | '12h' | '24h' | 'custom';

interface TimeRangeOption {
    value: TimeRange;
    label: string;
    description: string;
    minutes: number;
}

interface TimeRangeFilterProps {
    selectedRange: TimeRange;
    onRangeChange: (range: TimeRange, minutes: number) => void;
    customMinutes?: number;
}

const timeRangeOptions: TimeRangeOption[] = [
    { value: '5m', label: '5 min', description: 'Últimos 5 minutos', minutes: 5 },
    { value: '15m', label: '15 min', description: 'Últimos 15 minutos', minutes: 15 },
    { value: '30m', label: '30 min', description: 'Últimos 30 minutos', minutes: 30 },
    { value: '1h', label: '1 hora', description: 'Última hora', minutes: 60 },
    { value: '3h', label: '3 horas', description: 'Últimas 3 horas', minutes: 180 },
    { value: '6h', label: '6 horas', description: 'Últimas 6 horas', minutes: 360 },
    { value: '12h', label: '12 horas', description: 'Últimas 12 horas', minutes: 720 },
    { value: '24h', label: '24 horas', description: 'Últimas 24 horas', minutes: 1440 },
    { value: 'custom', label: 'Personalizado', description: 'Rango personalizado', minutes: 0 },
];

export function TimeRangeFilter({ selectedRange, onRangeChange, customMinutes = 60 }: TimeRangeFilterProps) {
    const [isCustomOpen, setIsCustomOpen] = useState(false);
    const [customValue, setCustomValue] = useState(customMinutes);
    const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');

    const handleRangeSelect = (option: TimeRangeOption) => {
        if (option.value === 'custom') {
            setIsCustomOpen(true);
        } else {
            onRangeChange(option.value, option.minutes);
            setIsCustomOpen(false);
        }
    };

    const handleCustomApply = () => {
        let minutes = customValue;

        if (customUnit === 'hours') {
            minutes = customValue * 60;
        } else if (customUnit === 'days') {
            minutes = customValue * 60 * 24;
        }

        onRangeChange('custom', minutes);
        setIsCustomOpen(false);
    };

    const getCustomLabel = () => {
        if (selectedRange !== 'custom') return 'Personalizado';

        const totalMinutes = customMinutes;

        if (totalMinutes < 60) {
            return `${totalMinutes} min`;
        } else if (totalMinutes < 1440) {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        } else {
            const days = Math.floor(totalMinutes / 1440);
            const hours = Math.floor((totalMinutes % 1440) / 60);
            return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
        }
    };

    return (
        <div className="relative">
            {/* Time Range Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                {timeRangeOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleRangeSelect(option)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${selectedRange === option.value
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                            }`}
                        title={option.description}
                    >
                        {option.value === 'custom' ? getCustomLabel() : option.label}
                    </button>
                ))}
            </div>

            {/* Custom Time Range Modal */}
            {isCustomOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 p-4 bg-card border border-border rounded-lg shadow-lg">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-2">
                                Rango de tiempo personalizado
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    min="1"
                                    max={customUnit === 'minutes' ? 1440 : customUnit === 'hours' ? 24 : 30}
                                    value={customValue}
                                    onChange={(e) => setCustomValue(parseInt(e.target.value) || 1)}
                                    className="w-20 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <select
                                    value={customUnit}
                                    onChange={(e) => setCustomUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                                    className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="minutes">Minutos</option>
                                    <option value="hours">Horas</option>
                                    <option value="days">Días</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Máximo: {customUnit === 'minutes' ? '1440 min (24h)' : customUnit === 'hours' ? '24 horas' : '30 días'}
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setIsCustomOpen(false)}
                                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCustomApply}
                                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Range Info */}
            <div className="text-xs text-muted-foreground">
                {selectedRange === 'custom'
                    ? `Mostrando datos de los últimos ${getCustomLabel().toLowerCase()}`
                    : `Mostrando datos de ${timeRangeOptions.find(opt => opt.value === selectedRange)?.description.toLowerCase()}`
                }
            </div>
        </div>
    );
}