import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import SignInForm from '../SignInForm';

// Mock next-auth
jest.mock('next-auth/react', () => ({
    signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useSearchParams: jest.fn(),
}));

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('SignInForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSearchParams.mockReturnValue({
            get: jest.fn().mockReturnValue('/dashboard'),
        } as any);
    });

    it('renders all three OAuth provider buttons', () => {
        render(<SignInForm />);

        expect(screen.getByText('Continuar con GitHub')).toBeInTheDocument();
        expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
        expect(screen.getByText('Continuar con Discord')).toBeInTheDocument();
    });

    it('calls signIn with correct provider when GitHub button is clicked', async () => {
        mockSignIn.mockResolvedValue(undefined);
        render(<SignInForm />);

        const githubButton = screen.getByText('Continuar con GitHub');
        fireEvent.click(githubButton);

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('github', {
                callbackUrl: '/dashboard',
                redirect: true,
            });
        });
    });

    it('calls signIn with correct provider when Google button is clicked', async () => {
        mockSignIn.mockResolvedValue(undefined);
        render(<SignInForm />);

        const googleButton = screen.getByText('Continuar con Google');
        fireEvent.click(googleButton);

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('google', {
                callbackUrl: '/dashboard',
                redirect: true,
            });
        });
    });

    it('calls signIn with correct provider when Discord button is clicked', async () => {
        mockSignIn.mockResolvedValue(undefined);
        render(<SignInForm />);

        const discordButton = screen.getByText('Continuar con Discord');
        fireEvent.click(discordButton);

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('discord', {
                callbackUrl: '/dashboard',
                redirect: true,
            });
        });
    });

    it('shows loading state when Discord button is clicked', async () => {
        mockSignIn.mockImplementation(() => new Promise(() => { })); // Never resolves
        render(<SignInForm />);

        const discordButton = screen.getByText('Continuar con Discord');
        fireEvent.click(discordButton);

        await waitFor(() => {
            expect(screen.getByText('Conectando...')).toBeInTheDocument();
        });
    });

    it('disables all buttons when one is loading', async () => {
        mockSignIn.mockImplementation(() => new Promise(() => { })); // Never resolves
        render(<SignInForm />);

        const discordButton = screen.getByText('Continuar con Discord');
        fireEvent.click(discordButton);

        await waitFor(() => {
            const githubButton = screen.getByText('Continuar con GitHub').closest('button');
            const googleButton = screen.getByText('Continuar con Google').closest('button');
            const discordButtonElement = screen.getByText('Conectando...').closest('button');

            expect(githubButton).toBeDisabled();
            expect(googleButton).toBeDisabled();
            expect(discordButtonElement).toBeDisabled();
        });
    });

    it('uses custom callback URL from search params', () => {
        mockUseSearchParams.mockReturnValue({
            get: jest.fn().mockReturnValue('/custom-callback'),
        } as any);

        mockSignIn.mockResolvedValue(undefined);
        render(<SignInForm />);

        const discordButton = screen.getByText('Continuar con Discord');
        fireEvent.click(discordButton);

        expect(mockSignIn).toHaveBeenCalledWith('discord', {
            callbackUrl: '/custom-callback',
            redirect: true,
        });
    });

    it('shows error message when sign in fails', async () => {
        mockSignIn.mockRejectedValue(new Error('Sign in failed'));
        render(<SignInForm />);

        const discordButton = screen.getByText('Continuar con Discord');
        fireEvent.click(discordButton);

        await waitFor(() => {
            expect(screen.getByText('Error al iniciar sesión. Por favor, inténtalo de nuevo.')).toBeInTheDocument();
        });
    });
});