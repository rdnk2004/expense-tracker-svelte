// Svelte stores with IndexedDB integration for Finance Tracker (Core Module)
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
        const totalExpenses = $currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

        const categoryBreakdown: Record<string, number> = {};
        const walletBreakdown: Record<string, number> = {};

        $currentMonthExpenses.forEach((expense) => {
            categoryBreakdown[expense.categoryId] =
                (categoryBreakdown[expense.categoryId] || 0) + expense.amount;

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
// INCOME / TRANSFER ACTIONS
// ============================================================================

export async function addIncome(
    data: { walletId: string; amount: number; date: string; source: string; note: string }
): Promise<void> {
    const wallet = await db.getWallet(data.walletId);
    if (wallet) {
        const newBalance = wallet.balance + data.amount;
        await db.updateWalletBalance(wallet.id, newBalance);

        const incomeRecord: Expense = {
            id: generateUUID(),
            amount: data.amount,
            walletId: data.walletId,
            categoryId: 'income',
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
    const fromWallet = await db.getWallet(fromWalletId);
    if (!fromWallet || fromWallet.balance < amount) {
        throw new Error('Insufficient balance in source wallet');
    }

    const newTransfer: Transfer = {
        id: generateUUID(),
        fromWalletId,
        toWalletId,
        amount,
        date,
        note: note || null,
        created: new Date().toISOString()
    };

    const toWallet = await db.getWallet(toWalletId);
    if (!toWallet) {
        throw new Error('Destination wallet not found');
    }

    await db.updateWalletBalance(fromWalletId, fromWallet.balance - amount);
    await db.updateWalletBalance(toWalletId, toWallet.balance + amount);

    await db.saveTransfer(newTransfer);

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

    if (linkToWalletId) {
        const settlementExpense: Expense = {
            id: generateUUID(),
            amount: amount,
            walletId: linkToWalletId,
            categoryId: 'cat-other',
            subcategory: null,
            date: new Date().toISOString(),
            note: `Settlement: ${debt.person} (${amount < debt.amount ? 'Partial' : 'Full'})`,
            created: new Date().toISOString()
        };

        const wallet = await db.getWallet(linkToWalletId);
        if (wallet) {
            await db.updateWalletBalance(wallet.id, wallet.balance - amount);
        }

        await db.saveExpense(settlementExpense);
        linkedTransactionId = settlementExpense.id;
    }

    if (amount === debt.amount) {
        await db.updateDebt(id, {
            isSettled: true,
            settledDate: new Date().toISOString(),
            linkedTransactionId
        });
    } else {
        await db.updateDebt(id, {
            amount: debt.amount - amount
        });
    }

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

    const existingBudgets = await db.getBudgetsByMonth(month);
    const existing = existingBudgets.find(
        (b) => b.type === type && (categoryId ? b.categoryId === categoryId : b.categoryId === null)
    );

    if (existing) {
        const updated: Budget = {
            ...existing,
            amount
        };
        await db.saveBudget(updated);
    } else {
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
// HELPER FUNCTIONS
// ============================================================================

export function formatCurrency(paise: number): string {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(rupees);
}

export function parseCurrency(formatted: string): number {
    const cleaned = formatted.replace(/[₹,\s]/g, '');
    const rupees = parseFloat(cleaned);

    if (isNaN(rupees)) {
        return 0;
    }

    return Math.round(rupees * 100);
}

export function getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

export function generateUUID(): string {
    return crypto.randomUUID();
}

export function formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

export function formatDateInput(isoDate: string): string {
    return isoDate.split('T')[0];
}

export function getMonthName(month: string): string {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long'
    }).format(date);
}

export function goToPreviousMonth(): void {
    const current = get(currentMonth);
    const [year, month] = current.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    currentMonth.set(`${newYear}-${newMonth}`);
}

export function goToNextMonth(): void {
    const current = get(currentMonth);
    const [year, month] = current.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    currentMonth.set(`${newYear}-${newMonth}`);
}

export function goToCurrentMonth(): void {
    currentMonth.set(getCurrentMonth());
}
