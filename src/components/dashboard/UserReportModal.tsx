'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Download,
    User,
    FileText,
    AlertTriangle,
    Activity,
    Calendar,
    Shield,
    TrendingUp,
    BarChart3,
    FileJson
} from 'lucide-react';
import jsPDF from 'jspdf';

interface UserReport {
    user: {
        _id: string;
        email: string;
        name?: string;
        role: string;
        isActive: boolean;
        createdAt: string;
        lastLogin?: string;
    };
    activity: {
        linksCount: number;
        totalClicks: number;
        links: Array<{
            _id: string;
            originalUrl: string;
            shortCode: string;
            title?: string;
            createdAt: string;
            isActive: boolean;
        }>;
    };
    notes: {
        total: number;
        byCategory: Record<string, number>;
        items: Array<{
            _id: string;
            content: string;
            category?: string;
            createdAt: string;
            author: {
                name?: string;
                email: string;
            } | null;
        }>;
    };
    warnings: {
        total: number;
        active: number;
        resolved: number;
        bySeverity: Record<string, number>;
        items: Array<{
            _id: string;
            reason: string;
            severity: string;
            category?: string;
            isActive: boolean;
            resolvedAt?: string;
            resolutionNotes?: string;
            createdAt: string;
            author: {
                name?: string;
                email: string;
            } | null;
        }>;
    };
    adminActions: {
        total: number;
        byType: Record<string, number>;
        items: Array<{
            _id: string;
            actionType: string;
            reason?: string;
            previousState?: any;
            newState?: any;
            createdAt: string;
            admin: {
                name?: string;
                email: string;
            } | null;
        }>;
    };
    riskAssessment: {
        score: number;
        level: string;
        factors: {
            activeWarnings: number;
            criticalWarnings: number;
            totalNotes: number;
            recentActivity: number;
        };
    };
    summary: {
        accountAge: number;
        lastActivity: number | null;
        totalInteractions: number;
    };
    generatedAt: string;
}

interface UserReportModalProps {
    userId: string;
    userName?: string;
    userEmail: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserReportModal({
    userId,
    userName,
    userEmail,
    isOpen,
    onClose
}: UserReportModalProps) {
    const [report, setReport] = useState<UserReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'notes' | 'warnings' | 'actions'>('overview');

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserReport();
        }
    }, [isOpen, userId, dateFrom, dateTo]);

    const fetchUserReport = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                format: 'json',
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo })
            });

            const response = await fetch(`/api/admin/reports/user/${userId}?${params}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setReport(data.data);
                } else {
                    setError(data.error?.message || 'Error loading user report');
                }
            } else {
                setError('Error connecting to server');
            }
        } catch (error) {
            console.error('Error fetching user report:', error);
            setError('Unexpected error loading user report');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
        try {
            if (format === 'pdf') {
                generatePDF();
                return;
            }

            const params = new URLSearchParams({
                format,
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo })
            });

            const response = await fetch(`/api/admin/reports/user/${userId}?${params}`);

            if (format === 'csv') {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `user-report-${userEmail}-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else if (format === 'json') {
                const data = await response.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `user-report-${userEmail}-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error exporting user report:', error);
        }
    };

    const generatePDF = async () => {
        if (!report) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPosition = margin;

        // Colors - Simple palette
        const primaryBlue = [41, 128, 185];
        const darkGray = [52, 73, 94];
        const lightGray = [149, 165, 166];
        const redAlert = [231, 76, 60];
        const greenSuccess = [39, 174, 96];
        const yellowWarning = [241, 196, 15];

        // Helper functions
        const addText = (text: string, x: number, y: number, fontSize: number = 10, fontStyle: string = 'normal', color: number[] = [0, 0, 0]) => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(text, x, y);
        };

        const addSection = (title: string, y: number) => {
            // Simple section header with line
            doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
            doc.setLineWidth(1);
            doc.line(margin, y, pageWidth - margin, y);

            addText(title, margin, y + 10, 14, 'bold', primaryBlue);
            return y + 20;
        };

        const checkPageBreak = (requiredSpace: number) => {
            if (yPosition + requiredSpace > pageHeight - 60) {
                addFooter();
                doc.addPage();
                addHeader();
                yPosition = 80;
            }
        };

        const addHeader = () => {
            // Simple blue header
            doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
            doc.rect(0, 0, pageWidth, 50, 'F');

            // Company name
            addText('Broslunas Link', margin, 20, 18, 'bold', [255, 255, 255]);
            addText('https://broslunas.com', margin, 32, 10, 'normal', [220, 220, 220]);

            // Report title
            addText('REPORTE DE USUARIO', pageWidth - margin - 80, 20, 16, 'bold', [255, 255, 255]);

            // Date
            const currentDate = new Date();
            addText(`Fecha: ${currentDate.toLocaleDateString('es-ES')}`, pageWidth - margin - 80, 32, 10, 'normal', [220, 220, 220]);
            addText(`Hora: ${currentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin - 80, 42, 10, 'normal', [220, 220, 220]);

            // Simple line separator
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.5);
            doc.line(margin, 48, pageWidth - margin, 48);
        };

        const addFooter = () => {
            const footerY = pageHeight - 40;

            // Simple footer line
            doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.setLineWidth(0.5);
            doc.line(margin, footerY, pageWidth - margin, footerY);

            // Legal text
            addText('Este documento es confidencial y destinado únicamente para uso interno administrativo y solo se puede compartir con el propietario.', margin, footerY + 8, 8, 'normal', lightGray);

            // Copyright
            addText('© 2025 Broslunas Link - Todos los derechos reservados', margin, footerY + 18, 8, 'bold', darkGray);

            // Page number
            const pageNum = (doc as any).getCurrentPageInfo().pageNumber;
            addText(`Página ${pageNum}`, pageWidth - margin - 30, footerY + 18, 8, 'normal', darkGray);
        };

        // Start document
        addHeader();
        yPosition = 60;

        // User Information Section
        yPosition = addSection('INFORMACION DEL USUARIO', yPosition);

        // User card
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPosition, pageWidth - margin * 2, 45, 'FD');

        // User details
        addText(report.user?.name || 'Usuario sin nombre', margin + 10, yPosition + 15, 14, 'bold', darkGray);
        addText(`Email: ${report.user?.email || 'Sin email'}`, margin + 10, yPosition + 25, 10, 'normal');
        addText(`Rol: ${report.user?.role === 'admin' ? 'Administrador' : 'Usuario'}`, margin + 10, yPosition + 33, 10, 'normal');
        addText(`Registro: ${report.user?.createdAt ? formatDate(report.user.createdAt) : 'Sin fecha'}`, margin + 10, yPosition + 41, 10, 'normal');

        // Status
        const statusColor = report.user?.isActive ? greenSuccess : redAlert;
        const statusText = report.user?.isActive ? 'ACTIVO' : 'INACTIVO';
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.rect(pageWidth - margin - 60, yPosition + 10, 50, 15, 'F');
        addText(statusText, pageWidth - margin - 50, yPosition + 20, 10, 'bold', [255, 255, 255]);

        yPosition += 55;

        // Risk Assessment Section
        checkPageBreak(60);
        yPosition = addSection('EVALUACION DE RIESGO', yPosition);

        doc.setFillColor(248, 248, 248);
        doc.rect(margin, yPosition, pageWidth - margin * 2, 50, 'F');

        // Risk score circle
        const riskColors = {
            low: greenSuccess,
            medium: yellowWarning,
            high: [243, 156, 18],
            critical: redAlert
        };
        const riskColor = riskColors[report.riskAssessment?.level as keyof typeof riskColors] || greenSuccess;

        doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
        doc.circle(margin + 30, yPosition + 25, 15, 'F');

        // Score text
        addText((report.riskAssessment?.score || 0).toString(), margin + 25, yPosition + 30, 16, 'bold', [255, 255, 255]);

        // Risk details
        addText(`Nivel de Riesgo: ${(report.riskAssessment?.level || 'low').toUpperCase()}`, margin + 60, yPosition + 15, 12, 'bold');
        addText(`Warnings Activos: ${report.riskAssessment?.factors?.activeWarnings || 0}`, margin + 60, yPosition + 25, 10, 'normal');
        addText(`Warnings Críticos: ${report.riskAssessment?.factors?.criticalWarnings || 0}`, margin + 60, yPosition + 33, 10, 'normal');
        addText(`Total de Notas: ${report.riskAssessment?.factors?.totalNotes || 0}`, margin + 60, yPosition + 41, 10, 'normal');

        yPosition += 60;

        // Activity Summary Section
        checkPageBreak(50);
        yPosition = addSection('RESUMEN DE ACTIVIDAD', yPosition);

        const metrics = [
            { label: 'Enlaces', value: report.activity?.linksCount || 0 },
            { label: 'Clics', value: report.activity?.totalClicks || 0 },
            { label: 'Días Activo', value: report.summary?.accountAge || 0 },
            { label: 'Interacciones', value: report.summary?.totalInteractions || 0 }
        ];

        const boxWidth = (pageWidth - margin * 2 - 30) / 4;
        metrics.forEach((metric, index) => {
            const x = margin + (boxWidth + 10) * index;

            doc.setFillColor(245, 245, 245);
            doc.setDrawColor(200, 200, 200);
            doc.rect(x, yPosition, boxWidth, 25, 'FD');

            addText(metric.value.toString(), x + boxWidth / 2 - 10, yPosition + 12, 14, 'bold', primaryBlue);
            addText(metric.label, x + 5, yPosition + 20, 8, 'normal', darkGray);
        });

        yPosition += 35;

        // Notes Section
        if (report.notes && report.notes.total > 0) {
            checkPageBreak(60);
            yPosition = addSection(`NOTAS (${report.notes.total})`, yPosition);

            (report.notes.items || []).slice(0, 5).forEach((note) => {
                checkPageBreak(20);

                doc.setFillColor(252, 252, 252);
                doc.setDrawColor(220, 220, 220);
                doc.rect(margin, yPosition, pageWidth - margin * 2, 18, 'FD');

                addText(`${formatDate(note.createdAt)} - ${note.category || 'General'}`, margin + 5, yPosition + 8, 9, 'bold', darkGray);

                const noteText = note.content && note.content.length > 80 ? note.content.substring(0, 80) + '...' : (note.content || 'Sin contenido');
                addText(noteText, margin + 5, yPosition + 15, 8, 'normal', [60, 60, 60]);

                yPosition += 22;
            });

            if (report.notes.total > 5) {
                addText(`... y ${report.notes.total - 5} notas adicionales`, margin, yPosition, 9, 'italic', lightGray);
                yPosition += 15;
            }
        }

        // Warnings Section
        if (report.warnings && report.warnings.total > 0) {
            checkPageBreak(60);
            yPosition = addSection(`WARNINGS (${report.warnings.total})`, yPosition);

            (report.warnings.items || []).slice(0, 5).forEach((warning) => {
                checkPageBreak(20);

                const severityColors = {
                    low: [52, 152, 219],
                    medium: yellowWarning,
                    high: [243, 156, 18],
                    critical: redAlert
                };
                const warningColor = severityColors[warning.severity as keyof typeof severityColors] || [100, 100, 100];

                doc.setFillColor(252, 252, 252);
                doc.setDrawColor(220, 220, 220);
                doc.rect(margin, yPosition, pageWidth - margin * 2, 18, 'FD');

                // Severity indicator
                doc.setFillColor(warningColor[0], warningColor[1], warningColor[2]);
                doc.rect(margin, yPosition, 3, 18, 'F');

                addText(`${formatDate(warning.createdAt)} - ${warning.severity.toUpperCase()}`, margin + 8, yPosition + 8, 9, 'bold', darkGray);

                // Status
                const statusBadgeColor = warning.isActive ? redAlert : greenSuccess;
                doc.setFillColor(statusBadgeColor[0], statusBadgeColor[1], statusBadgeColor[2]);
                doc.rect(pageWidth - margin - 45, yPosition + 2, 35, 8, 'F');
                addText(warning.isActive ? 'ACTIVO' : 'RESUELTO', pageWidth - margin - 40, yPosition + 7, 7, 'bold', [255, 255, 255]);

                const warningText = warning.reason && warning.reason.length > 70 ? warning.reason.substring(0, 70) + '...' : (warning.reason || 'Sin descripción');
                addText(warningText, margin + 8, yPosition + 15, 8, 'normal', [60, 60, 60]);

                yPosition += 22;
            });

            if (report.warnings.total > 5) {
                addText(`... y ${report.warnings.total - 5} warnings adicionales`, margin, yPosition, 9, 'italic', lightGray);
                yPosition += 15;
            }
        }

        // Add footer to all pages
        const totalPages = (doc as any).getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooter();
        }

        // Generate filename
        const username = report.user?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'user';
        const userId = report.user?._id?.substring(0, 8) || 'unknown';
        const date = new Date().toISOString().split('T')[0];
        const filename = `report-${username}-${userId}-${date}.pdf`;

        doc.save(filename);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
            case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
            default: return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600';
            case 'high': return 'text-orange-600';
            case 'medium': return 'text-yellow-600';
            default: return 'text-blue-600';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <User className="h-6 w-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Reporte de Usuario
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {userName || userEmail}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleExport('csv')}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                        >
                            <Download className="w-4 h-4 mr-1" />
                            CSV
                        </button>
                        <button
                            onClick={() => handleExport('json')}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"
                        >
                            <FileJson className="w-4 h-4 mr-1" />
                            JSON
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                        >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Filtrar por fecha:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <span className="text-sm text-gray-500">hasta</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        {(dateFrom || dateTo) && (
                            <button
                                onClick={() => {
                                    setDateFrom('');
                                    setDateTo('');
                                }}
                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <p className="text-red-600 dark:text-red-400">{error}</p>
                                <button
                                    onClick={fetchUserReport}
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    ) : report ? (
                        <div className="flex flex-col h-full">
                            {/* Tabs */}
                            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex space-x-1 overflow-x-auto">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${activeTab === 'overview'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <BarChart3 className="w-4 h-4 inline mr-1" />
                                        Resumen
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('activity')}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${activeTab === 'activity'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <TrendingUp className="w-4 h-4 inline mr-1" />
                                        Actividad
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('notes')}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${activeTab === 'notes'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <FileText className="w-4 h-4 inline mr-1" />
                                        Notas ({report.notes.total})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('warnings')}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${activeTab === 'warnings'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                                        Warnings ({report.warnings.total})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('actions')}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${activeTab === 'actions'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Activity className="w-4 h-4 inline mr-1" />
                                        Acciones ({report.adminActions.total})
                                    </button>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* User Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                                    Información del Usuario
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                                        <span className="text-gray-900 dark:text-white">{report.user.email}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                                                        <span className="text-gray-900 dark:text-white">{report.user.name || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Rol:</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${report.user.role === 'admin'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                                            }`}>
                                                            {report.user.role === 'admin' ? 'Admin' : 'Usuario'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${report.user.isActive
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}>
                                                            {report.user.isActive ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Registro:</span>
                                                        <span className="text-gray-900 dark:text-white">{formatDate(report.user.createdAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Último acceso:</span>
                                                        <span className="text-gray-900 dark:text-white">
                                                            {report.user.lastLogin ? formatDate(report.user.lastLogin) : 'Nunca'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                                    Evaluación de Riesgo
                                                </h3>
                                                <div className="text-center mb-4">
                                                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getRiskLevelColor(report.riskAssessment.level)}`}>
                                                        <Shield className="w-5 h-5 mr-2" />
                                                        {report.riskAssessment.level.toUpperCase()}
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                                        {report.riskAssessment.score} puntos
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Warnings activos:</span>
                                                        <span className="text-gray-900 dark:text-white">{report.riskAssessment.factors.activeWarnings}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Warnings críticos:</span>
                                                        <span className="text-gray-900 dark:text-white">{report.riskAssessment.factors.criticalWarnings}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Total notas:</span>
                                                        <span className="text-gray-900 dark:text-white">{report.riskAssessment.factors.totalNotes}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Actividad reciente:</span>
                                                        <span className="text-gray-900 dark:text-white">{report.riskAssessment.factors.recentActivity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activity Summary */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {report.activity.linksCount}
                                                </div>
                                                <div className="text-sm text-blue-700 dark:text-blue-300">Enlaces creados</div>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {report.activity.totalClicks}
                                                </div>
                                                <div className="text-sm text-green-700 dark:text-green-300">Clics totales</div>
                                            </div>
                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                                    {report.summary.accountAge}
                                                </div>
                                                <div className="text-sm text-yellow-700 dark:text-yellow-300">Días de cuenta</div>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                    {report.summary.totalInteractions}
                                                </div>
                                                <div className="text-sm text-purple-700 dark:text-purple-300">Interacciones admin</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            Enlaces Creados ({report.activity.linksCount})
                                        </h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {report.activity.links.map((link) => (
                                                <div key={link._id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {link.title || link.shortCode}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {link.originalUrl}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatDate(link.createdAt)}
                                                            </div>
                                                            <div className={`text-xs px-2 py-1 rounded ${link.isActive
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                }`}>
                                                                {link.isActive ? 'Activo' : 'Inactivo'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notes' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                Notas ({report.notes.total})
                                            </h3>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Por categoría: {Object.entries(report.notes.byCategory).map(([cat, count]) =>
                                                    `${cat}: ${count}`
                                                ).join(', ')}
                                            </div>
                                        </div>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {report.notes.items.map((note) => (
                                                <div key={note._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                            {note.category && (
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded">
                                                                    {note.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(note.createdAt)}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-900 dark:text-white mb-2">
                                                        {note.content}
                                                    </div>
                                                    {note.author && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Por: {note.author.name || note.author.email}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'warnings' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                Warnings ({report.warnings.total})
                                            </h3>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Activos: {report.warnings.active} | Resueltos: {report.warnings.resolved}
                                            </div>
                                        </div>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {report.warnings.items.map((warning) => (
                                                <div key={warning._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <AlertTriangle className={`w-4 h-4 ${getSeverityColor(warning.severity)}`} />
                                                            <span className={`px-2 py-1 text-xs rounded ${warning.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                warning.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                                                    warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                }`}>
                                                                {warning.severity}
                                                            </span>
                                                            {warning.category && (
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200 text-xs rounded">
                                                                    {warning.category}
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-1 text-xs rounded ${warning.isActive
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                }`}>
                                                                {warning.isActive ? 'Activo' : 'Resuelto'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(warning.createdAt)}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-900 dark:text-white mb-2">
                                                        {warning.reason}
                                                    </div>
                                                    {warning.resolutionNotes && (
                                                        <div className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                                            Resolución: {warning.resolutionNotes}
                                                        </div>
                                                    )}
                                                    {warning.author && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                            Por: {warning.author.name || warning.author.email}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'actions' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            Acciones Administrativas ({report.adminActions.total})
                                        </h3>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {report.adminActions.items.map((action) => (
                                                <div key={action._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Activity className="w-4 h-4 text-purple-600" />
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs rounded">
                                                                {action.actionType}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(action.createdAt)}
                                                        </div>
                                                    </div>
                                                    {action.reason && (
                                                        <div className="text-sm text-gray-900 dark:text-white mb-2">
                                                            {action.reason}
                                                        </div>
                                                    )}
                                                    {action.admin && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Por: {action.admin.name || action.admin.email}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}