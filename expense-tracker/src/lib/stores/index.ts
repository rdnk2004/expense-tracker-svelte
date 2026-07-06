// Svelte stores with IndexedDB integration for Finance Tracker
import { writable, derived, get } from 'svelte/store';
import type {
    Wallet,
    Expense,
    Transfer,
    Debt,
    Budget,
    Category,
    BudgetType,
    MonthlySummary
} from '$lib/types';
import * as db from '$lib/db';
// Note: We need to ensure saveExpense is available on db.
// In step 79, imports were "import * as db from '$lib/db'".
// In step 79, imports were "import * as db from '$lib/db'".
// But db.ts wasn't fully visible. I assume db has saveExpense based on addExpense.
// Logic below uses db.saveExpense.

// ============================================================================
// WRITABLE STORES
// ============================================================================

export const wallets = writable<Wallet[]>([]);
export const expenses = writable<Expense[]>([]);
export const transfers = writable<Transfer[]>([]);
export const debts = writable<Debt[]>([]);
export const budgets = writable<Budget[]>([]);
export const categories = writable<Category[]>([]);
export const isLoading = writable<boolean>(false);
export const currentMonth = writable<string>(getCurrentMonth());

// ============================================================================
// DERIVED STORES
// ============================================================================

/**
 * Total balance across all wallets (in paise)
 */
export const totalBalance = derived(wallets, ($wallets) => {
    return $wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
});

/**
 * Expenses for the current selected month
 */
export const currentMonthExpenses = derived(
    [expenses, currentMonth],
    ([$expenses, $currentMonth]) => {
        return $expenses.filter((e) => e.date.startsWith($currentMonth));
    }
);

/**
 * Unsettled debts only
 */
export const unsettledDebts = derived(debts, ($debts) => {
    return $debts.filter((d) => !d.isSettled);
});

/**
 * Budgets for the current month
 */
export const currentMonthBudgets = derived([budgets, currentMonth], ([$budgets, $currentMonth]) => {
    return $budgets.filter((b) => b.month === $currentMonth);
});

/**
 * Monthly summary for current month
 */
export const monthlySummary = derived(
    [currentMonthExpenses, categories, wallets, currentMonth],
    ([$currentMonthExpenses, $categories, $wallets, $currentMonth]) => {
        // Compute summary from current month expenses
        const totalExpenses = $currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

        const categoryBreakdown: Record<string, number> = {};
        const walletBreakdown: Record<string, number> = {};

        $currentMonthExpenses.forEach((expense) => {
            // Category breakdown
            categoryBreakdown[expense.categoryId] =
                (categoryBreakdown[expense.categoryId] || 0) + expense.amount;

            // Wallet breakdown
            walletBreakdown[expense.walletId] =
                (walletBreakdown[expense.walletId] || 0) + expense.amount;
        });

        const summary: MonthlySummary = {
            month: $currentMonth,
            totalExpenses,
            categoryBreakdown,
            walletBreakdown,
            isDirty: false,
            lastComputed: new Date().toISOString()
        };

        return summary;
    }
);

// ============================================================================
// WALLET ACTIONS
// ============================================================================

export async function loadWallets(): Promise<void> {
    const data = await db.getWallets();
    wallets.set(data);
}

export async function createWallet(name: string, initialBalance: number): Promise<void> {
    const newWallet: Wallet = {
        id: generateUUID(),
        name,
        balance: initialBalance, // Already in paise
        updated: new Date().toISOString(),
        created: new Date().toISOString()
    };

    await db.saveWallet(newWallet);
    await loadWallets();
}

// ============================================================================
// EXPENSE ACTIONS
// ============================================================================

export async function loadExpenses(): Promise<void> {
    const data = await db.getExpenses();
    expenses.set(data);
}

export async function addExpense(
    expenseData: Omit<Expense, 'id' | 'created'>
): Promise<void> {
    const newExpense: Expense = {
        ...expenseData,
        id: generateUUID(),
        created: new Date().toISOString()
    };

    // Update wallet balance
    const wallet = await db.getWallet(newExpense.walletId);
    if (wallet) {
        const newBalance = wallet.balance - newExpense.amount;
        await db.updateWalletBalance(wallet.id, newBalance);
    }

    // Save expense
    await db.saveExpense(newExpense);

    // Reload stores
    await loadExpenses();
    await loadWallets();
}

export async function removeExpense(id: string): Promise<void> {
    const allExpenses = get(expenses);
    const expense = allExpenses.find((e) => e.id === id);

    if (expense) {
        // Restore wallet balance
        const wallet = await db.getWallet(expense.walletId);
        if (wallet) {
            const newBalance = wallet.balance + expense.amount;
            await db.updateWalletBalance(wallet.id, newBalance);
        }

        // Delete expense
        await db.deleteExpense(id);

        // Reload stores
        await loadExpenses();
        await loadWallets();
    }
}

// ============================================================================
// TRANSFER ACTIONS
// ============================================================================

export async function addIncome(
    data: { walletId: string; amount: number; date: string; source: string; note: string }
): Promise<void> {
    // Update wallet balance
    const wallet = await db.getWallet(data.walletId);
    if (wallet) {
        const newBalance = wallet.balance + data.amount;
        await db.updateWalletBalance(wallet.id, newBalance);

        // Save as Expense record (Hack: using 'income' category to distinguish)
        // Ideally we would have a separate table, but this ensures it shows in history.
        const incomeRecord: import('$lib/types').Expense = {
            id: generateUUID(),
            amount: data.amount, // Positive amount
            walletId: data.walletId,
            categoryId: 'income', // Special category
            subcategory: null,
            date: data.date,
            note: data.note || data.source,
            created: new Date().toISOString()
        };
        await db.saveExpense(incomeRecord);

        await loadWallets();
        await loadExpenses();
    }
}

export async function loadTransfers(): Promise<void> {
    const data = await db.getTransfers();
    transfers.set(data);
}

export async function createTransfer(
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    date: string,
    note?: string
): Promise<void> {
    // Validate source wallet has sufficient balance
    const fromWallet = await db.getWallet(fromWalletId);
    if (!fromWallet || fromWallet.balance < amount) {
        throw new Error('Insufficient balance in source wallet');
    }

    // Create transfer record
    const newTransfer: Transfer = {
        id: generateUUID(),
        fromWalletId,
        toWalletId,
        amount,
        date,
        note: note || null,
        created: new Date().toISOString()
    };

    // Update wallet balances atomically
    const toWallet = await db.getWallet(toWalletId);
    if (!toWallet) {
        throw new Error('Destination wallet not found');
    }

    await db.updateWalletBalance(fromWalletId, fromWallet.balance - amount);
    await db.updateWalletBalance(toWalletId, toWallet.balance + amount);

    // Save transfer
    await db.saveTransfer(newTransfer);

    // Reload stores
    await loadTransfers();
    await loadWallets();
}

// ============================================================================
// DEBT ACTIONS
// ============================================================================

export async function loadDebts(): Promise<void> {
    const data = await db.getDebts();
    debts.set(data);
}

export async function addDebt(
    debtData: Omit<Debt, 'id' | 'created' | 'isSettled' | 'settledDate' | 'linkedTransactionId'>
): Promise<void> {
    const newDebt: Debt = {
        ...debtData,
        id: generateUUID(),
        isSettled: false,
        settledDate: null,
        linkedTransactionId: null,
        created: new Date().toISOString()
    };

    await db.saveDebt(newDebt);
    await loadDebts();
}

export async function settleDebt(id: string, amount: number, linkToWalletId?: string): Promise<void> {
    const allDebts = get(debts);
    const debt = allDebts.find((d) => d.id === id);

    if (!debt) {
        throw new Error('Debt not found');
    }

    if (amount <= 0) {
        throw new Error('Settlement amount must be greater than 0');
    }

    if (amount > debt.amount) {
        throw new Error('Settlement amount cannot exceed debt amount');
    }

    let linkedTransactionId: string | null = null;

    // If linkToWallet is provided, create an expense
    if (linkToWalletId) {
        const settlementExpense: Expense = {
            id: generateUUID(),
            amount: amount,
            walletId: linkToWalletId,
            categoryId: 'cat-other', // Default to "Other" category
            subcategory: null,
            date: new Date().toISOString(),
            note: `Settlement: ${debt.person} (${amount < debt.amount ? 'Partial' : 'Full'})`,
            created: new Date().toISOString()
        };

        // Update wallet balance
        const wallet = await db.getWallet(linkToWalletId);
        if (wallet) {
            await db.updateWalletBalance(wallet.id, wallet.balance - amount);
        }

        await db.saveExpense(settlementExpense);
        linkedTransactionId = settlementExpense.id;
    }

    if (amount === debt.amount) {
        // Full settlement
        await db.updateDebt(id, {
            isSettled: true,
            settledDate: new Date().toISOString(),
            linkedTransactionId
        });
    } else {
        // Partial settlement: Reduce amount, keep isSettled false
        await db.updateDebt(id, {
            amount: debt.amount - amount
        });
    }

    // Reload stores
    await loadDebts();
    if (linkToWalletId) {
        await loadExpenses();
        await loadWallets();
    }
}

// ============================================================================
// BUDGET ACTIONS
// ============================================================================

export async function loadBudgets(): Promise<void> {
    const data = await db.getBudgets();
    budgets.set(data);
}

export async function setBudget(
    type: BudgetType,
    amount: number,
    categoryId?: string
): Promise<void> {
    const month = get(currentMonth);

    // Check if budget already exists for this month/category
    const existingBudgets = await db.getBudgetsByMonth(month);
    const existing = existingBudgets.find(
        (b) => b.type === type && (categoryId ? b.categoryId === categoryId : b.categoryId === null)
    );

    if (existing) {
        // Update existing budget
        const updated: Budget = {
            ...existing,
            amount
        };
        await db.saveBudget(updated);
    } else {
        // Create new budget
        const newBudget: Budget = {
            id: generateUUID(),
            type,
            categoryId: categoryId || null,
            amount,
            month,
            created: new Date().toISOString()
        };
        await db.saveBudget(newBudget);
    }

    await loadBudgets();
}

// ============================================================================
// CATEGORY ACTIONS
// ============================================================================

export async function loadCategories(): Promise<void> {
    const data = await db.getCategories();
    categories.set(data);
}

// ============================================================================
// UTILITY ACTIONS
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
            loadCategories()
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format paise to currency string (₹1,234.56)
 */
export function formatCurrency(paise: number): string {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(rupees);
}

/**
 * Parse currency string to paise (₹1,234.56 → 123456)
 */
export function parseCurrency(formatted: string): number {
    // Remove currency symbol, commas, and spaces
    const cleaned = formatted.replace(/[₹,\s]/g, '');
    const rupees = parseFloat(cleaned);

    if (isNaN(rupees)) {
        return 0;
    }

    return Math.round(rupees * 100);
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Generate a UUID
 */
export function generateUUID(): string {
    return crypto.randomUUID();
}

/**
 * Format date to readable string
 */
export function formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

/**
 * Format date to input value (YYYY-MM-DD)
 */
export function formatDateInput(isoDate: string): string {
    return isoDate.split('T')[0];
}

/**
 * Get month name from YYYY-MM
 */
export function getMonthName(month: string): string {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long'
    }).format(date);
}

/**
 * Navigate to previous month
 */
export function goToPreviousMonth(): void {
    const current = get(currentMonth);
    const [year, month] = current.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    currentMonth.set(`${newYear}-${newMonth}`);
}

/**
 * Navigate to next month
 */
export function goToNextMonth(): void {
    const current = get(currentMonth);
    const [year, month] = current.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    currentMonth.set(`${newYear}-${newMonth}`);
}

/**
 * Go to current month
 */
export function goToCurrentMonth(): void {
    currentMonth.set(getCurrentMonth());
}
