'use client';

import { MolstarViewer } from '@/components/protein/viewers/MolstarViewer';

/**
 * Phase 1 Test Page: Clean Molstar Integration
 * Testing the extracted wrapper and basic viewer component
 */
export default function MolstarCleanPage() {
    const handleError = (error: string) => {
        console.error('Molstar viewer error:', error);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Clean Molstar Viewer - Phase 1</h1>
                <p className="text-gray-600 mb-6">
                    Testing the extracted MolstarWrapper and basic viewer component.
                    This should load structures and provide basic camera controls.
                </p>
                
                <MolstarViewer 
                    pdbId="1grm"
                    onError={handleError}
                    className="max-w-4xl"
                />
                
                <div className="mt-6 p-4 bg-white rounded border">
                    <h3 className="font-semibold mb-2">Phase 1 Test Checklist:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>✅ Structure loads without errors</li>
                        <li>✅ PDB selector works (try different structures)</li>
                        <li>✅ Reset Camera button works</li>
                        <li>✅ Toggle Spin button works</li>
                        <li>✅ No console errors or warnings</li>
                        <li>✅ Viewer stays in windowed mode (no fullscreen)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
