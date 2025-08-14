import { mainNavigation, footerNavigation } from '../navigation';

describe('Navigation Configuration', () => {
    describe('mainNavigation', () => {
        it('should have the correct structure', () => {
            expect(mainNavigation).toHaveProperty('items');
            expect(Array.isArray(mainNavigation.items)).toBe(true);
            expect(mainNavigation.items.length).toBeGreaterThan(0);
        });

        it('should have all required navigation items', () => {
            const expectedLabels = ['Inicio', 'Características', 'Precios', 'API', 'Ayuda'];
            const actualLabels = mainNavigation.items.map(item => item.label);

            expectedLabels.forEach(label => {
                expect(actualLabels).toContain(label);
            });
        });

        it('should have valid href values for all items', () => {
            mainNavigation.items.forEach(item => {
                expect(item.href).toBeDefined();
                expect(typeof item.href).toBe('string');
                expect(item.href.length).toBeGreaterThan(0);
            });
        });
    });

    describe('footerNavigation', () => {
        it('should have the correct structure', () => {
            expect(footerNavigation).toHaveProperty('sections');
            expect(footerNavigation).toHaveProperty('companyInfo');
            expect(footerNavigation).toHaveProperty('copyright');

            expect(Array.isArray(footerNavigation.sections)).toBe(true);
            expect(footerNavigation.sections.length).toBeGreaterThan(0);
        });

        it('should have all required footer sections', () => {
            const expectedSections = ['Producto', 'Soporte', 'Legal'];
            const actualSections = footerNavigation.sections.map(section => section.title);

            expectedSections.forEach(title => {
                expect(actualSections).toContain(title);
            });
        });

        it('should have valid company info', () => {
            const { companyInfo } = footerNavigation;

            expect(companyInfo.name).toBe('Broslunas Links');
            expect(typeof companyInfo.description).toBe('string');
            expect(companyInfo.description.length).toBeGreaterThan(0);
        });

        it('should have valid copyright info', () => {
            const { copyright } = footerNavigation;

            expect(typeof copyright.year).toBe('number');
            expect(copyright.year).toBeGreaterThan(2020);
            expect(copyright.year).toBeLessThanOrEqual(new Date().getFullYear());
            expect(typeof copyright.text).toBe('string');
            expect(copyright.text.length).toBeGreaterThan(0);
        });

        it('should have valid items in each section', () => {
            footerNavigation.sections.forEach(section => {
                expect(section.title).toBeDefined();
                expect(Array.isArray(section.items)).toBe(true);
                expect(section.items.length).toBeGreaterThan(0);

                section.items.forEach(item => {
                    expect(item.label).toBeDefined();
                    expect(item.href).toBeDefined();
                    expect(typeof item.label).toBe('string');
                    expect(typeof item.href).toBe('string');
                });
            });
        });
    });
});