'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
    X,
    User,
    Camera,
    Upload,
    Loader2,
    AlertCircle
} from 'lucide-react';
import Image from 'next/image';

interface UserProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProfileUpdate?: () => void;
}

interface UpdateProfileData {
    name: string;
    image?: string;
}

export default function UserProfileEditModal({ 
    isOpen, 
    onClose, 
    onProfileUpdate 
}: UserProfileEditModalProps) {
    const { data: session, update: updateSession } = useSession();
    const [name, setName] = useState(session?.user?.name || '');
    const [image, setImage] = useState(session?.user?.image || '');
    const [imagePreview, setImagePreview] = useState(session?.user?.image || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Por favor selecciona una imagen válida (JPG, PNG, WEBP)');
            return;
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setError('La imagen debe ser menor a 5MB');
            return;
        }

        setError('');
        
        // Convertir a base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64String = e.target?.result as string;
            setImage(base64String);
            setImagePreview(base64String);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const updateData: UpdateProfileData = {
                name: name.trim()
            };

            // Solo incluir imagen si ha cambiado
            if (image !== session?.user?.image) {
                updateData.image = image;
            }

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el perfil');
            }

            const updatedUser = await response.json();
            
            // Actualizar la sesión con los nuevos datos
            await updateSession({
                ...session,
                user: {
                    ...session?.user,
                    name: updatedUser.name,
                    image: updatedUser.image
                }
            });

            onProfileUpdate?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setName(session?.user?.name || '');
            setImage(session?.user?.image || '');
            setImagePreview(session?.user?.image || '');
            setError('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Editar Perfil
                        </h2>
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 disabled:opacity-50"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Profile Image */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    {imagePreview ? (
                                        <Image
                                            src={imagePreview}
                                            alt="Profile"
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-12 h-12 text-gray-400" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={isLoading}
                            />
                            
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Cambiar imagen</span>
                            </button>
                        </div>

                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                                placeholder="Tu nombre"
                                required
                            />
                        </div>

                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={session?.user?.email || ''}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                El email no se puede modificar
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center space-x-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{isLoading ? 'Guardando...' : 'Guardar'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}