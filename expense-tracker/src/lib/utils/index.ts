// Utility functions for the expense tracker

import type { Expense, Income, Transaction, CategoryStats, PeriodStats } from '$lib/types';

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Format a date string
 */
export function formatDate(date: Date, format: string = 'MM/DD/YYYY'): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return d.toLocaleDateString();
    }
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffDay < 30) {
        const weeks = Math.floor(diffDay / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    if (diffDay < 365) {
        const months = Math.floor(diffDay / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffDay / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Calculate total from transactions
 */
export function calculateTotal(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate balance (income - expenses)
 */
export function calculateBalance(income: Income[], expenses: Expense[]): number {
    const totalIncome = calculateTotal(income);
    const totalExpenses = calculateTotal(expenses);
    return totalIncome - totalExpenses;
}

/**
 * Group transactions by category and calculate stats
 */
export function calculateCategoryStats(
    transactions: Transaction[],
    categoryLookup: Map<string, { name: string; color: string }>
): CategoryStats[] {
    const categoryTotals = new Map<string, { total: number; count: number }>();

    transactions.forEach((t) => {
        const existing = categoryTotals.get(t.categoryId) || { total: 0, count: 0 };
        categoryTotals.set(t.categoryId, {
            total: existing.total + t.amount,
            count: existing.count + 1
        });
    });

    const total = calculateTotal(transactions);
    const stats: CategoryStats[] = [];

    categoryTotals.forEach((data, categoryId) => {
        const category = categoryLookup.get(categoryId);
        if (category) {
            stats.push({
                categoryId,
                categoryName: category.name,
                total: data.total,
                count: data.count,
                percentage: total > 0 ? (data.total / total) * 100 : 0,
                color: category.color
            });
        }
    });

    return stats.sort((a, b) => b.total - a.total);
}

/**
 * Filter transactions by date range
 */
export function filterByDateRange(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
): Transaction[] {
    return transactions.filter((t) => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
    });
}

/**
 * Get transactions for current month
 */
export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return filterByDateRange(transactions, startOfMonth, endOfMonth);
}

/**
 * Get transactions for current week
 */
export function getCurrentWeekTransactions(transactions: Transaction[]): Transaction[] {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return filterByDateRange(transactions, startOfWeek, endOfWeek);
}

/**
 * Calculate period stats
 */
export function calculatePeriodStats(
    income: Income[],
    expenses: Expense[],
    categoryLookup: Map<string, { name: string; color: string }>
): PeriodStats {
    const totalIncome = calculateTotal(income);
    const totalExpenses = calculateTotal(expenses);
    const balance = totalIncome - totalExpenses;

    const topCategories = calculateCategoryStats(expenses, categoryLookup).slice(0, 5);

    return {
        income: totalIncome,
        expenses: totalExpenses,
        balance,
        topCategories,
        transactionCount: income.length + expenses.length
    };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Validate transaction amount
 */
export function isValidAmount(amount: number): boolean {
    return !isNaN(amount) && amount > 0 && isFinite(amount);
}

/**
 * Search transactions by description
 */
export function searchTransactions(transactions: Transaction[], query: string): Transaction[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return transactions;

    return transactions.filter((t) => t.description.toLowerCase().includes(lowerQuery));
}

/**
 * Sort transactions by date (newest first)
 */
export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Export transactions to CSV
 */
export function exportToCSV(transactions: Transaction[], filename: string = 'transactions.csv'): void {
    const headers = ['Date', 'Description', 'Amount', 'Category ID', 'Type'];
    const rows = transactions.map((t) => [
        formatDate(t.date),
        t.description,
        t.amount.toString(),
        t.categoryId,
        'type' in t ? t.type : 'transaction'
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
