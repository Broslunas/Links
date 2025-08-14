// Mock dependencies before importing
jest.mock('../db-utils', () => ({
    connectDB: jest.fn(),
}));

jest.mock('../../models/User', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

import { authOptions } from '../auth-simple';

describe('Discord Integration', () => {
    it('should have Discord provider configured with correct settings', () => {
        const discordProvider = authOptions.providers.find(p => p.id === 'discord');

        expect(discordProvider).toBeDefined();
        expect(discordProvider?.name).toBe('Discord');
        expect(discordProvider?.type).toBe('oauth');
    });

    it('should include Discord in provider types', () => {
        const providerIds = authOptions.providers.map(p => p.id);
        expect(providerIds).toContain('discord');
    });

    it('should have proper callback configuration for Discord', () => {
        expect(authOptions.pages?.signIn).toBe('/auth/signin');
        expect(authOptions.pages?.error).toBe('/auth/error');
    });

    it('should support Discord in signIn callback with complete profile data', async () => {
        const mockUser = {
            id: 'discord123',
            email: 'test@discord.com',
            name: 'Discord User',
            image: 'https://discord.com/avatar.png'
        };

        const mockAccount = {
            provider: 'discord',
            providerAccountId: 'discord123',
            type: 'oauth' as const
        };

        const mockDiscordProfile = {
            id: 'discord123',
            username: 'discorduser',
            discriminator: '1234',
            global_name: 'Discord User',
            avatar: 'avatar123',
            verified: true,
            locale: 'es-ES',
            email: 'test@discord.com',
            banner: 'banner123',
            accent_color: 5793266,
            premium_type: 2,
            public_flags: 64
        };

        // Mock User model methods
        const mockUserModel = require('../../models/User');
        mockUserModel.findOne.mockResolvedValue(null);
        mockUserModel.create.mockResolvedValue({
            _id: 'user123',
            email: mockUser.email,
            name: mockUser.name,
            image: mockUser.image,
            provider: 'discord',
            providerId: mockAccount.providerAccountId,
            discordUsername: mockDiscordProfile.username,
            discordDiscriminator: mockDiscordProfile.discriminator,
            discordGlobalName: mockDiscordProfile.global_name,
            discordVerified: mockDiscordProfile.verified,
            discordLocale: mockDiscordProfile.locale,
            providerData: {
                username: mockDiscordProfile.username,
                discriminator: mockDiscordProfile.discriminator,
                global_name: mockDiscordProfile.global_name,
                verified: mockDiscordProfile.verified,
                locale: mockDiscordProfile.locale,
                avatar: mockDiscordProfile.avatar,
                banner: mockDiscordProfile.banner,
                accent_color: mockDiscordProfile.accent_color,
                premium_type: mockDiscordProfile.premium_type,
                public_flags: mockDiscordProfile.public_flags
            }
        });

        const result = await authOptions.callbacks?.signIn?.({
            user: mockUser,
            account: mockAccount,
            profile: mockDiscordProfile,
            email: { verificationRequest: false }
        });

        expect(result).toBe(true);
        expect(mockUserModel.create).toHaveBeenCalledWith({
            email: mockUser.email,
            name: mockUser.name,
            image: mockUser.image,
            provider: 'discord',
            providerId: mockAccount.providerAccountId,
            discordUsername: mockDiscordProfile.username,
            discordDiscriminator: mockDiscordProfile.discriminator,
            discordGlobalName: mockDiscordProfile.global_name,
            discordVerified: mockDiscordProfile.verified,
            discordLocale: mockDiscordProfile.locale,
            providerData: {
                username: mockDiscordProfile.username,
                discriminator: mockDiscordProfile.discriminator,
                global_name: mockDiscordProfile.global_name,
                verified: mockDiscordProfile.verified,
                locale: mockDiscordProfile.locale,
                avatar: mockDiscordProfile.avatar,
                banner: mockDiscordProfile.banner,
                accent_color: mockDiscordProfile.accent_color,
                premium_type: mockDiscordProfile.premium_type,
                public_flags: mockDiscordProfile.public_flags
            }
        });
    });

    it('should update existing Discord user with latest profile data', async () => {
        const mockUser = {
            id: 'discord456',
            email: 'existing@discord.com',
            name: 'Updated Discord User',
            image: 'https://discord.com/new-avatar.png'
        };

        const mockAccount = {
            provider: 'discord',
            providerAccountId: 'discord456',
            type: 'oauth' as const
        };

        const mockDiscordProfile = {
            id: 'discord456',
            username: 'updateduser',
            discriminator: '5678',
            global_name: 'Updated Discord User',
            avatar: 'newavatar456',
            verified: true,
            locale: 'en-US',
            email: 'existing@discord.com'
        };

        const mockExistingUser = {
            _id: 'existinguser123',
            email: 'existing@discord.com',
            name: 'Old Name',
            image: 'old-image.png',
            provider: 'discord',
            providerId: 'discord456',
            discordUsername: 'oldusername',
            discordDiscriminator: '0000',
            discordGlobalName: 'Old Global Name',
            discordVerified: false,
            discordLocale: 'es-ES',
            save: jest.fn().mockResolvedValue(true)
        };

        // Mock User model methods
        const mockUserModel = require('../../models/User');
        mockUserModel.findOne.mockResolvedValue(mockExistingUser);

        const result = await authOptions.callbacks?.signIn?.({
            user: mockUser,
            account: mockAccount,
            profile: mockDiscordProfile,
            email: { verificationRequest: false }
        });

        expect(result).toBe(true);
        expect(mockExistingUser.name).toBe(mockUser.name);
        expect(mockExistingUser.image).toBe(mockUser.image);
        expect(mockExistingUser.discordUsername).toBe(mockDiscordProfile.username);
        expect(mockExistingUser.discordDiscriminator).toBe(mockDiscordProfile.discriminator);
        expect(mockExistingUser.discordGlobalName).toBe(mockDiscordProfile.global_name);
        expect(mockExistingUser.discordVerified).toBe(mockDiscordProfile.verified);
        expect(mockExistingUser.discordLocale).toBe(mockDiscordProfile.locale);
        expect(mockExistingUser.save).toHaveBeenCalled();
    });

    it('should preserve Discord data when user signs in with different provider', async () => {
        const mockUser = {
            id: 'github789',
            email: 'multi@provider.com',
            name: 'Multi Provider User',
            image: 'https://github.com/avatar.png'
        };

        const mockAccount = {
            provider: 'github',
            providerAccountId: 'github789',
            type: 'oauth' as const
        };

        const mockExistingDiscordUser = {
            _id: 'existingdiscorduser123',
            email: 'multi@provider.com',
            name: 'Discord User Name',
            image: 'discord-image.png',
            provider: 'discord',
            providerId: 'discord999',
            discordUsername: 'discorduser',
            discordDiscriminator: '9999',
            discordGlobalName: 'Discord Global Name',
            discordVerified: true,
            discordLocale: 'es-ES',
            providerData: {
                username: 'discorduser',
                discriminator: '9999',
                verified: true,
                locale: 'es-ES'
            },
            save: jest.fn().mockResolvedValue(true)
        };

        // Mock User model methods
        const mockUserModel = require('../../models/User');
        mockUserModel.findOne.mockResolvedValue(mockExistingDiscordUser);

        const result = await authOptions.callbacks?.signIn?.({
            user: mockUser,
            account: mockAccount,
            profile: {},
            email: { verificationRequest: false }
        });

        expect(result).toBe(true);
        // Should update basic info but preserve Discord-specific data
        expect(mockExistingDiscordUser.name).toBe(mockUser.name);
        expect(mockExistingDiscordUser.image).toBe(mockUser.image);
        // Discord data should remain unchanged since this is not a Discord login
        expect(mockExistingDiscordUser.discordUsername).toBe('discorduser');
        expect(mockExistingDiscordUser.discordDiscriminator).toBe('9999');
        expect(mockExistingDiscordUser.discordGlobalName).toBe('Discord Global Name');
        expect(mockExistingDiscordUser.discordVerified).toBe(true);
        expect(mockExistingDiscordUser.discordLocale).toBe('es-ES');
        expect(mockExistingDiscordUser.save).toHaveBeenCalled();
    });
});