// Main stores entry point and barrel export for Finance Tracker
import * as db from '$lib/db';
import {
    loadWallets,
    loadExpenses,
    loadTransfers,
    loadDebts,
    loadBudgets,
    loadCategories,
    isLoading
} from './core';
import { studentProfile } from './profile';
import { subscriptions } from './subscriptions';
import { goals } from './goals';

// Re-export all stores and utilities
export * from './core';
export * from './profile';
export * from './runway';
export * from './buckets';
export * from './subscriptions';
export * from './goals';
export * from './analytics';
export * from './healthScore';
export * from './analystInsights';

// ============================================================================
// APP LIFECYCLE & DATA MANAGEMENT
// ============================================================================

/**
 * Initialize the app - load all data from IndexedDB
 */
export async function initializeApp(): Promise<void> {
    isLoading.set(true);

    try {
        // Initialize database (creates defaults on first run)
        await db.initializeDatabase();

        // Load all data into stores
        await Promise.all([
            loadWallets(),
            loadExpenses(),
            loadTransfers(),
            loadDebts(),
            loadBudgets(),
            loadCategories(),
            studentProfile.load(),
            subscriptions.load(),
            goals.load()
        ]);

        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        throw error;
    } finally {
        isLoading.set(false);
    }
}

/**
 * Export all data as JSON file
 */
export async function exportData(): Promise<void> {
    const data = await db.exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

/**
 * Import data from JSON file
 */
export async function importData(file: File): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text);

    await db.importAllData(data);
    await initializeApp(); // Reload all stores
}

/**
 * Clear all data (use with caution!)
 */
export async function clearAllData(): Promise<void> {
    if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
        await db.clearAllData();
        await initializeApp(); // Reinitialize with defaults
    }
}
