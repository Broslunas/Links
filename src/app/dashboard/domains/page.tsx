'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Separator } from '@/components/ui/Separator';
import { Trash2, Plus, RefreshCw, CheckCircle, XCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Domain {
  _id: string;
  domain: string;
  isVerified: boolean;
  isActive: boolean;
  cnameTarget: string;
  verificationToken: string;
  lastVerificationAttempt?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface VerificationInstructions {
  step1: string;
  step2: string;
  step3: string;
  step4: string;
}

export default function DomainsPage() {
  const { data: session } = useSession();
  const { success, error } = useToast();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [verifyingDomains, setVerifyingDomains] = useState<Set<string>>(new Set());
  const [instructions, setInstructions] = useState<Record<string, VerificationInstructions>>({});

  // Fetch domains
  const fetchDomains = async () => {
    console.log('fetchDomains - Session:', session);
    try {
      const response = await fetch('/api/domains');
      console.log('fetchDomains - Response status:', response.status);
      const data = await response.json();
      console.log('fetchDomains - Response data:', data);
      
      if (data.domains) {
        setDomains(data.domains);
      }
    } catch (err) {
      console.error('Error fetching domains:', err);
      error('No se pudieron cargar los dominios', 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Add new domain
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    console.log('handleAddDomain - Session:', session);
    console.log('handleAddDomain - Domain:', newDomain.trim());
    setAddingDomain(true);
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      console.log('handleAddDomain - Response status:', response.status);
      const data = await response.json();
      console.log('handleAddDomain - Response data:', data);

      if (response.ok) {
        success(`${newDomain} ha sido agregado exitosamente`, 'Dominio agregado');
        setNewDomain('');
        fetchDomains();
      } else {
        error(data.error || 'No se pudo agregar el dominio', 'Error');
      }
    } catch (err) {
      console.error('Error adding domain:', err);
      error('Error al agregar el dominio', 'Error');
    } finally {
      setAddingDomain(false);
    }
  };

  // Verify domain
  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingDomains(prev => new Set(prev).add(domainId));
    
    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        success('El dominio ha sido verificado exitosamente', 'Dominio verificado');
        fetchDomains();
      } else {
        error(data.message || 'No se pudo verificar el dominio', 'Verificación fallida');
      }
    } catch (err) {
      console.error('Error verifying domain:', err);
      error('Error al verificar el dominio', 'Error');
    } finally {
      setVerifyingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  // Get verification instructions
  const getVerificationInstructions = async (domainId: string) => {
    try {
      const response = await fetch(`/api/domains/${domainId}/verify`);
      const data = await response.json();
      
      if (data.instructions) {
        setInstructions(prev => ({
          ...prev,
          [domainId]: data.instructions
        }));
      }
    } catch (err) {
      console.error('Error fetching instructions:', err);
    }
  };

  // Delete domain
  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar ${domainName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success(`${domainName} ha sido eliminado`, 'Dominio eliminado');
        fetchDomains();
      } else {
        const data = await response.json();
        error(data.error || 'No se pudo eliminar el dominio', 'Error');
      }
    } catch (err) {
      console.error('Error deleting domain:', err);
      error('Error al eliminar el dominio', 'Error');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Texto copiado al portapapeles', 'Copiado');
  };

  useEffect(() => {
    if (session) {
      fetchDomains();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dominios Personalizados</h1>
        <p className="text-muted-foreground">
          Configura dominios personalizados para tus enlaces cortos
        </p>
      </div>

      {/* Add Domain Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Dominio
          </CardTitle>
          <CardDescription>
            Agrega un nuevo dominio personalizado para usar con tus enlaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDomain} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="domain">Dominio</Label>
              <Input
                id="domain"
                type="text"
                placeholder="ejemplo.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                disabled={addingDomain}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={addingDomain || !newDomain.trim()}>
                {addingDomain ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Agregando...
                  </>
                ) : (
                  'Agregar Dominio'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Domains List */}
      <div className="space-y-4">
        {domains.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No hay dominios configurados</h3>
                <p className="text-muted-foreground">
                  Agrega tu primer dominio personalizado para comenzar
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          domains.map((domain) => (
            <Card key={domain._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{domain.domain}</CardTitle>
                    <Badge
                      variant={domain.isVerified ? 'default' : 'secondary'}
                      className={domain.isVerified ? 'bg-green-100 text-green-800' : ''}
                    >
                      {domain.isVerified ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verificado
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pendiente
                        </>
                      )}
                    </Badge>
                    {!domain.isActive && (
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!domain.isVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyDomain(domain._id)}
                        disabled={verifyingDomains.has(domain._id)}
                      >
                        {verifyingDomains.has(domain._id) ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Verificar
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => getVerificationInstructions(domain._id)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Instrucciones
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDomain(domain._id, domain.domain)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Agregado el {new Date(domain.createdAt).toLocaleDateString()}
                  {domain.verifiedAt && (
                    <> • Verificado el {new Date(domain.verifiedAt).toLocaleDateString()}</>
                  )}
                </CardDescription>
              </CardHeader>
              
              {!domain.isVerified && (
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Configuración DNS requerida:</p>
                        <div className="bg-muted p-3 rounded-md font-mono text-sm">
                          <div className="flex items-center justify-between">
                            <span>CNAME: {domain.domain} → {domain.cnameTarget}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(domain.cnameTarget)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Agrega un registro CNAME en tu proveedor de DNS apuntando {domain.domain} a {domain.cnameTarget}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  {instructions[domain._id] && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Pasos de configuración:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>{instructions[domain._id].step1}</li>
                        <li>{instructions[domain._id].step2}</li>
                        <li>{instructions[domain._id].step3}</li>
                        <li>{instructions[domain._id].step4}</li>
                      </ol>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}