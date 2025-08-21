import crypto from 'crypto';

// Interfaces para los datos de geolocalización
export interface GeoLocation {
  country: string;
  city: string;
  region: string;
  countryCode?: string;
  timezone?: string;
  isp?: string;
}

export interface IPDetectionResult {
  ip: string;
  source: string;
  isPrivate: boolean;
  isLocal: boolean;
}

// Clase principal del servicio de geolocalización
export class GeolocationService {
  private static instance: GeolocationService;
  private cache = new Map<string, { data: GeoLocation; timestamp: number }>();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hora

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Detecta la IP real del cliente usando múltiples fuentes
   */
  detectClientIP(request: Request): IPDetectionResult {
    const headers = {
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-real-ip': request.headers.get('x-real-ip'),
      'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
      'x-client-ip': request.headers.get('x-client-ip'),
      'x-cluster-client-ip': request.headers.get('x-cluster-client-ip'),
      forwarded: request.headers.get('forwarded'),
    };

    // Prioridad de headers para detectar IP
    const ipSources = [
      { header: 'cf-connecting-ip', source: 'Cloudflare' },
      { header: 'x-forwarded-for', source: 'X-Forwarded-For' },
      { header: 'x-real-ip', source: 'X-Real-IP' },
      { header: 'x-client-ip', source: 'X-Client-IP' },
      { header: 'x-cluster-client-ip', source: 'X-Cluster-Client-IP' },
    ];

    for (const { header, source } of ipSources) {
      const headerValue = headers[header as keyof typeof headers];
      if (headerValue) {
        // X-Forwarded-For puede contener múltiples IPs separadas por comas
        const ips = headerValue.split(',').map(ip => ip.trim());
        for (const ip of ips) {
          if (this.isValidIP(ip) && !this.isPrivateIP(ip)) {
            return {
              ip,
              source,
              isPrivate: false,
              isLocal: false,
            };
          }
        }
      }
    }

    // Si no encontramos IP pública, usar IP local para desarrollo
    const fallbackIP = '127.0.0.1';

    return {
      ip: fallbackIP,
      source: 'fallback',
      isPrivate: true,
      isLocal: true,
    };
  }

  /**
   * Obtiene información de geolocalización para una IP
   */
  async getGeolocation(ip: string): Promise<GeoLocation> {
    // Verificar caché
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Manejar IPs locales/privadas
    if (this.isPrivateIP(ip) || this.isLocalIP(ip)) {
      const localGeo: GeoLocation = {
        country: 'Local',
        city: 'Development',
        region: 'Local',
        countryCode: 'LC',
        timezone: 'Local/Development',
      };
      this.cache.set(ip, { data: localGeo, timestamp: Date.now() });
      return localGeo;
    }

    // Intentar múltiples servicios de geolocalización
    const services = [
      () => this.getFromIPAPI(ip),
      () => this.getFromIPInfo(ip),
      () => this.getFromIPGeolocation(ip),
    ];

    for (const service of services) {
      try {
        const result = await service();
        if (result && result.country && result.country !== 'Unknown') {
          this.cache.set(ip, { data: result, timestamp: Date.now() });
          return result;
        }
      } catch (error) {
        console.warn(
          `⚠️ [GeolocationService] Error en servicio de geolocalización:`,
          error
        );
      }
    }

    // Fallback si todos los servicios fallan
    const fallbackGeo: GeoLocation = {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
    };
    return fallbackGeo;
  }

  /**
   * Servicio IP-API (gratuito, sin API key)
   */
  private async getFromIPAPI(ip: string): Promise<GeoLocation | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,timezone,isp`,
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        const result: GeoLocation = {
          country: data.country || 'Unknown',
          city: data.city || 'Unknown',
          region: data.regionName || 'Unknown',
          timezone: data.timezone,
          isp: data.isp,
        };
        return result;
      }

      throw new Error(`IP-API error: ${data.message}`);
    } catch (error) {
      console.warn(`⚠️ [GeolocationService] Error en IP-API:`, error);
      return null;
    }
  }

  /**
   * Servicio IPInfo (gratuito con límites)
   */
  private async getFromIPInfo(ip: string): Promise<GeoLocation | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://ipinfo.io/${ip}/json`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.country) {
        const [city, region] = (data.region || ',')
          .split(',')
          .map((s: string) => s.trim());
        const result: GeoLocation = {
          country: this.getCountryName(data.country) || data.country,
          city: data.city || city || 'Unknown',
          region: region || data.region || 'Unknown',
          countryCode: data.country,
          timezone: data.timezone,
        };
        return result;
      }

      throw new Error('IPInfo: No country data');
    } catch (error) {
      console.warn(`⚠️ [GeolocationService] Error en IPInfo:`, error);
      return null;
    }
  }

  /**
   * Servicio IP Geolocation (gratuito con API key)
   */
  private async getFromIPGeolocation(ip: string): Promise<GeoLocation | null> {
    try {
      // Usando el servicio gratuito sin API key (limitado)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://api.ipgeolocation.io/ipgeo?ip=${ip}`,
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.country_name) {
        const result: GeoLocation = {
          country: data.country_name || 'Unknown',
          city: data.city || 'Unknown',
          region: data.state_prov || 'Unknown',
          countryCode: data.country_code2,
          timezone: data.time_zone?.name,
        };
        return result;
      }

      throw new Error('IP Geolocation: No country data');
    } catch (error) {
      console.warn(`⚠️ [GeolocationService] Error en IP Geolocation:`, error);
      return null;
    }
  }

  /**
   * Convierte código de país a nombre completo
   */
  private getCountryName(countryCode: string): string | null {
    const countries: Record<string, string> = {
      AD: 'Andorra',
      AE: 'United Arab Emirates',
      AF: 'Afghanistan',
      AG: 'Antigua and Barbuda',
      AI: 'Anguilla',
      AL: 'Albania',
      AM: 'Armenia',
      AO: 'Angola',
      AQ: 'Antarctica',
      AR: 'Argentina',
      AS: 'American Samoa',
      AT: 'Austria',
      AU: 'Australia',
      AW: 'Aruba',
      AX: 'Åland Islands',
      AZ: 'Azerbaijan',
      BA: 'Bosnia and Herzegovina',
      BB: 'Barbados',
      BD: 'Bangladesh',
      BE: 'Belgium',
      BF: 'Burkina Faso',
      BG: 'Bulgaria',
      BH: 'Bahrain',
      BI: 'Burundi',
      BJ: 'Benin',
      BL: 'Saint Barthélemy',
      BM: 'Bermuda',
      BN: 'Brunei',
      BO: 'Bolivia',
      BQ: 'Caribbean Netherlands',
      BR: 'Brazil',
      BS: 'Bahamas',
      BT: 'Bhutan',
      BV: 'Bouvet Island',
      BW: 'Botswana',
      BY: 'Belarus',
      BZ: 'Belize',
      CA: 'Canada',
      CC: 'Cocos Islands',
      CD: 'DR Congo',
      CF: 'Central African Republic',
      CG: 'Republic of the Congo',
      CH: 'Switzerland',
      CI: "Côte d'Ivoire",
      CK: 'Cook Islands',
      CL: 'Chile',
      CM: 'Cameroon',
      CN: 'China',
      CO: 'Colombia',
      CR: 'Costa Rica',
      CU: 'Cuba',
      CV: 'Cape Verde',
      CW: 'Curaçao',
      CX: 'Christmas Island',
      CY: 'Cyprus',
      CZ: 'Czech Republic',
      DE: 'Germany',
      DJ: 'Djibouti',
      DK: 'Denmark',
      DM: 'Dominica',
      DO: 'Dominican Republic',
      DZ: 'Algeria',
      EC: 'Ecuador',
      EE: 'Estonia',
      EG: 'Egypt',
      EH: 'Western Sahara',
      ER: 'Eritrea',
      ES: 'Spain',
      ET: 'Ethiopia',
      FI: 'Finland',
      FJ: 'Fiji',
      FK: 'Falkland Islands',
      FM: 'Micronesia',
      FO: 'Faroe Islands',
      FR: 'France',
      GA: 'Gabon',
      GB: 'United Kingdom',
      GD: 'Grenada',
      GE: 'Georgia',
      GF: 'French Guiana',
      GG: 'Guernsey',
      GH: 'Ghana',
      GI: 'Gibraltar',
      GL: 'Greenland',
      GM: 'Gambia',
      GN: 'Guinea',
      GP: 'Guadeloupe',
      GQ: 'Equatorial Guinea',
      GR: 'Greece',
      GS: 'South Georgia',
      GT: 'Guatemala',
      GU: 'Guam',
      GW: 'Guinea-Bissau',
      GY: 'Guyana',
      HK: 'Hong Kong',
      HM: 'Heard Island',
      HN: 'Honduras',
      HR: 'Croatia',
      HT: 'Haiti',
      HU: 'Hungary',
      ID: 'Indonesia',
      IE: 'Ireland',
      IL: 'Israel',
      IM: 'Isle of Man',
      IN: 'India',
      IO: 'British Indian Ocean Territory',
      IQ: 'Iraq',
      IR: 'Iran',
      IS: 'Iceland',
      IT: 'Italy',
      JE: 'Jersey',
      JM: 'Jamaica',
      JO: 'Jordan',
      JP: 'Japan',
      KE: 'Kenya',
      KG: 'Kyrgyzstan',
      KH: 'Cambodia',
      KI: 'Kiribati',
      KM: 'Comoros',
      KN: 'Saint Kitts and Nevis',
      KP: 'North Korea',
      KR: 'South Korea',
      KW: 'Kuwait',
      KY: 'Cayman Islands',
      KZ: 'Kazakhstan',
      LA: 'Laos',
      LB: 'Lebanon',
      LC: 'Saint Lucia',
      LI: 'Liechtenstein',
      LK: 'Sri Lanka',
      LR: 'Liberia',
      LS: 'Lesotho',
      LT: 'Lithuania',
      LU: 'Luxembourg',
      LV: 'Latvia',
      LY: 'Libya',
      MA: 'Morocco',
      MC: 'Monaco',
      MD: 'Moldova',
      ME: 'Montenegro',
      MF: 'Saint Martin',
      MG: 'Madagascar',
      MH: 'Marshall Islands',
      MK: 'North Macedonia',
      ML: 'Mali',
      MM: 'Myanmar',
      MN: 'Mongolia',
      MO: 'Macao',
      MP: 'Northern Mariana Islands',
      MQ: 'Martinique',
      MR: 'Mauritania',
      MS: 'Montserrat',
      MT: 'Malta',
      MU: 'Mauritius',
      MV: 'Maldives',
      MW: 'Malawi',
      MX: 'Mexico',
      MY: 'Malaysia',
      MZ: 'Mozambique',
      NA: 'Namibia',
      NC: 'New Caledonia',
      NE: 'Niger',
      NF: 'Norfolk Island',
      NG: 'Nigeria',
      NI: 'Nicaragua',
      NL: 'Netherlands',
      NO: 'Norway',
      NP: 'Nepal',
      NR: 'Nauru',
      NU: 'Niue',
      NZ: 'New Zealand',
      OM: 'Oman',
      PA: 'Panama',
      PE: 'Peru',
      PF: 'French Polynesia',
      PG: 'Papua New Guinea',
      PH: 'Philippines',
      PK: 'Pakistan',
      PL: 'Poland',
      PM: 'Saint Pierre and Miquelon',
      PN: 'Pitcairn Islands',
      PR: 'Puerto Rico',
      PS: 'Palestine',
      PT: 'Portugal',
      PW: 'Palau',
      PY: 'Paraguay',
      QA: 'Qatar',
      RE: 'Réunion',
      RO: 'Romania',
      RS: 'Serbia',
      RU: 'Russia',
      RW: 'Rwanda',
      SA: 'Saudi Arabia',
      SB: 'Solomon Islands',
      SC: 'Seychelles',
      SD: 'Sudan',
      SE: 'Sweden',
      SG: 'Singapore',
      SH: 'Saint Helena',
      SI: 'Slovenia',
      SJ: 'Svalbard and Jan Mayen',
      SK: 'Slovakia',
      SL: 'Sierra Leone',
      SM: 'San Marino',
      SN: 'Senegal',
      SO: 'Somalia',
      SR: 'Suriname',
      SS: 'South Sudan',
      ST: 'São Tomé and Príncipe',
      SV: 'El Salvador',
      SX: 'Sint Maarten',
      SY: 'Syria',
      SZ: 'Eswatini',
      TC: 'Turks and Caicos Islands',
      TD: 'Chad',
      TF: 'French Southern Territories',
      TG: 'Togo',
      TH: 'Thailand',
      TJ: 'Tajikistan',
      TK: 'Tokelau',
      TL: 'East Timor',
      TM: 'Turkmenistan',
      TN: 'Tunisia',
      TO: 'Tonga',
      TR: 'Turkey',
      TT: 'Trinidad and Tobago',
      TV: 'Tuvalu',
      TW: 'Taiwan',
      TZ: 'Tanzania',
      UA: 'Ukraine',
      UG: 'Uganda',
      UM: 'U.S. Minor Outlying Islands',
      US: 'United States',
      UY: 'Uruguay',
      UZ: 'Uzbekistan',
      VA: 'Vatican City',
      VC: 'Saint Vincent and the Grenadines',
      VE: 'Venezuela',
      VG: 'British Virgin Islands',
      VI: 'U.S. Virgin Islands',
      VN: 'Vietnam',
      VU: 'Vanuatu',
      WF: 'Wallis and Futuna',
      WS: 'Samoa',
      YE: 'Yemen',
      YT: 'Mayotte',
      ZA: 'South Africa',
      ZM: 'Zambia',
      ZW: 'Zimbabwe',
    };

    return countries[countryCode.toUpperCase()] || null;
  }

  /**
   * Valida si una cadena es una IP válida
   */
  private isValidIP(ip: string): boolean {
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Verifica si una IP es privada
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^fc00:/,
      /^fe80:/,
      /^::1$/,
      /^::$/,
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Verifica si una IP es local
   */
  private isLocalIP(ip: string): boolean {
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
  }

  /**
   * Hash de IP para privacidad
   */
  hashIP(ip: string): string {
    return crypto
      .createHash('sha256')
      .update(ip + process.env.IP_HASH_SALT || 'default-salt')
      .digest('hex');
  }

  /**
   * Limpia la caché
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas de la caché
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Función de conveniencia para usar el servicio
export async function getGeolocationForRequest(request: Request): Promise<{
  ipInfo: IPDetectionResult;
  geoInfo: GeoLocation;
}> {
  const service = GeolocationService.getInstance();
  const ipInfo = service.detectClientIP(request);
  const geoInfo = await service.getGeolocation(ipInfo.ip);

  return { ipInfo, geoInfo };
}

// Exportar instancia singleton
export const geolocationService = GeolocationService.getInstance();
