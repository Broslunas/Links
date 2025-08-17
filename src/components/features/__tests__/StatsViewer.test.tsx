import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StatsViewer } from '../StatsViewer';

// Mock Recharts components
jest.mock('recharts', () => ({
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div data-testid="area" />,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => <div data-testid="pie" />,
    Cell: () => <div data-testid="cell" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and related functions for export tests
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

const mockStatsData = {
    totalClicks: 150,
    clicksByDay: [
        { date: '2024-01-01', clicks: 10 },
        { date: '2024-01-02', clicks: 15 },
        { date: '2024-01-03', clicks: 20 },
    ],
    clicksByCountry: [
        { country: 'US', clicks: 50 },
        { country: 'ES', clicks: 30 },
        { country: 'MX', clicks: 20 },
    ],
    clicksByDevice: [
        { device: 'mobile', clicks: 80 },
        { device: 'desktop', clicks: 50 },
        { device: 'tablet', clicks: 20 },
    ],
    clicksByBrowser: [
        { browser: 'Chrome', clicks: 90 },
        { browser: 'Firefox', clicks: 30 },
        { browser: 'Safari', clicks: 30 },
    ],
    clicksByOS: [
        { os: 'Windows', clicks: 70 },
        { os: 'iOS', clicks: 40 },
        { os: 'Android', clicks: 40 },
    ],
};

describe('StatsViewer', () => {
    beforeEach(() => {
        (fetch as jest.Mock).mockClear();
        (global.URL.createObjectURL as jest.Mock).mockClear();
        (global.URL.revokeObjectURL as jest.Mock).mockClear();
    });

    it('renders loading state initially', () => {
        (fetch as jest.Mock).mockImplementation(() => new Promise(() => { })); // Never resolves

        render(<StatsViewer linkId="test-link-id" />);

        expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('renders stats data when loaded successfully', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockStatsData,
            }),
        });

        render(<StatsViewer linkId="test-link-id" linkSlug="test-slug" />);

        await waitFor(() => {
            expect(screen.getByText('Estadísticas - /test-slug')).toBeInTheDocument();
        });

        expect(screen.getByText('Total de clicks:')).toBeInTheDocument();
        expect(screen.getAllByText('150')[0]).toBeInTheDocument();
        expect(screen.getByText('Clicks por Día')).toBeInTheDocument();
        expect(screen.getByText('Distribución por Dispositivo')).toBeInTheDocument();
        expect(screen.getByText('Países con Más Clicks')).toBeInTheDocument();
        expect(screen.getByText('Navegadores Más Usados')).toBeInTheDocument();
        expect(screen.getByText('Sistemas Operativos')).toBeInTheDocument();
    });

    it('renders error state when API call fails', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                success: false,
                error: {
                    message: 'Error al cargar estadísticas',
                },
            }),
        });

        render(<StatsViewer linkId="test-link-id" />);

        await waitFor(() => {
            expect(screen.getByText('Error')).toBeInTheDocument();
        });

        expect(screen.getByText('Error al cargar estadísticas')).toBeInTheDocument();
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });

    it('renders no data state when stats are empty', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: null,
            }),
        });

        render(<StatsViewer linkId="test-link-id" />);

        await waitFor(() => {
            expect(screen.getByText('Error al cargar estadísticas')).toBeInTheDocument();
        });
    });

    it('calls API with correct parameters', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockStatsData,
            }),
        });

        render(<StatsViewer linkId="test-link-id" />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/analytics/test-link-id')
            );
        });
    });

    it('renders all chart components', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockStatsData,
            }),
        });

        render(<StatsViewer linkId="test-link-id" />);

        await waitFor(() => {
            expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        });

        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getAllByTestId('bar-chart')).toHaveLength(3); // Countries, Browsers, OS
    });

    it('renders summary statistics', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockStatsData,
            }),
        });

        render(<StatsViewer linkId="test-link-id" />);

        await waitFor(() => {
            expect(screen.getByText('Resumen de Estadísticas')).toBeInTheDocument();
        });

        expect(screen.getByText('Total Clicks')).toBeInTheDocument();
        expect(screen.getByText('Países')).toBeInTheDocument();
        expect(screen.getByText('Tipos de Dispositivo')).toBeInTheDocument();
        expect(screen.getByText('Navegadores')).toBeInTheDocument();
    });

    it('renders export buttons when stats are loaded', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockStatsData,
            }),
        });

        render(<StatsViewer linkId="test-link-id" linkSlug="test-slug" />);

        await waitFor(() => {
            expect(screen.getByText('CSV')).toBeInTheDocument();
            expect(screen.getByText('JSON')).toBeInTheDocument();
            expect(screen.getByText('Detallado')).toBeInTheDocument();
        });
    });

    it('handles CSV export when button is clicked', async () => {
        // Mock successful stats fetch
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: mockStatsData,
                }),
            })
            // Mock successful export fetch
            .mockResolvedValueOnce({
                ok: true,
                headers: {
                    get: (name: string) => {
                        if (name === 'content-disposition') {
                            return 'attachment; filename="test-export.csv"';
                        }
                        return null;
                    },
                },
                blob: () => Promise.resolve(new Blob(['test csv data'], { type: 'text/csv' })),
            });

        // Mock document.createElement and appendChild
        const mockAnchor = {
            href: '',
            download: '',
            click: jest.fn(),
        };
        const originalCreateElement = document.createElement;
        document.createElement = jest.fn((tagName) => {
            if (tagName === 'a') {
                return mockAnchor as any;
            }
            return originalCreateElement.call(document, tagName);
        });

        const mockAppendChild = jest.fn();
        const mockRemoveChild = jest.fn();
        document.body.appendChild = mockAppendChild;
        document.body.removeChild = mockRemoveChild;

        render(<StatsViewer linkId="test-link-id" linkSlug="test-slug" />);

        // Wait for stats to load
        await waitFor(() => {
            expect(screen.getByText('CSV')).toBeInTheDocument();
        });

        // Click CSV export button
        const csvButton = screen.getByText('CSV');
        fireEvent.click(csvButton);

        // Wait for export to complete
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/analytics/export?linkId=test-link-id&format=csv')
            );
            expect(mockAnchor.click).toHaveBeenCalled();
            expect(mockAnchor.download).toBe('test-export.csv');
        });

        // Restore original functions
        document.createElement = originalCreateElement;
    });

    it('handles JSON export when button is clicked', async () => {
        // Mock successful stats fetch
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: mockStatsData,
                }),
            })
            // Mock successful export fetch
            .mockResolvedValueOnce({
                ok: true,
                headers: {
                    get: (name: string) => {
                        if (name === 'content-disposition') {
                            return 'attachment; filename="test-export.json"';
                        }
                        return null;
                    },
                },
                blob: () => Promise.resolve(new Blob(['{"test": "json data"}'], { type: 'application/json' })),
            });

        // Mock document.createElement and appendChild
        const mockAnchor = {
            href: '',
            download: '',
            click: jest.fn(),
        };
        const originalCreateElement = document.createElement;
        document.createElement = jest.fn((tagName) => {
            if (tagName === 'a') {
                return mockAnchor as any;
            }
            return originalCreateElement.call(document, tagName);
        });

        const mockAppendChild = jest.fn();
        const mockRemoveChild = jest.fn();
        document.body.appendChild = mockAppendChild;
        document.body.removeChild = mockRemoveChild;

        render(<StatsViewer linkId="test-link-id" linkSlug="test-slug" />);

        // Wait for stats to load
        await waitFor(() => {
            expect(screen.getByText('JSON')).toBeInTheDocument();
        });

        // Click JSON export button
        const jsonButton = screen.getByText('JSON');
        fireEvent.click(jsonButton);

        // Wait for export to complete
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/analytics/export?linkId=test-link-id&format=json')
            );
            expect(mockAnchor.click).toHaveBeenCalled();
            expect(mockAnchor.download).toBe('test-export.json');
        });

        // Restore original functions
        document.createElement = originalCreateElement;
    });
});