'use client';

interface MapLegendProps {
    className?: string;
}

export function MapLegend({ className = '' }: MapLegendProps) {
    const legendItems = [
        { color: '#dc2626', label: 'Muy Alta', range: '≥50%' },
        { color: '#ea580c', label: 'Alta', range: '30-49%' },
        { color: '#3b82f6', label: 'Media', range: '15-29%' },
        { color: '#6366f1', label: 'Baja', range: '5-14%' },
        { color: '#64748b', label: 'Mínima', range: '<5%' },
    ];

    return (
        <div className={`bg-card border border-border rounded-lg p-3 ${className}`}>
            <h4 className="text-sm font-medium text-card-foreground mb-2">
                Intensidad de Actividad
            </h4>
            <div className="space-y-1.5">
                {legendItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                        <div
                            className="w-3 h-3 rounded-full border-2 border-background"
                            style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-card-foreground font-medium min-w-[3rem]">
                            {item.label}
                        </span>
                        <span className="text-muted-foreground">
                            {item.range}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                    El tamaño del marcador indica el número total de clicks
                </p>
            </div>
        </div>
    );
}