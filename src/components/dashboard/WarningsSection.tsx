'use client';

import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    Plus,
    Edit2,
    Trash2,
    Search,
    Filter,
    Calendar,
    User,
    AlertCircle,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    History,
    MoreVertical,
    CheckCircle,
    Clock,
    Shield
} from 'lucide-react';

interface UserWarning {
    _id: string;
    userId: string;
    authorId: string;
    authorName: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'behavior' | 'technical' | 'legal' | 'spam' | 'abuse' | 'other';
    isActive: boolean;
    resolvedAt?: string;
    resolvedBy?: string;
    resolvedByName?: string;
    resolutionNotes?: string;
    isDeleted: boolean;
    editHistory: {
        editedAt: string;
        editedBy: string;
        editedByName: string;
        previousData: {
            title: string;
            description: string;
            severity: string;
            category: string;
        };
    }[];
    createdAt: string;
    updatedAt: string;
}

interface WarningsResponse {
    warnings: UserWarning[];
    totalWarnings: number;
    totalPages: number;
    currentPage: number;
}

interface WarningsSectionProps {
    userId: string;
    onWarningsCountChange?: (activeCount: number, criticalCount: number) => void;
}

type SeverityType = 'low' | 'medium' | 'high' | 'critical';
type CategoryType = 'behavior' | 'technical' | 'legal' | 'spam' | 'abuse' | 'other';
type StatusFilter = 'all' | 'active' | 'resolved';

const severityLabels: Record<SeverityType, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica'
};

const severityColors: Record<SeverityType, string> = {
    low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200',
    medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200',
    critical: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100 border-red-300 animate-pulse'
};

const categoryLabels: Record<CategoryType, string> = {
    behavior: 'Comportamiento',
    technical: 'Técnico',
    legal: 'Legal',
    spam: 'Spam',
    abuse: 'Abuso',
    other: 'Otro'
};

const categoryColors: Record<CategoryType, string> = {
    behavior: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    technical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    legal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    spam: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    abuse: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};

export default function WarningsSection({ userId, onWarningsCountChange }: WarningsSectionProps) {
    const [warnings, setWarnings] = useState<UserWarning[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalWarnings, setTotalWarnings] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState<SeverityType | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingWarning, setEditingWarning] = useState<UserWarning | null>(null);
    const [deletingWarning, setDeletingWarning] = useState<UserWarning | null>(null);
    const [resolvingWarning, setResolvingWarning] = useState<UserWarning | null>(null);
    const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(new Set());
    const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

    // Form states
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formSeverity, setFormSeverity] = useState<SeverityType>('low');
    const [formCategory, setFormCategory] = useState<CategoryType>('other');
    const [formLoading, setFormLoading] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');

    const limit = 10;

    useEffect(() => {
        fetchWarnings();
    }, [userId, currentPage, selectedSeverity, selectedCategory, statusFilter]);

    useEffect(() => {
        const activeWarnings = warnings.filter(w => w.isActive);
        const criticalWarnings = activeWarnings.filter(w => w.severity === 'critical');
        onWarningsCountChange?.(activeWarnings.length, criticalWarnings.length);
    }, [warnings, onWarningsCountChange]);

    const fetchWarnings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
                ...(selectedSeverity !== 'all' && { severity: selectedSeverity }),
                ...(selectedCategory !== 'all' && { category: selectedCategory }),
                ...(statusFilter !== 'all' && { isActive: (statusFilter === 'active').toString() })
            });

            const response = await fetch(`/api/admin/users/${userId}/warnings?${params}`);
            const data = await response.json();

            if (data.success) {
                setWarnings(data.data.warnings);
                setTotalWarnings(data.data.totalWarnings);
                setTotalPages(data.data.totalPages);
            } else {
                console.error('Error fetching warnings:', data.error);
            }
        } catch (error) {
            console.error('Error fetching warnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWarning = async () => {
        if (!formTitle.trim() || !formDescription.trim()) return;

        try {
            setFormLoading(true);
            const response = await fetch(`/api/admin/users/${userId}/warnings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formTitle.trim(),
                    description: formDescription.trim(),
                    severity: formSeverity,
                    category: formCategory
                })
            });

            const data = await response.json();

            if (data.success) {
                resetForm();
                setShowAddForm(false);
                fetchWarnings();
            } else {
                console.error('Error adding warning:', data.error);
            }
        } catch (error) {
            console.error('Error adding warning:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditWarning = async () => {
        if (!editingWarning || !formTitle.trim() || !formDescription.trim()) return;

        try {
            setFormLoading(true);
            const response = await fetch(`/api/admin/warnings/${editingWarning._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formTitle.trim(),
                    description: formDescription.trim(),
                    severity: formSeverity,
                    category: formCategory
                })
            });

            const data = await response.json();

            if (data.success) {
                setEditingWarning(null);
                resetForm();
                fetchWarnings();
            } else {
                console.error('Error editing warning:', data.error);
            }
        } catch (error) {
            console.error('Error editing warning:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleResolveWarning = async () => {
        if (!resolvingWarning || !resolutionNotes.trim()) return;

        try {
            setFormLoading(true);
            const response = await fetch(`/api/admin/warnings/${resolvingWarning._id}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resolutionNotes: resolutionNotes.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                setResolvingWarning(null);
                setResolutionNotes('');
                fetchWarnings();
            } else {
                console.error('Error resolving warning:', data.error);
            }
        } catch (error) {
            console.error('Error resolving warning:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteWarning = async () => {
        if (!deletingWarning) return;

        try {
            const response = await fetch(`/api/admin/warnings/${deletingWarning._id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                setDeletingWarning(null);
                fetchWarnings();
            } else {
                console.error('Error deleting warning:', data.error);
            }
        } catch (error) {
            console.error('Error deleting warning:', error);
        }
    };

    const startEdit = (warning: UserWarning) => {
        setEditingWarning(warning);
        setFormTitle(warning.title);
        setFormDescription(warning.description);
        setFormSeverity(warning.severity);
        setFormCategory(warning.category);
        setShowAddForm(false);
    };

    const resetForm = () => {
        setFormTitle('');
        setFormDescription('');
        setFormSeverity('low');
        setFormCategory('other');
    };

    const cancelEdit = () => {
        setEditingWarning(null);
        resetForm();
    };

    const toggleWarningExpansion = (warningId: string) => {
        const newExpanded = new Set(expandedWarnings);
        if (newExpanded.has(warningId)) {
            newExpanded.delete(warningId);
        } else {
            newExpanded.add(warningId);
        }
        setExpandedWarnings(newExpanded);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredWarnings = warnings.filter(warning =>
        warning.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warning.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warning.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderWarningForm = () => (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Severidad
                        </label>
                        <select
                            value={formSeverity}
                            onChange={(e) => setFormSeverity(e.target.value as SeverityType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        >
                            {Object.entries(severityLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Categoría
                        </label>
                        <select
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value as CategoryType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        >
                            {Object.entries(categoryLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Título del warning
                    </label>
                    <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Título breve del warning"
                        maxLength={200}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formTitle.length}/200 caracteres
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción detallada
                    </label>
                    <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Describe el motivo del warning..."
                        rows={4}
                        maxLength={1000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formDescription.length}/1000 caracteres
                    </p>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={editingWarning ? cancelEdit : () => setShowAddForm(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={editingWarning ? handleEditWarning : handleAddWarning}
                        disabled={!formTitle.trim() || !formDescription.trim() || formLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {formLoading ? 'Guardando...' : editingWarning ? 'Actualizar' : 'Crear Warning'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Warnings del Usuario
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''} total{totalWarnings !== 1 ? 'es' : ''}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setEditingWarning(null);
                        resetForm();
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Crear Warning
                </button>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar en warnings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="resolved">Resueltos</option>
                    </select>
                    <select
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value as SeverityType | 'all')}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    >
                        <option value="all">Todas las severidades</option>
                        {Object.entries(severityLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as CategoryType | 'all')}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    >
                        <option value="all">Todas las categorías</option>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Add/Edit form */}
            {(showAddForm || editingWarning) && renderWarningForm()}

            {/* Warnings list */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando warnings...</p>
                </div>
            ) : filteredWarnings.length === 0 ? (
                <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || selectedSeverity !== 'all' || selectedCategory !== 'all' || statusFilter !== 'all'
                            ? 'No se encontraron warnings con los filtros aplicados'
                            : 'No hay warnings para este usuario'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredWarnings.map((warning) => {
                        const isExpanded = expandedWarnings.has(warning._id);
                        const showHistory = showHistoryFor === warning._id;
                        const hasHistory = warning.editHistory.length > 0;

                        return (
                            <div
                                key={warning._id}
                                className={`bg-white dark:bg-gray-800 border rounded-lg p-4 ${warning.severity === 'critical'
                                        ? 'border-red-300 dark:border-red-600 shadow-red-100 dark:shadow-red-900/20'
                                        : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                {/* Warning header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${severityColors[warning.severity]}`}>
                                            <AlertTriangle className="w-3 h-3 mr-1 inline" />
                                            {severityLabels[warning.severity]}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[warning.category]}`}>
                                            {categoryLabels[warning.category]}
                                        </span>
                                        {!warning.isActive && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                <CheckCircle className="w-3 h-3 mr-1 inline" />
                                                Resuelto
                                            </span>
                                        )}
                                        {hasHistory && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                <History className="w-3 h-3 mr-1" />
                                                Editado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {warning.isActive && (
                                            <button
                                                onClick={() => setResolvingWarning(warning)}
                                                className="text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                                title="Resolver warning"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => startEdit(warning)}
                                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                            title="Editar warning"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingWarning(warning)}
                                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                            title="Eliminar warning"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {hasHistory && (
                                            <button
                                                onClick={() => setShowHistoryFor(showHistory ? null : warning._id)}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                title="Ver historial"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Warning content */}
                                <div className="mb-3">
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        {warning.title}
                                    </h4>
                                    <p className={`text-gray-700 dark:text-gray-300 ${warning.description.length > 300 && !isExpanded ? 'line-clamp-3' : ''}`}>
                                        {warning.description}
                                    </p>
                                    {warning.description.length > 300 && (
                                        <button
                                            onClick={() => toggleWarningExpansion(warning._id)}
                                            className="text-blue-600 dark:text-blue-400 text-sm mt-2 flex items-center hover:underline"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp className="w-4 h-4 mr-1" />
                                                    Ver menos
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-4 h-4 mr-1" />
                                                    Ver más
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Resolution info */}
                                {!warning.isActive && warning.resolvedAt && (
                                    <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="flex items-center mb-2">
                                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                                Resuelto por {warning.resolvedByName} el {formatDate(warning.resolvedAt)}
                                            </span>
                                        </div>
                                        {warning.resolutionNotes && (
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {warning.resolutionNotes}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Warning metadata */}
                                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-1" />
                                            {warning.authorName}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {formatDate(warning.createdAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Edit history */}
                                {showHistory && hasHistory && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                            Historial de ediciones
                                        </h4>
                                        <div className="space-y-3">
                                            {warning.editHistory.map((edit, index) => (
                                                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {edit.editedByName}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(edit.editedAt)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                                        <p><strong>Título:</strong> {edit.previousData.title}</p>
                                                        <p><strong>Descripción:</strong> {edit.previousData.description}</p>
                                                        <p><strong>Severidad:</strong> {severityLabels[edit.previousData.severity as SeverityType]}</p>
                                                        <p><strong>Categoría:</strong> {categoryLabels[edit.previousData.category as CategoryType]}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Mostrando {((currentPage - 1) * limit) + 1} a {Math.min(currentPage * limit, totalWarnings)} de {totalWarnings} warnings
                    </p>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {/* Resolve warning modal */}
            {resolvingWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center mb-4">
                            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Resolver Warning
                            </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            ¿Estás seguro de que quieres resolver este warning? Proporciona notas sobre la resolución.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Notas de resolución
                            </label>
                            <textarea
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="Describe cómo se resolvió el warning..."
                                rows={3}
                                maxLength={1000}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {resolutionNotes.length}/1000 caracteres
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setResolvingWarning(null);
                                    setResolutionNotes('');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResolveWarning}
                                disabled={!resolutionNotes.trim() || formLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {formLoading ? 'Resolviendo...' : 'Resolver'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deletingWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Confirmar eliminación
                            </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            ¿Estás seguro de que quieres eliminar este warning? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeletingWarning(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteWarning}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}