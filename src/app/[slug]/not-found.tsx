import { RedirectError } from '../../components/ui/RedirectError';

export default function SlugNotFound() {
    return (
        <RedirectError
            type="not_found"
            message="El enlace que buscas no existe o ha expirado. Puede haber sido eliminado, haber caducado, o es posible que hayas escrito mal la URL."
        />
    );
}

// Generate metadata for SEO
export function generateMetadata() {
    return {
        title: 'Enlace No Encontrado - 404',
        description: 'El enlace corto que buscas no existe o ha expirado.',
        robots: 'noindex, nofollow',
    };
}