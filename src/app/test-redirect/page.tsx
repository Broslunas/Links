'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function TestRedirectPage() {
    const [slug, setSlug] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const testRedirect = async () => {
        if (!slug.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch(`/api/redirect/${slug.trim()}`);
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({
                success: false,
                error: { message: 'Network error' }
            });
        } finally {
            setLoading(false);
        }
    };

    const testActualRedirect = () => {
        if (!slug.trim()) return;
        window.open(`/${slug.trim()}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Test URL Redirection System
                </h1>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Test Redirect</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Enter slug to test:
                            </label>
                            <Input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="e.g., test-link"
                                className="w-full"
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={testRedirect}
                                disabled={loading || !slug.trim()}
                                className="flex-1"
                            >
                                {loading ? 'Testing...' : 'Test API'}
                            </Button>

                            <Button
                                onClick={testActualRedirect}
                                disabled={!slug.trim()}
                                variant="outline"
                                className="flex-1"
                            >
                                Test Actual Redirect
                            </Button>
                        </div>
                    </div>
                </div>

                {result && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Result:</h3>
                        <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        How to test:
                    </h3>
                    <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
                        <li>1. Create a link in the dashboard first</li>
                        <li>2. Enter the slug of that link above</li>
                        <li>3. Click "Test API" to see the redirect data</li>
                        <li>4. Click "Test Actual Redirect" to test the real redirect</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}