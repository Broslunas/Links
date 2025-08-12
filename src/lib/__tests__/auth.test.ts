import { authOptions } from '../auth';

describe('Auth Configuration', () => {
    it('should have correct providers configured', () => {
        expect(authOptions.providers).toHaveLength(2);
        expect(authOptions.providers[0].id).toBe('github');
        expect(authOptions.providers[1].id).toBe('google');
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