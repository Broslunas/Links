'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '../components/ui/Toast';

export interface ToastOptions {
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const addToast = useCallback((options: ToastOptions) => {
        const id = Math.random().toString(36).substr(2, 9);
        const toast: ToastProps = {
            id,
            ...options,
            onClose: (toastId: string) => {
                setToasts(prev => prev.filter(t => t.id !== toastId));
            },
        };

        setToasts(prev => [...prev, toast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((message: string, title?: string) => {
        return addToast({ message, title, type: 'success' });
    }, [addToast]);

    const error = useCallback((message: string, title?: string) => {
        return addToast({ message, title, type: 'error' });
    }, [addToast]);

    const warning = useCallback((message: string, title?: string) => {
        return addToast({ message, title, type: 'warning' });
    }, [addToast]);

    const info = useCallback((message: string, title?: string) => {
        return addToast({ message, title, type: 'info' });
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };
}