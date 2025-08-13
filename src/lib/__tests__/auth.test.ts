import { authOptions } from '../auth-simple';

describe('Auth Configuration', () => {
    it('should have correct providers configured', () => {
        expect(authOptions.providers).toHaveLength(3);
        expect(authOptions.providers[0].id).toBe('github');
        expect(authOptions.providers[1].id).toBe('google');
        expect(authOptions.providers[2].id).toBe('discord');
    });

    it('should have Discord provider properly configured', () => {
        const discordProvider = authOptions.providers.find(p => p.id === 'discord');
        expect(discordProvider).toBeDefined();
        expect(discordProvider?.name).toBe('Discord');
    });

    it('should have correct pages configured', () => {
        expect(authOptions.pages?.signIn).toBe('/auth/signin');
        expect(authOptions.pages?.error).toBe('/auth/error');
    });

    it('should use JWT session strategy', () => {
        expect(authOptions.session?.strategy).toBe('jwt');
    });

    it('should have callbacks defined', () => {
        expect(authOptions.callbacks?.signIn).toBeDefined();
        expect(authOptions.callbacks?.session).toBeDefined();
        expect(authOptions.callbacks?.jwt).toBeDefined();
    });
});