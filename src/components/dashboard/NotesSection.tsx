'use client';

import React, { useState, useEffect } from 'react';
import {
    FileText,
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
    MoreVertical
} from 'lucide-react';

interface UserNote {
    _id: string;
    userId: string;
    authorId: string;
    authorName: string;
    content: string;
    category: 'behavior' | 'technical' | 'legal' | 'other';
    isDeleted: boolean;
    editHistory: {
        editedAt: string;
        editedBy: string;
        editedByName: string;
        previousContent: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

interface NotesResponse {
    notes: UserNote[];
    totalNotes: number;
    totalPages: number;
    currentPage: number;
}

interface NotesSectionProps {
    userId: string;
    onNotesCountChange?: (count: number) => void;
}

type CategoryType = 'behavior' | 'technical' | 'legal' | 'other';

const categoryLabels: Record<CategoryType, string> = {
    behavior: 'Comportamiento',
    technical: 'Técnico',
    legal: 'Legal',
    other: 'Otro'
};

const categoryColors: Record<CategoryType, string> = {
    behavior: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    technical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    legal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};

export default function NotesSection({ userId, onNotesCountChange }: NotesSectionProps) {
    const [notes, setNotes] = useState<UserNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalNotes, setTotalNotes] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingNote, setEditingNote] = useState<UserNote | null>(null);
    const [deletingNote, setDeletingNote] = useState<UserNote | null>(null);
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
    const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

    // Form states
    const [formContent, setFormContent] = useState('');
    const [formCategory, setFormCategory] = useState<CategoryType>('other');
    const [formLoading, setFormLoading] = useState(false);

    const limit = 10;

    useEffect(() => {
        fetchNotes();
    }, [userId, currentPage, selectedCategory]);

    useEffect(() => {
        onNotesCountChange?.(totalNotes);
    }, [totalNotes, onNotesCountChange]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
                ...(selectedCategory !== 'all' && { category: selectedCategory })
            });

            const response = await fetch(`/api/admin/users/${userId}/notes?${params}`);
            const data = await response.json();

            if (data.success) {
                setNotes(data.data.notes);
                setTotalNotes(data.data.totalNotes);
                setTotalPages(data.data.totalPages);
            } else {
                console.error('Error fetching notes:', data.error);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!formContent.trim()) return;

        try {
            setFormLoading(true);
            const response = await fetch(`/api/admin/users/${userId}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: formContent.trim(),
                    category: formCategory
                })
            });

            const data = await response.json();

            if (data.success) {
                setFormContent('');
                setFormCategory('other');
                setShowAddForm(false);
                fetchNotes();
            } else {
                console.error('Error adding note:', data.error);
            }
        } catch (error) {
            console.error('Error adding note:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditNote = async () => {
        if (!editingNote || !formContent.trim()) return;

        try {
            setFormLoading(true);
            const response = await fetch(`/api/admin/notes/${editingNote._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: formContent.trim(),
                    category: formCategory
                })
            });

            const data = await response.json();

            if (data.success) {
                setEditingNote(null);
                setFormContent('');
                setFormCategory('other');
                fetchNotes();
            } else {
                console.error('Error editing note:', data.error);
            }
        } catch (error) {
            console.error('Error editing note:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteNote = async () => {
        if (!deletingNote) return;

        try {
            const response = await fetch(`/api/admin/notes/${deletingNote._id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                setDeletingNote(null);
                fetchNotes();
            } else {
                console.error('Error deleting note:', data.error);
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const startEdit = (note: UserNote) => {
        setEditingNote(note);
        setFormContent(note.content);
        setFormCategory(note.category);
        setShowAddForm(false);
    };

    const cancelEdit = () => {
        setEditingNote(null);
        setFormContent('');
        setFormCategory('other');
    };

    const toggleNoteExpansion = (noteId: string) => {
        const newExpanded = new Set(expandedNotes);
        if (newExpanded.has(noteId)) {
            newExpanded.delete(noteId);
        } else {
            newExpanded.add(noteId);
        }
        setExpandedNotes(newExpanded);
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

    const filteredNotes = notes.filter(note =>
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderNoteForm = () => (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
            <div className="space-y-4">
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contenido de la nota
                    </label>
                    <textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Escribe la nota aquí..."
                        rows={4}
                        maxLength={2000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formContent.length}/2000 caracteres
                    </p>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={editingNote ? cancelEdit : () => setShowAddForm(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={editingNote ? handleEditNote : handleAddNote}
                        disabled={!formContent.trim() || formLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {formLoading ? 'Guardando...' : editingNote ? 'Actualizar' : 'Agregar'}
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
                        Notas del Usuario
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {totalNotes} nota{totalNotes !== 1 ? 's' : ''} total{totalNotes !== 1 ? 'es' : ''}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setEditingNote(null);
                        setFormContent('');
                        setFormCategory('other');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Nota
                </button>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar en notas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
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
            {(showAddForm || editingNote) && renderNoteForm()}

            {/* Notes list */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando notas...</p>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || selectedCategory !== 'all'
                            ? 'No se encontraron notas con los filtros aplicados'
                            : 'No hay notas para este usuario'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotes.map((note) => {
                        const isExpanded = expandedNotes.has(note._id);
                        const showHistory = showHistoryFor === note._id;
                        const hasHistory = note.editHistory.length > 0;

                        return (
                            <div
                                key={note._id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                            >
                                {/* Note header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[note.category]}`}>
                                            {categoryLabels[note.category]}
                                        </span>
                                        {hasHistory && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                <History className="w-3 h-3 mr-1" />
                                                Editado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => startEdit(note)}
                                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingNote(note)}
                                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {hasHistory && (
                                            <button
                                                onClick={() => setShowHistoryFor(showHistory ? null : note._id)}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Note content */}
                                <div className="mb-3">
                                    <p className={`text-gray-900 dark:text-white ${note.content.length > 200 && !isExpanded ? 'line-clamp-3' : ''}`}>
                                        {note.content}
                                    </p>
                                    {note.content.length > 200 && (
                                        <button
                                            onClick={() => toggleNoteExpansion(note._id)}
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

                                {/* Note metadata */}
                                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-1" />
                                            {note.authorName}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {formatDate(note.createdAt)}
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
                                            {note.editHistory.map((edit, index) => (
                                                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {edit.editedByName}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(edit.editedAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {edit.previousContent}
                                                    </p>
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
                        Mostrando {((currentPage - 1) * limit) + 1} a {Math.min(currentPage * limit, totalNotes)} de {totalNotes} notas
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

            {/* Delete confirmation modal */}
            {deletingNote && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Confirmar eliminación
                            </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            ¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeletingNote(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteNote}
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