'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Edit3,
  Shield,
  ShieldCheck,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  AlertTriangle,
  AlertCircle,
  FileText,
  Eye,
  ExternalLink,
  RefreshCw,
  BarChart3,
  Download,
  Trash2,
} from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import ReportsAnalytics from './ReportsAnalytics';
import UserReportModal from './UserReportModal';

interface AdminUser {
  _id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  linksCount: number;
  totalClicks: number;
  notesCount: number;
  activeWarningsCount: number;
  criticalWarningsCount: number;
  highestWarningSeverity?: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  hasPendingDeletionRequest?: boolean;
  deletionRequestStatus?: 'pending' | 'scheduled' | 'cancelled' | 'completed';
}

interface UsersListResponse {
  users: AdminUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}

interface UserManagementProps {
  onClose?: () => void;
}

export default function UserManagement({ onClose }: UserManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [hasNotesFilter, setHasNotesFilter] = useState(false);
  const [hasWarningsFilter, setHasWarningsFilter] = useState(false);
  const [warningSeverityFilter, setWarningSeverityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState<AdminUser | null>(
    null
  );

  // Enhanced filtering states
  const [searchInNotes, setSearchInNotes] = useState(false);
  const [searchInWarnings, setSearchInWarnings] = useState(false);
  const [registrationDateFrom, setRegistrationDateFrom] = useState('');
  const [registrationDateTo, setRegistrationDateTo] = useState('');
  const [lastActivityFrom, setLastActivityFrom] = useState('');
  const [lastActivityTo, setLastActivityTo] = useState('');
  const [minRiskScore, setMinRiskScore] = useState('');
  const [maxRiskScore, setMaxRiskScore] = useState('');
  const [warningCountMin, setWarningCountMin] = useState('');
  const [warningCountMax, setWarningCountMax] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [filterPresetName, setFilterPresetName] = useState('');

  // Reports and analytics states
  const [showReportsAnalytics, setShowReportsAnalytics] = useState(false);
  const [showUserReport, setShowUserReport] = useState<AdminUser | null>(null);

  // Delete user states
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<AdminUser | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    roleFilter,
    hasNotesFilter,
    hasWarningsFilter,
    warningSeverityFilter,
    sortBy,
    sortOrder,
    searchInNotes,
    searchInWarnings,
    registrationDateFrom,
    registrationDateTo,
    lastActivityFrom,
    lastActivityTo,
    minRiskScore,
    maxRiskScore,
    warningCountMin,
    warningCountMax,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [
    currentPage,
    debouncedSearchTerm,
    roleFilter,
    hasNotesFilter,
    hasWarningsFilter,
    warningSeverityFilter,
    sortBy,
    sortOrder,
    searchInNotes,
    searchInWarnings,
    registrationDateFrom,
    registrationDateTo,
    lastActivityFrom,
    lastActivityTo,
    minRiskScore,
    maxRiskScore,
    warningCountMin,
    warningCountMax,
  ]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(hasNotesFilter && { hasNotes: 'true' }),
        ...(hasWarningsFilter && { hasWarnings: 'true' }),
        ...(warningSeverityFilter && {
          warningSeverity: warningSeverityFilter,
        }),
        ...(searchInNotes && { searchInNotes: 'true' }),
        ...(searchInWarnings && { searchInWarnings: 'true' }),
        ...(registrationDateFrom && { registrationDateFrom }),
        ...(registrationDateTo && { registrationDateTo }),
        ...(lastActivityFrom && { lastActivityFrom }),
        ...(lastActivityTo && { lastActivityTo }),
        ...(minRiskScore && { minRiskScore }),
        ...(maxRiskScore && { maxRiskScore }),
        ...(warningCountMin && { warningCountMin }),
        ...(warningCountMax && { warningCountMax }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const users = data.data.users;
          // Ordenar usuarios por estado de solicitud de eliminación: pending < confirmed < cancelled
          const statusOrder: Record<string, number> = {
            pending: 1,
            confirmed: 2,
            cancelled: 3,
            completed: 4,
          };
          const sortedUsers = users.sort((a: AdminUser, b: AdminUser) => {
            // Si ambos tienen solicitudes de eliminación, ordenar por estado
            if (a.hasPendingDeletionRequest && b.hasPendingDeletionRequest) {
              const aStatus = a.deletionRequestStatus || 'pending';
              const bStatus = b.deletionRequestStatus || 'pending';
              return statusOrder[aStatus] - statusOrder[bStatus];
            }
            // Los usuarios con solicitudes van primero
            if (a.hasPendingDeletionRequest && !b.hasPendingDeletionRequest)
              return -1;
            if (!a.hasPendingDeletionRequest && b.hasPendingDeletionRequest)
              return 1;
            // Si ninguno tiene solicitudes, mantener orden original
            return 0;
          });
          setUsers(sortedUsers);
          setTotalPages(data.data.totalPages);
          setTotalUsers(data.data.totalUsers);
        } else {
          setError(data.error?.message || 'Error al cargar usuarios');
        }
      } else {
        setError('Error al conectar con el servidor');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error inesperado al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (
    userId: string,
    updates: { role?: string; isActive?: boolean }
  ) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updates,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setUsers(
            users.map(user =>
              user._id === userId
                ? ({ ...user, ...updates } as AdminUser)
                : user
            )
          );
          setShowEditModal(false);
          setEditingUser(null);
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUserRequest = async (user: AdminUser) => {
    if (!deleteReason.trim()) {
      alert('Por favor, proporciona una razón para la eliminación.');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/users/delete-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          reason: deleteReason,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(
            'Se ha enviado un enlace de confirmación al email del administrador.'
          );
          setShowDeleteConfirmation(null);
          setDeleteReason('');
        } else {
          alert(data.error?.message || 'Error al solicitar eliminación');
        }
      } else {
        alert('Error al conectar con el servidor');
      }
    } catch (error) {
      console.error('Error requesting user deletion:', error);
      alert('Error inesperado al solicitar eliminación');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        <ShieldCheck className="w-3 h-3 mr-1" />
        Admin
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
        <Shield className="w-3 h-3 mr-1" />
        Usuario
      </span>
    );
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? (
      <ShieldCheck
        className="w-4 h-4 text-purple-600 dark:text-purple-400"
        aria-label="Administrador"
      />
    ) : (
      <Shield
        className="w-4 h-4 text-gray-500 dark:text-gray-400"
        aria-label="Usuario"
      />
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <UserCheck className="w-3 h-3 mr-1" />
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <UserX className="w-3 h-3 mr-1" />
        Inactivo
      </span>
    );
  };

  const getWarningSeverityBadge = (
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    const severityConfig = {
      low: {
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: AlertCircle,
        text: 'Bajo',
      },
      medium: {
        color:
          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        icon: AlertTriangle,
        text: 'Medio',
      },
      high: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: AlertTriangle,
        text: 'Alto',
      },
      critical: {
        color: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
        icon: AlertTriangle,
        text: 'Crítico',
      },
    };

    const config = severityConfig[severity];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getWarningIndicators = (user: AdminUser) => {
    const indicators = [];

    if (user.notesCount > 0) {
      indicators.push(
        <span
          key="notes"
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          <FileText className="w-3 h-3 mr-1" />
          {user.notesCount} nota{user.notesCount !== 1 ? 's' : ''}
        </span>
      );
    }

    if (user.activeWarningsCount > 0) {
      indicators.push(
        <span
          key="warnings"
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          {user.activeWarningsCount} warning
          {user.activeWarningsCount !== 1 ? 's' : ''}
        </span>
      );
    }

    if (user.criticalWarningsCount > 0) {
      indicators.push(
        <span
          key="critical"
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100 animate-pulse"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          {user.criticalWarningsCount} crítico
          {user.criticalWarningsCount !== 1 ? 's' : ''}
        </span>
      );
    }

    return indicators;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gestión de Usuarios
            </h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
              {totalUsers} usuarios
            </span>
            {users.some(u => u.criticalWarningsCount > 0) && (
              <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300 animate-pulse">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {users.filter(u => u.criticalWarningsCount > 0).length} críticos
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowReportsAnalytics(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
              title="Ver reportes y analíticas"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Reportes
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              title="Actualizar lista"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {(hasNotesFilter ||
        hasWarningsFilter ||
        warningSeverityFilter ||
        searchTerm ||
        searchInNotes ||
        searchInWarnings ||
        registrationDateFrom ||
        registrationDateTo ||
        lastActivityFrom ||
        lastActivityTo ||
        minRiskScore ||
        maxRiskScore ||
        warningCountMin ||
        warningCountMax) && (
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                Filtros activos:
              </span>
              {debouncedSearchTerm && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Búsqueda: "{debouncedSearchTerm}"
                </span>
              )}
              {hasNotesFilter && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Con notas
                </span>
              )}
              {hasWarningsFilter && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Con warnings
                </span>
              )}
              {warningSeverityFilter && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Severidad: {warningSeverityFilter}
                </span>
              )}
              {searchInNotes && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Buscar en notas
                </span>
              )}
              {searchInWarnings && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Buscar en warnings
                </span>
              )}
              {(registrationDateFrom || registrationDateTo) && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Fecha registro
                </span>
              )}
              {(lastActivityFrom || lastActivityTo) && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Última actividad
                </span>
              )}
              {(minRiskScore || maxRiskScore) && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Riesgo: {minRiskScore || '0'}-{maxRiskScore || '∞'}
                </span>
              )}
              {(warningCountMin || warningCountMax) && (
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Warnings: {warningCountMin || '0'}-{warningCountMax || '∞'}
                </span>
              )}
            </div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {users.length} de {totalUsers} usuarios
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4">
          {/* First row - Search and main filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por email o nombre..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todos los roles</option>
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={e => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="createdAt-desc">Más recientes</option>
                <option value="createdAt-asc">Más antiguos</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
                <option value="linksCount-desc">Más enlaces</option>
                <option value="totalClicks-desc">Más clics</option>
                <option value="riskScore-desc">Mayor riesgo</option>
                <option value="riskScore-asc">Menor riesgo</option>
                <option value="activeWarningsCount-desc">Más warnings</option>
                <option value="activeWarningsCount-asc">Menos warnings</option>
                <option value="lastLogin-desc">Última actividad</option>
                <option value="lastLogin-asc">Actividad más antigua</option>
              </select>
            </div>
          </div>

          {/* Second row - Advanced filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Notes Filter */}
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasNotesFilter}
                  onChange={e => setHasNotesFilter(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  Con notas
                </span>
              </label>
            </div>

            {/* Warnings Filter */}
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasWarningsFilter}
                  onChange={e => setHasWarningsFilter(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Con warnings
                </span>
              </label>
            </div>

            {/* Warning Severity Filter */}
            <div className="sm:w-48">
              <select
                value={warningSeverityFilter}
                onChange={e => setWarningSeverityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todas las severidades</option>
                <option value="low">Severidad baja</option>
                <option value="medium">Severidad media</option>
                <option value="high">Severidad alta</option>
                <option value="critical">Severidad crítica</option>
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filtros avanzados
            </button>

            {/* Clear Filters */}
            {(hasNotesFilter ||
              hasWarningsFilter ||
              warningSeverityFilter ||
              searchInNotes ||
              searchInWarnings ||
              registrationDateFrom ||
              registrationDateTo ||
              lastActivityFrom ||
              lastActivityTo ||
              minRiskScore ||
              maxRiskScore ||
              warningCountMin ||
              warningCountMax) && (
              <button
                onClick={() => {
                  setHasNotesFilter(false);
                  setHasWarningsFilter(false);
                  setWarningSeverityFilter('');
                  setSearchInNotes(false);
                  setSearchInWarnings(false);
                  setRegistrationDateFrom('');
                  setRegistrationDateTo('');
                  setLastActivityFrom('');
                  setLastActivityTo('');
                  setMinRiskScore('');
                  setMaxRiskScore('');
                  setWarningCountMin('');
                  setWarningCountMax('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Filtros Avanzados
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Enhanced Search Options */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Buscar también en:
                </label>
                <div className="space-y-1">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={searchInNotes}
                      onChange={e => setSearchInNotes(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      Contenido de notas
                    </span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={searchInWarnings}
                      onChange={e => setSearchInWarnings(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      Razones de warnings
                    </span>
                  </label>
                </div>
              </div>

              {/* Registration Date Range */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Fecha de registro
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={registrationDateFrom}
                    onChange={e => setRegistrationDateFrom(e.target.value)}
                    placeholder="Desde"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                  <input
                    type="date"
                    value={registrationDateTo}
                    onChange={e => setRegistrationDateTo(e.target.value)}
                    placeholder="Hasta"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Last Activity Date Range */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Última actividad
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={lastActivityFrom}
                    onChange={e => setLastActivityFrom(e.target.value)}
                    placeholder="Desde"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                  <input
                    type="date"
                    value={lastActivityTo}
                    onChange={e => setLastActivityTo(e.target.value)}
                    placeholder="Hasta"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Risk Score Range */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Puntuación de riesgo
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={minRiskScore}
                    onChange={e => setMinRiskScore(e.target.value)}
                    placeholder="Mínimo"
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                  <input
                    type="number"
                    value={maxRiskScore}
                    onChange={e => setMaxRiskScore(e.target.value)}
                    placeholder="Máximo"
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Warning Count Range */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Número de warnings
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={warningCountMin}
                    onChange={e => setWarningCountMin(e.target.value)}
                    placeholder="Mínimo"
                    min="0"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                  <input
                    type="number"
                    value={warningCountMax}
                    onChange={e => setWarningCountMax(e.target.value)}
                    placeholder="Máximo"
                    min="0"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Filter Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Filtros guardados
                </label>
                <div className="space-y-2">
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        // Apply predefined presets
                        switch (e.target.value) {
                          case 'high-risk':
                            setMinRiskScore('10');
                            setHasWarningsFilter(true);
                            break;
                          case 'critical-warnings':
                            setWarningSeverityFilter('critical');
                            setHasWarningsFilter(true);
                            break;
                          case 'inactive-with-warnings':
                            setHasWarningsFilter(true);
                            // Note: We'd need to add an isActive filter for this to work fully
                            break;
                          case 'recent-registrations':
                            const oneWeekAgo = new Date();
                            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                            setRegistrationDateFrom(
                              oneWeekAgo.toISOString().split('T')[0]
                            );
                            break;
                          default:
                            // Check saved filters
                            const preset = savedFilters.find(
                              f => f.name === e.target.value
                            );
                            if (preset) {
                              setHasNotesFilter(preset.hasNotes || false);
                              setHasWarningsFilter(preset.hasWarnings || false);
                              setWarningSeverityFilter(
                                preset.warningSeverity || ''
                              );
                              setSearchInNotes(preset.searchInNotes || false);
                              setSearchInWarnings(
                                preset.searchInWarnings || false
                              );
                              setMinRiskScore(preset.minRiskScore || '');
                              setMaxRiskScore(preset.maxRiskScore || '');
                              setWarningCountMin(preset.warningCountMin || '');
                              setWarningCountMax(preset.warningCountMax || '');
                            }
                        }
                      }
                    }}
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">Seleccionar preset</option>
                    <option value="high-risk">Usuarios de alto riesgo</option>
                    <option value="critical-warnings">Warnings críticos</option>
                    <option value="inactive-with-warnings">
                      Inactivos con warnings
                    </option>
                    <option value="recent-registrations">
                      Registros recientes
                    </option>
                    {savedFilters.map(filter => (
                      <option key={filter.name} value={filter.name}>
                        {filter.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={filterPresetName}
                      onChange={e => setFilterPresetName(e.target.value)}
                      placeholder="Nombre del preset"
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                    <button
                      onClick={() => {
                        if (filterPresetName) {
                          // Save current filters as preset
                          const newPreset = {
                            name: filterPresetName,
                            hasNotes: hasNotesFilter,
                            hasWarnings: hasWarningsFilter,
                            warningSeverity: warningSeverityFilter,
                            searchInNotes,
                            searchInWarnings,
                            minRiskScore,
                            maxRiskScore,
                            warningCountMin,
                            warningCountMax,
                          };
                          setSavedFilters([...savedFilters, newPreset]);
                          setFilterPresetName('');
                        }
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Exportar resultados:
            </span>
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  format: 'csv',
                  ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
                  ...(roleFilter && { role: roleFilter }),
                  ...(hasNotesFilter && { hasNotes: 'true' }),
                  ...(hasWarningsFilter && { hasWarnings: 'true' }),
                  ...(warningSeverityFilter && {
                    warningSeverity: warningSeverityFilter,
                  }),
                  ...(searchInNotes && { searchInNotes: 'true' }),
                  ...(searchInWarnings && { searchInWarnings: 'true' }),
                  ...(registrationDateFrom && { registrationDateFrom }),
                  ...(registrationDateTo && { registrationDateTo }),
                  ...(lastActivityFrom && { lastActivityFrom }),
                  ...(lastActivityTo && { lastActivityTo }),
                  ...(minRiskScore && { minRiskScore }),
                  ...(maxRiskScore && { maxRiskScore }),
                  ...(warningCountMin && { warningCountMin }),
                  ...(warningCountMax && { warningCountMax }),
                });
                window.open(`/api/admin/users/export?${params}`, '_blank');
              }}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              CSV
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  format: 'json',
                  ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
                  ...(roleFilter && { role: roleFilter }),
                  ...(hasNotesFilter && { hasNotes: 'true' }),
                  ...(hasWarningsFilter && { hasWarnings: 'true' }),
                  ...(warningSeverityFilter && {
                    warningSeverity: warningSeverityFilter,
                  }),
                  ...(searchInNotes && { searchInNotes: 'true' }),
                  ...(searchInWarnings && { searchInWarnings: 'true' }),
                  ...(registrationDateFrom && { registrationDateFrom }),
                  ...(registrationDateTo && { registrationDateTo }),
                  ...(lastActivityFrom && { lastActivityFrom }),
                  ...(lastActivityTo && { lastActivityTo }),
                  ...(minRiskScore && { minRiskScore }),
                  ...(maxRiskScore && { maxRiskScore }),
                  ...(warningCountMin && { warningCountMin }),
                  ...(warningCountMax && { warningCountMax }),
                });
                window.open(`/api/admin/users/export?${params}`, '_blank');
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {debouncedSearchTerm ||
              hasNotesFilter ||
              hasWarningsFilter ||
              warningSeverityFilter
                ? 'No se encontraron usuarios con los filtros aplicados'
                : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Alertas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Eliminación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Riesgo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Enlaces
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Clics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => {
                const warningIndicators = getWarningIndicators(user);
                const hasHighPriorityWarnings =
                  user.criticalWarningsCount > 0 ||
                  user.highestWarningSeverity === 'high';
                const hasCriticalWarnings = user.criticalWarningsCount > 0;

                return (
                  <tr
                    key={user._id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      hasCriticalWarnings
                        ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                        : hasHighPriorityWarnings
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500'
                          : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || 'Sin nombre'}
                            </div>
                            <div className="ml-2">{getRoleIcon(user.role)}</div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                        {hasHighPriorityWarnings && (
                          <AlertTriangle className="ml-2 h-4 w-4 text-red-500 animate-pulse" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {warningIndicators.length > 0 ? (
                          warningIndicators
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            Sin alertas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.hasPendingDeletionRequest ? (
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.deletionRequestStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : user.deletionRequestStatus === 'scheduled'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : user.deletionRequestStatus === 'cancelled'
                                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {user.deletionRequestStatus === 'pending'
                              ? 'Pendiente'
                              : user.deletionRequestStatus === 'scheduled'
                                ? 'Programada'
                                : user.deletionRequestStatus === 'cancelled'
                                  ? 'Cancelada'
                                  : 'Programado'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          Sin solicitudes
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`text-sm font-medium ${
                            user.riskScore >= 15
                              ? 'text-red-600 dark:text-red-400'
                              : user.riskScore >= 7
                                ? 'text-orange-600 dark:text-orange-400'
                                : user.riskScore >= 3
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {user.riskScore.toFixed(1)}
                        </span>
                        {user.riskScore >= 15 && (
                          <AlertTriangle className="ml-1 h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.linksCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.totalClicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowUserProfile(user)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Ver perfil completo"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowUserReport(user)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Generar reporte de usuario"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Editar usuario"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirmation(user)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar todos los datos del usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Editar Usuario
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  value={editingUser.role}
                  onChange={e =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value as 'user' | 'admin',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={e =>
                      setEditingUser({
                        ...editingUser,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Usuario activo
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  handleUpdateUser(editingUser._id, {
                    role: editingUser.role,
                    isActive: editingUser.isActive,
                  })
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfileModal
          user={showUserProfile}
          onClose={() => setShowUserProfile(null)}
        />
      )}

      {/* Reports Analytics Modal */}
      {showReportsAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
            <ReportsAnalytics onClose={() => setShowReportsAnalytics(false)} />
          </div>
        </div>
      )}

      {/* User Report Modal */}
      {showUserReport && (
        <UserReportModal
          userId={showUserReport._id}
          userName={showUserReport.name}
          userEmail={showUserReport.email}
          isOpen={!!showUserReport}
          onClose={() => setShowUserReport(null)}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              ⚠️ Eliminar Usuario
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Estás a punto de solicitar la eliminación completa de:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">
                  {showDeleteConfirmation.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {showDeleteConfirmation.name || 'Sin nombre'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Razón de la eliminación *
              </label>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Describe la razón por la cual se eliminará este usuario..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                required
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Importante:</strong> Se enviará un enlace de
                confirmación al email del administrador. Esta acción eliminará
                permanentemente todos los datos del usuario.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(null);
                  setDeleteReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUserRequest(showDeleteConfirmation)}
                disabled={isDeleting || !deleteReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Enviando...' : 'Solicitar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
