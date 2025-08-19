'use client';

import { Button } from '@/components/ui/Button';

interface LinkDetail {
  linkId: string;
  slug: string;
  title?: string;
  originalUrl: string;
  clicks: number;
}

interface CountryDetail {
  country: string;
  totalClicks: number;
  links: LinkDetail[];
}

interface TopCountriesDetailsProps {
  countries: CountryDetail[];
  className?: string;
  onShowMore?: () => void;
}

const countryFlags: { [key: string]: string } = {
  'United States': '🇺🇸',
  'United States of America': '🇺🇸',
  USA: '🇺🇸',
  US: '🇺🇸',
  'United Kingdom': '🇬🇧',
  UK: '🇬🇧',
  Canada: '🇨🇦',
  Germany: '🇩🇪',
  France: '🇫🇷',
  Spain: '🇪🇸',
  Italy: '🇮🇹',
  Netherlands: '🇳🇱',
  Brazil: '🇧🇷',
  Mexico: '🇲🇽',
  Argentina: '🇦🇷',
  Colombia: '🇨🇴',
  Chile: '🇨🇱',
  Peru: '🇵🇪',
  Japan: '🇯🇵',
  China: '🇨🇳',
  India: '🇮🇳',
  'South Korea': '🇰🇷',
  Australia: '🇦🇺',
  Russia: '🇷🇺',
  Poland: '🇵🇱',
  Sweden: '🇸🇪',
  Norway: '🇳🇴',
  Denmark: '🇩🇰',
  Finland: '🇫🇮',
  Belgium: '🇧🇪',
  Switzerland: '🇨🇭',
  Austria: '🇦🇹',
  Portugal: '🇵🇹',
  Ireland: '🇮🇪',
  Turkey: '🇹🇷',
  Greece: '🇬🇷',
  'Czech Republic': '🇨🇿',
  Czechia: '🇨🇿',
  Hungary: '🇭🇺',
  Romania: '🇷🇴',
  Bulgaria: '🇧🇬',
  Croatia: '🇭🇷',
  Serbia: '🇷🇸',
  Ukraine: '🇺🇦',
  Israel: '🇮🇱',
  'Saudi Arabia': '🇸🇦',
  UAE: '🇦🇪',
  Egypt: '🇪🇬',
  'South Africa': '🇿🇦',
  Nigeria: '🇳🇬',
  Kenya: '🇰🇪',
  Thailand: '🇹🇭',
  Vietnam: '🇻🇳',
  Singapore: '🇸🇬',
  Malaysia: '🇲🇾',
  Indonesia: '🇮🇩',
  Philippines: '🇵🇭',
  'New Zealand': '🇳🇿',
};

function getCountryFlag(country: string): string {
  return countryFlags[country] || '🌍';
}

export function TopCountriesDetails({
  countries,
  className = '',
  onShowMore,
}: TopCountriesDetailsProps) {
  if (!countries || countries.length === 0) {
    return (
      <div
        className={`bg-card rounded-lg border border-border p-6 ${className}`}
      >
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          Top 5 Países - Detalles de Enlaces
        </h3>
        <p className="text-muted-foreground text-center py-8">
          No hay datos de países disponibles
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          Top Países - Detalles de Enlaces
        </h3>
        {countries.length > 2 && onShowMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShowMore}
            className="text-xs"
          >
            Mostrar más
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {countries.slice(0, 2).map((country, index) => (
          <div
            key={country.country}
            className="border-b border-border last:border-b-0 pb-6 last:pb-0"
          >
            {/* Country Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {getCountryFlag(country.country)}
                  </span>
                  <div>
                    <h4 className="font-semibold text-card-foreground">
                      {country.country}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {country.totalClicks.toLocaleString()} clicks totales
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {country.totalClicks.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">clicks</div>
              </div>
            </div>

            {/* Top Links for this Country */}
            <div className="ml-11">
              <h5 className="text-sm font-medium text-muted-foreground mb-3">
                Enlaces más populares:
              </h5>
              <div className="space-y-2">
                {country.links.map((link, linkIndex) => (
                  <a
                    key={link.linkId}
                    href={`/dashboard/links/${link.slug}/analytics`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group-hover:border-primary/20 border border-transparent">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-6 h-6 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                          {linkIndex + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                            {link.title || `/${link.slug}`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">/{link.slug}</span>
                            <span>•</span>
                            <span
                              className="truncate max-w-[200px]"
                              title={link.originalUrl}
                            >
                              {link.originalUrl}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="font-bold text-card-foreground group-hover:text-primary transition-colors">
                          {link.clicks.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          clicks
                        </div>
                      </div>
                    </div>
                  </a>
                ))}

                {country.links.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No hay datos de enlaces específicos
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Mostrando los {Math.min(2, countries.length)} países principales
          </span>
          <span className="font-medium text-card-foreground">
            {countries
              .reduce((sum, country) => sum + country.totalClicks, 0)
              .toLocaleString()}{' '}
            clicks totales
          </span>
        </div>
      </div>
    </div>
  );
}
