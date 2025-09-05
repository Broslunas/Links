'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Fix para los iconos de Leaflet en Next.js
if (typeof window !== 'undefined') {
    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

// Importar Leaflet dinámicamente para evitar problemas de SSR
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);

const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);

const CircleMarker = dynamic(
    () => import('react-leaflet').then((mod) => mod.CircleMarker),
    { ssr: false }
);

const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

interface CountryData {
    country: string;
    countryCode: string;
    clicks: number;
    percentage: number;
    lat?: number;
    lng?: number;
}

interface InteractiveMapProps {
    countryData: CountryData[];
    totalClicks: number;
}

// Coordenadas aproximadas de países
const countryCoordinates: { [key: string]: [number, number] } = {
    'ES': [40.4168, -3.7038], // España
    'US': [39.8283, -98.5795], // Estados Unidos
    'MX': [23.6345, -102.5528], // México
    'AR': [-38.4161, -63.6167], // Argentina
    'CO': [4.5709, -74.2973], // Colombia
    'PE': [-9.1900, -75.0152], // Perú
    'CL': [-35.6751, -71.5430], // Chile
    'VE': [6.4238, -66.5897], // Venezuela
    'EC': [-1.8312, -78.1834], // Ecuador
    'BO': [-16.2902, -63.5887], // Bolivia
    'PY': [-23.4425, -58.4438], // Paraguay
    'UY': [-32.5228, -55.7658], // Uruguay
    'BR': [-14.2350, -51.9253], // Brasil
    'FR': [46.6034, 1.8883], // Francia
    'DE': [51.1657, 10.4515], // Alemania
    'IT': [41.8719, 12.5674], // Italia
    'GB': [55.3781, -3.4360], // Reino Unido
    'CA': [56.1304, -106.3468], // Canadá
    'JP': [36.2048, 138.2529], // Japón
    'AU': [-25.2744, 133.7751], // Australia
    'IN': [20.5937, 78.9629], // India
    'CN': [35.8617, 104.1954], // China
    'RU': [61.5240, 105.3188], // Rusia
};

export function InteractiveMap({ countryData, totalClicks }: InteractiveMapProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Añadir coordenadas a los datos de países
    const enrichedCountryData = countryData.map(country => ({
        ...country,
        lat: countryCoordinates[country.countryCode]?.[0],
        lng: countryCoordinates[country.countryCode]?.[1],
    })).filter(country => country.lat && country.lng);

    // Calcular el radio del marcador basado en el número de clicks
    const getMarkerRadius = (clicks: number) => {
        const maxRadius = 25;
        const minRadius = 8;
        const maxClicks = Math.max(...countryData.map(c => c.clicks));

        if (maxClicks === 0) return minRadius;

        const ratio = clicks / maxClicks;
        return minRadius + (maxRadius - minRadius) * ratio;
    };

    // Obtener color del marcador basado en la intensidad
    const getMarkerColor = (percentage: number) => {
        if (percentage >= 50) return '#ef4444'; // Rojo intenso
        if (percentage >= 30) return '#f97316'; // Naranja
        if (percentage >= 15) return '#eab308'; // Amarillo
        if (percentage >= 5) return '#22c55e'; // Verde
        return '#3b82f6'; // Azul
    };

    if (!isClient) {
        return (
            <div className="h-80 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-border flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                </div>
            </div>
        );
    }

    if (enrichedCountryData.length === 0) {
        return (
            <div className="h-80 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-border flex items-center justify-center">
                <div className="text-center">
                    <svg className="h-16 w-16 mx-auto text-blue-500/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-80 rounded-lg overflow-hidden border border-border">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {enrichedCountryData.map((country) => (
                    <CircleMarker
                        key={country.countryCode}
                        center={[country.lat!, country.lng!]}
                        radius={getMarkerRadius(country.clicks)}
                        fillColor={getMarkerColor(country.percentage)}
                        color="#ffffff"
                        weight={2}
                        opacity={0.8}
                        fillOpacity={0.7}
                    >
                        <Popup>
                            <div className="text-center p-2">
                                <div className="text-lg mb-1">
                                    {country.countryCode === 'ES' && '🇪🇸'}
                                    {country.countryCode === 'US' && '🇺🇸'}
                                    {country.countryCode === 'MX' && '🇲🇽'}
                                    {country.countryCode === 'AR' && '🇦🇷'}
                                    {country.countryCode === 'CO' && '🇨🇴'}
                                    {country.countryCode === 'PE' && '🇵🇪'}
                                    {country.countryCode === 'CL' && '🇨🇱'}
                                    {country.countryCode === 'VE' && '🇻🇪'}
                                    {country.countryCode === 'EC' && '🇪🇨'}
                                    {country.countryCode === 'BO' && '🇧🇴'}
                                    {country.countryCode === 'PY' && '🇵🇾'}
                                    {country.countryCode === 'UY' && '🇺🇾'}
                                    {country.countryCode === 'BR' && '🇧🇷'}
                                    {country.countryCode === 'FR' && '🇫🇷'}
                                    {country.countryCode === 'DE' && '🇩🇪'}
                                    {country.countryCode === 'IT' && '🇮🇹'}
                                    {country.countryCode === 'GB' && '🇬🇧'}
                                    {country.countryCode === 'CA' && '🇨🇦'}
                                    {!['ES', 'US', 'MX', 'AR', 'CO', 'PE', 'CL', 'VE', 'EC', 'BO', 'PY', 'UY', 'BR', 'FR', 'DE', 'IT', 'GB', 'CA'].includes(country.countryCode) && '🌍'}
                                </div>
                                <div className="font-semibold text-gray-900">{country.country}</div>
                                <div className="text-sm text-gray-600">
                                    <div>{country.clicks} clicks</div>
                                    <div>{country.percentage}% del total</div>
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}