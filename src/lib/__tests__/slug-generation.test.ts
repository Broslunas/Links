import { generateSlug, isValidUrl } from '../db-utils';

describe('Slug Generation', () => {
    test('generateSlug should create a slug of specified length', () => {
        const slug = generateSlug(6);
        expect(slug).toHaveLength(6);
        expect(slug).toMatch(/^[a-z0-9]+$/);
    });

    test('generateSlug should create different slugs on multiple calls', () => {
        const slug1 = generateSlug(6);
        const slug2 = generateSlug(6);
        expect(slug1).not.toBe(slug2);
    });

    test('generateSlug should default to length 6', () => {
        const slug = generateSlug();
        expect(slug).toHaveLength(6);
    });
});

describe('URL Validation', () => {
    test('isValidUrl should validate correct URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://example.com')).toBe(true);
        expect(isValidUrl('https://subdomain.example.com/path')).toBe(true);
    });

    test('isValidUrl should reject invalid URLs', () => {
        expect(isValidUrl('not-a-url')).toBe(false);
        expect(isValidUrl('example.com')).toBe(false);
        expect(isValidUrl('')).toBe(false);
        expect(isValidUrl('ftp://example.com')).toBe(true); // FTP is valid URL
    });
});