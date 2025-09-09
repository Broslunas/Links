'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Globe, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  ExternalLink, 
  Settings, 
  Trash2,
  RefreshCw,
  Copy,
  Star,
  Clock,
  Shield,
  Ban,
  XCircle,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface CustomDomain {
  _id: string;
  domain: string;
  subdomain?: string;
  fullDomain: string;
  isVerified: boolean;
  isActive: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
  verificationToken: string;
  dnsRecords: Array<{
    type: string;
    name: string;
    value: string;
    ttl?: number;
  }>;
  sslStatus: 'pending' | 'active' | 'error';
  sslError?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  message?: string;
}

export default function CustomDomainManager() {
  const { data: session } = useSession();
  const { success, error } = useToast();
  
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDNSModal, setShowDNSModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<CustomDomain | null>(null);
  const [newDomain, setNewDomain] = useState({ domain: '', subdomain: '' });
  const [addingDomain, setAddingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [checkingSSL, setCheckingSSL] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDomains();
    }
  }, [session?.user?.id]);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/domains');
      const data: ApiResponse<CustomDomain[]> = await response.json();
      
      if (data.success && data.data) {
        setDomains(data.data);
      } else {
        error(data.error?.message || 'Error cargando dominios');
      }
    } catch (err) {
      error('Error cargando dominios');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.domain.trim()) {
      error('El dominio es requerido');
      return;
    }

    try {
      setAddingDomain(true);
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: newDomain.domain.trim(),
          subdomain: newDomain.subdomain.trim() || undefined,
        }),
      });

      const data: ApiResponse<CustomDomain> = await response.json();
      
      if (data.success && data.data) {
        setDomains([...domains, data.data]);
        setNewDomain({ domain: '', subdomain: '' });
        setShowAddModal(false);
        success('Dominio agregado exitosamente. Configura los registros DNS para verificarlo.');
      } else {
        error(data.error?.message || 'Error agregando dominio');
      }
    } catch (err) {
      error('Error agregando dominio');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    try {
      setVerifyingDomain(domainId);
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'POST',
      });

      const data: ApiResponse<CustomDomain> = await response.json();
      
      if (data.success && data.data) {
        setDomains(domains.map(d => d._id === domainId ? data.data! : d));
        success(data.message || 'Dominio verificado exitosamente');
      } else {
        error(data.error?.message || 'Error verificando dominio');
      }
    } catch (err) {
      error('Error verificando dominio');
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleSetDefault = async (domainId: string) => {
    try {
      const response = await fetch(`/api/domains/${domainId}/default`, {
        method: 'POST',
      });

      const data: ApiResponse<CustomDomain> = await response.json();
      
      if (data.success && data.data) {
        // Actualizar todos los dominios (remover default de otros)
        setDomains(domains.map(d => ({
          ...d,
          isDefault: d._id === domainId
        })));
        success('Dominio establecido como predeterminado');
      } else {
        error(data.error?.message || 'Error estableciendo dominio predeterminado');
      }
    } catch (err) {
      error('Error estableciendo dominio predeterminado');
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este dominio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setDomains(domains.filter(d => d._id !== domainId));
        success('Dominio eliminado exitosamente');
      } else {
        error(data.error?.message || 'Error eliminando dominio');
      }
    } catch (err) {
      error('Error eliminando dominio');
    }
  };

  const handleCheckSSL = async (domainId: string) => {
    setCheckingSSL(domainId);
    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'GET',
      });

      const data: ApiResponse<CustomDomain> = await response.json();
      
      if (data.success && data.data) {
        // Actualizar el dominio en la lista
        setDomains(domains.map(d => 
          d._id === domainId ? data.data! : d
        ));
        
        if (data.data.sslStatus === 'active') {
          success('SSL configurado exitosamente');
        } else if (data.data.sslStatus === 'error') {
          error(`Error SSL: ${data.data.sslError || 'Error desconocido'}`);
        } else {
          success('Estado SSL actualizado. Aún en configuración...');
        }
      } else {
        error(data.error?.message || 'Error verificando SSL');
      }
    } catch (err) {
      error('Error verificando SSL');
    } finally {
      setCheckingSSL(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Copiado al portapapeles');
  };

  const getStatusIcon = (domain: CustomDomain) => {
    if (domain.isBlocked) {
      return <Ban className="h-4 w-4 text-red-600" />;
    }
    if (!domain.isVerified) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    if (!domain.isActive) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (domain.sslStatus === 'active') {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (domain.sslStatus === 'error') {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
  };

  const getStatusText = (domain: CustomDomain) => {
    if (domain.isBlocked) {
      return `Dominio bloqueado${domain.blockedReason ? `: ${domain.blockedReason}` : ''}`;
    }
    if (!domain.isVerified) {
      return 'Pendiente verificación';
    }
    if (!domain.isActive) {
      return 'Dominio inactivo';
    }
    if (domain.sslStatus === 'active') {
      return 'Activo';
    }
    if (domain.sslStatus === 'error') {
      return `Error: ${domain.sslError || 'SSL error'}`;
    }
    return 'Configurando SSL...';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dominios Personalizados
            </h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
              {domains.length} dominios
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => window.open('/contacto', '_blank')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Contactar Soporte</span>
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Dominio</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {domains.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tienes dominios personalizados
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Agrega tu propio dominio para personalizar tus enlaces cortos
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar tu primer dominio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div
                key={domain._id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  domain.isBlocked 
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(domain)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-lg font-medium ${
                          domain.isBlocked 
                            ? 'text-red-900 dark:text-red-200' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {domain.fullDomain}
                        </h3>
                        {domain.isDefault && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        {domain.isBlocked && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <Ban className="w-3 h-3 mr-1" />
                            Bloqueado
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${
                        domain.isBlocked 
                          ? 'text-red-700 dark:text-red-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {getStatusText(domain)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {domain.isVerified && !domain.isBlocked && (
                      <a
                        href={`https://${domain.fullDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        title="Visitar dominio"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    
                    {domain.isBlocked && (
                      <Button
                        size="sm"
                        onClick={() => window.open('/contacto', '_blank')}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-200 dark:hover:bg-red-800"
                        title="Contactar soporte sobre dominio bloqueado"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Contactar Soporte
                      </Button>
                    )}
                    
                    {!domain.isVerified && !domain.isBlocked && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDomain(domain);
                          setShowDNSModal(true);
                        }}
                        variant="outline"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar DNS
                      </Button>
                    )}
                    
                    {!domain.isVerified && !domain.isBlocked && (
                      <Button
                        size="sm"
                        onClick={() => handleVerifyDomain(domain._id)}
                        disabled={verifyingDomain === domain._id}
                      >
                        {verifyingDomain === domain._id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Verificar
                      </Button>
                    )}
                    
                    {domain.isVerified && domain.sslStatus === 'pending' && !domain.isBlocked && (
                      <Button
                        size="sm"
                        onClick={() => handleCheckSSL(domain._id)}
                        disabled={checkingSSL === domain._id}
                        variant="outline"
                      >
                        {checkingSSL === domain._id ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Shield className="h-4 w-4 mr-1" />
                        )}
                        Verificar SSL
                      </Button>
                    )}
                    
                    {domain.isVerified && !domain.isDefault && !domain.isBlocked && (
                      <Button
                        size="sm"
                        onClick={() => handleSetDefault(domain._id)}
                        variant="outline"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Predeterminado
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={() => handleDeleteDomain(domain._id)}
                      variant="outline"
                      className={domain.isBlocked ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"}
                      disabled={domain.isBlocked}
                      title={domain.isBlocked ? "No se puede eliminar un dominio bloqueado" : "Eliminar dominio"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar Dominio Personalizado"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subdominio (opcional)
            </label>
            <Input
              type="text"
              value={newDomain.subdomain}
              onChange={(e) => setNewDomain({ ...newDomain, subdomain: e.target.value })}
              placeholder="links"
              disabled={addingDomain}
            />
            <p className="text-xs text-gray-500 mt-1">
              Deja vacío para usar el dominio raíz
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dominio *
            </label>
            <Input
              type="text"
              value={newDomain.domain}
              onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
              placeholder="ejemplo.com"
              disabled={addingDomain}
            />
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Dominio resultante:
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {newDomain.subdomain ? `${newDomain.subdomain}.` : ''}{newDomain.domain || 'ejemplo.com'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={addingDomain}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddDomain}
              disabled={addingDomain || !newDomain.domain.trim()}
            >
              {addingDomain ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Agregar Dominio
            </Button>
          </div>
        </div>
      </Modal>

      {/* DNS Configuration Modal */}
      <Modal
        isOpen={showDNSModal}
        onClose={() => setShowDNSModal(false)}
        title="Configuración DNS"
        size="xl"
      >
        {selectedDomain && (
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Configuración requerida
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Agrega los siguientes registros DNS en tu proveedor de dominio para verificar {selectedDomain.fullDomain}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {selectedDomain.dnsRecords.map((record, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        TIPO
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                          {record.type}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(record.type)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        NOMBRE
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm break-all">
                          {record.name}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(record.name)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        VALOR
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm break-all flex-1">
                          {record.value}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(record.value)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Instrucciones
                  </h4>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                    <li>Accede al panel de control de tu proveedor de dominio</li>
                    <li>Busca la sección de gestión DNS o registros DNS</li>
                    <li>Agrega los registros mostrados arriba</li>
                    <li>Espera a que se propaguen los cambios (puede tomar hasta 24 horas)</li>
                    <li>Haz clic en "Verificar" para confirmar la configuración</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDNSModal(false)}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setShowDNSModal(false);
                  handleVerifyDomain(selectedDomain._id);
                }}
                disabled={verifyingDomain === selectedDomain._id}
              >
                {verifyingDomain === selectedDomain._id ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Verificar Ahora
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}