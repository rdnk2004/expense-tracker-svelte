// TypeScript type definitions for the Finance Tracker

// ============================================================================
// HELPER TYPES
// ============================================================================

export type WalletType = 'upi' | 'cash';
export type DebtDirection = 'give' | 'receive';
export type BudgetType = 'overall' | 'category';

// ============================================================================
// DATA MODELS
// ============================================================================

/**
 * Wallet - Represents a payment method (UPI or Cash)
 * All amounts stored as integers in paise (₹1 = 100 paise)
 */
export interface Wallet {
    id: string; // UUID
    name: string; // 'UPI' or 'Cash'
    balance: number; // in paise
    updated: string; // ISO date string
    created: string; // ISO date string
}

/**
 * Category - Expense categories with subcategories
 */
export interface Category {
    id: string;
    name: string;
    subcategories: string[];
    color: string; // hex color code
    icon: string; // emoji
    isDefault: boolean;
}

/**
 * Expense - Individual expense transaction
 */
export interface Expense {
    id: string; // UUID
    amount: number; // in paise
    walletId: string;
    categoryId: string;
    subcategory: string | null;
    date: string; // ISO date string
    note: string | null;
    created: string; // ISO date string
}

/**
 * Transfer - Money transfer between wallets
 */
export interface Transfer {
    id: string; // UUID
    fromWalletId: string;
    toWalletId: string;
    amount: number; // in paise
    date: string; // ISO date string
    note: string | null;
    created: string; // ISO date string
}

/**
 * Debt - Track money owed to/from others
 */
export interface Debt {
    id: string; // UUID
    person: string;
    amount: number; // in paise
    direction: DebtDirection; // 'give' = I owe them, 'receive' = They owe me
    date: string; // ISO date string
    note: string | null;
    isSettled: boolean;
    settledDate: string | null; // ISO date string when settled
    linkedTransactionId: string | null; // Link to expense/transfer if settled
    created: string; // ISO date string
}

/**
 * Budget - Monthly budget limits
 */
export interface Budget {
    id: string; // UUID
    type: BudgetType; // 'overall' or 'category'
    categoryId: string | null; // null if type is 'overall'
    amount: number; // in paise
    month: string; // 'YYYY-MM' format
    created: string; // ISO date string
}

/**
 * MonthlySummary - Pre-computed monthly statistics
 * Used for performance optimization - avoid recalculating every time
 */
export interface MonthlySummary {
    month: string; // 'YYYY-MM' format
    totalExpenses: number; // in paise
    categoryBreakdown: Record<string, number>; // categoryId -> total amount in paise
    walletBreakdown: Record<string, number>; // walletId -> total spent from wallet in paise
    isDirty: boolean; // true if data changed and needs recomputation
    lastComputed: string; // ISO date string
}

/**
 * AppMetadata - Application-level metadata
 */
export interface AppMetadata {
    schemaVersion: number; // Current schema version for migrations
    lastMigrated: string; // ISO date string of last migration
    created: string; // ISO date string when app was first initialized
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Helper type for creating new records (without id and timestamps)
 */
export type NewWallet = Omit<Wallet, 'id' | 'created' | 'updated'>;
export type NewCategory = Omit<Category, 'id'>;
export type NewExpense = Omit<Expense, 'id' | 'created'>;
export type NewTransfer = Omit<Transfer, 'id' | 'created'>;
export type NewDebt = Omit<Debt, 'id' | 'created'>;
export type NewBudget = Omit<Budget, 'id' | 'created'>;

/**
 * Helper type for partial updates (everything optional except id)
 */
export type UpdateWallet = Partial<Omit<Wallet, 'id' | 'created'>> & { id: string };
export type UpdateCategory = Partial<Omit<Category, 'id'> & { id: string }>;
export type UpdateExpense = Partial<Omit<Expense, 'id' | 'created'>> & { id: string };
export type UpdateTransfer = Partial<Omit<Transfer, 'id' | 'created'>> & { id: string };
export type UpdateDebt = Partial<Omit<Debt, 'id' | 'created'>> & { id: string };
export type UpdateBudget = Partial<Omit<Budget, 'id' | 'created'>> & { id: string };

/**
 * Date range filter
 */
export interface DateRange {
    start: string; // ISO date string
    end: string; // ISO date string
}

/**
 * Filter options for queries
 */
export interface ExpenseFilter {
    walletIds?: string[];
    categoryIds?: string[];
    dateRange?: DateRange;
    minAmount?: number; // in paise
    maxAmount?: number; // in paise
    searchText?: string; // search in notes
}

export interface DebtFilter {
    direction?: DebtDirection;
    isSettled?: boolean;
    personName?: string;
}

/**
 * Statistics and analytics types
 */
export interface CategorySpending {
    categoryId: string;
    categoryName: string;
    amount: number; // in paise
    percentage: number; // percentage of total
    color: string;
    icon: string;
}

export interface WalletSpending {
    walletId: string;
    walletName: string;
    amount: number; // in paise
    percentage: number;
}

export interface DailyExpense {
    date: string; // ISO date string
    amount: number; // in paise
}

export interface MonthlyStats {
    month: string; // 'YYYY-MM'
    totalExpenses: number; // in paise
    totalTransfers: number; // in paise
    categorySpending: CategorySpending[];
    walletSpending: WalletSpending[];
    dailyExpenses: DailyExpense[];
    budgetStatus: {
        budgetId: string;
        budgetAmount: number;
        spent: number;
        remaining: number;
        percentage: number;
    }[];
}

/**
 * UI State types
 */
export interface UIState {
    currentView: 'dashboard' | 'expenses' | 'wallets' | 'debts' | 'budgets' | 'reports';
    selectedMonth: string; // 'YYYY-MM'
    isLoading: boolean;
    sidebarOpen: boolean;
}
