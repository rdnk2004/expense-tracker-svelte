// IndexedDB data layer using idb-keyval for the Finance Tracker
import { createStore, get, set, del, keys } from 'idb-keyval';
import type {
    Wallet,
    Category,
    Expense,
    Transfer,
    Debt,
    Budget,
    MonthlySummary,
    AppMetadata
} from '$lib/types';

// ============================================================================
// CUSTOM STORE SETUP
// ============================================================================

const customStore = createStore('finance-tracker-db', 'finance-tracker-store');

// Storage keys
const KEYS = {
    WALLETS: 'wallets',
    EXPENSES: 'expenses',
    TRANSFERS: 'transfers',
    DEBTS: 'debts',
    BUDGETS: 'budgets',
    CATEGORIES: 'categories',
    SUMMARIES: 'summaries', // Map of month -> MonthlySummary
    METADATA: 'metadata'
} as const;

// Schema version
const CURRENT_SCHEMA_VERSION = 1;

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_CATEGORIES: Category[] = [
    {
        id: 'cat-food',
        name: 'Food',
        subcategories: ['Tea', 'Breakfast', 'Snacks', 'Lunch', 'Dinner'],
        color: '#FF6B6B',
        icon: '🍽️',
        isDefault: true
    },
    {
        id: 'cat-entertainment',
        name: 'Entertainment',
        subcategories: ['Cinema', 'Turf', 'Games', 'Subscription'],
        color: '#4ECDC4',
        icon: '🎮',
        isDefault: true
    },
    {
        id: 'cat-home',
        name: 'Home',
        subcategories: [],
        color: '#95E1D3',
        icon: '🏠',
        isDefault: true
    },
    {
        id: 'cat-transport',
        name: 'Transport',
        subcategories: ['Fuel', 'Auto', 'Bus', 'Parking'],
        color: '#F38181',
        icon: '🚗',
        isDefault: true
    },
    {
        id: 'cat-shopping',
        name: 'Shopping',
        subcategories: ['Clothes', 'Electronics', 'Groceries'],
        color: '#AA96DA',
        icon: '🛍️',
        isDefault: true
    },
    {
        id: 'cat-other',
        name: 'Other',
        subcategories: [],
        color: '#FCBAD3',
        icon: '📦',
        isDefault: true
    }
];

const DEFAULT_WALLETS: Wallet[] = [
    {
        id: 'wallet-upi',
        name: 'UPI',
        balance: 0, // in paise
        updated: new Date().toISOString(),
        created: new Date().toISOString()
    },
    {
        id: 'wallet-cash',
        name: 'Cash',
        balance: 0, // in paise
        updated: new Date().toISOString(),
        created: new Date().toISOString()
    }
];

// ============================================================================
// WALLET OPERATIONS
// ============================================================================

export async function getWallets(): Promise<Wallet[]> {
    const wallets = await get<Wallet[]>(KEYS.WALLETS, customStore);
    return wallets || [];
}

export async function getWallet(id: string): Promise<Wallet | null> {
    const wallets = await getWallets();
    return wallets.find((w) => w.id === id) || null;
}

export async function saveWallet(wallet: Wallet): Promise<void> {
    const wallets = await getWallets();
    const index = wallets.findIndex((w) => w.id === wallet.id);

    if (index >= 0) {
        wallets[index] = { ...wallet, updated: new Date().toISOString() };
    } else {
        wallets.push(wallet);
    }

    await set(KEYS.WALLETS, wallets, customStore);
}

export async function updateWalletBalance(id: string, newBalance: number): Promise<void> {
    const wallets = await getWallets();
    const index = wallets.findIndex((w) => w.id === id);

    if (index >= 0) {
        wallets[index].balance = newBalance;
        wallets[index].updated = new Date().toISOString();
        await set(KEYS.WALLETS, wallets, customStore);
    }
}

// ============================================================================
// EXPENSE OPERATIONS
// ============================================================================

export async function getExpenses(): Promise<Expense[]> {
    const expenses = await get<Expense[]>(KEYS.EXPENSES, customStore);
    return expenses || [];
}

export async function getExpensesByMonth(month: string): Promise<Expense[]> {
    const expenses = await getExpenses();
    return expenses.filter((e) => e.date.startsWith(month));
}

export async function saveExpense(expense: Expense): Promise<void> {
    const expenses = await getExpenses();
    const index = expenses.findIndex((e) => e.id === expense.id);

    if (index >= 0) {
        expenses[index] = expense;
    } else {
        expenses.push(expense);
    }

    await set(KEYS.EXPENSES, expenses, customStore);

    // Mark the month's summary as dirty
    const month = expense.date.substring(0, 7); // 'YYYY-MM'
    await markSummaryDirty(month);
}

export async function deleteExpense(id: string): Promise<void> {
    const expenses = await getExpenses();
    const expense = expenses.find((e) => e.id === id);

    if (expense) {
        const filtered = expenses.filter((e) => e.id !== id);
        await set(KEYS.EXPENSES, filtered, customStore);

        // Mark the month's summary as dirty
        const month = expense.date.substring(0, 7);
        await markSummaryDirty(month);
    }
}

// ============================================================================
// TRANSFER OPERATIONS
// ============================================================================

export async function getTransfers(): Promise<Transfer[]> {
    const transfers = await get<Transfer[]>(KEYS.TRANSFERS, customStore);
    return transfers || [];
}

export async function saveTransfer(transfer: Transfer): Promise<void> {
    const transfers = await getTransfers();
    const index = transfers.findIndex((t) => t.id === transfer.id);

    if (index >= 0) {
        transfers[index] = transfer;
    } else {
        transfers.push(transfer);
    }

    await set(KEYS.TRANSFERS, transfers, customStore);

    // Mark the month's summary as dirty
    const month = transfer.date.substring(0, 7);
    await markSummaryDirty(month);
}

// ============================================================================
// DEBT OPERATIONS
// ============================================================================

export async function getDebts(): Promise<Debt[]> {
    const debts = await get<Debt[]>(KEYS.DEBTS, customStore);
    return debts || [];
}

export async function saveDebt(debt: Debt): Promise<void> {
    const debts = await getDebts();
    const index = debts.findIndex((d) => d.id === debt.id);

    if (index >= 0) {
        debts[index] = debt;
    } else {
        debts.push(debt);
    }

    await set(KEYS.DEBTS, debts, customStore);
}

export async function updateDebt(id: string, updates: Partial<Debt>): Promise<void> {
    const debts = await getDebts();
    const index = debts.findIndex((d) => d.id === id);

    if (index >= 0) {
        debts[index] = { ...debts[index], ...updates };
        await set(KEYS.DEBTS, debts, customStore);
    }
}

// ============================================================================
// BUDGET OPERATIONS
// ============================================================================

export async function getBudgets(): Promise<Budget[]> {
    const budgets = await get<Budget[]>(KEYS.BUDGETS, customStore);
    return budgets || [];
}

export async function getBudgetsByMonth(month: string): Promise<Budget[]> {
    const budgets = await getBudgets();
    return budgets.filter((b) => b.month === month);
}

export async function saveBudget(budget: Budget): Promise<void> {
    const budgets = await getBudgets();
    const index = budgets.findIndex((b) => b.id === budget.id);

    if (index >= 0) {
        budgets[index] = budget;
    } else {
        budgets.push(budget);
    }

    await set(KEYS.BUDGETS, budgets, customStore);
}

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

export async function getCategories(): Promise<Category[]> {
    const categories = await get<Category[]>(KEYS.CATEGORIES, customStore);
    return categories || [];
}

export async function saveCategory(category: Category): Promise<void> {
    const categories = await getCategories();
    const index = categories.findIndex((c) => c.id === category.id);

    if (index >= 0) {
        categories[index] = category;
    } else {
        categories.push(category);
    }

    await set(KEYS.CATEGORIES, categories, customStore);
}

export async function initializeDefaultCategories(): Promise<void> {
    const existing = await getCategories();
    if (existing.length === 0) {
        await set(KEYS.CATEGORIES, DEFAULT_CATEGORIES, customStore);
    }
}

// ============================================================================
// SUMMARY OPERATIONS
// ============================================================================

export async function getMonthlySummary(month: string): Promise<MonthlySummary | null> {
    const summaries = await get<Record<string, MonthlySummary>>(KEYS.SUMMARIES, customStore);
    return summaries?.[month] || null;
}

export async function saveMonthlySummary(summary: MonthlySummary): Promise<void> {
    const summaries = (await get<Record<string, MonthlySummary>>(KEYS.SUMMARIES, customStore)) || {};
    summaries[summary.month] = summary;
    await set(KEYS.SUMMARIES, summaries, customStore);
}

export async function markSummaryDirty(month: string): Promise<void> {
    const summary = await getMonthlySummary(month);
    if (summary) {
        summary.isDirty = true;
        await saveMonthlySummary(summary);
    } else {
        // Create a new dirty summary
        const newSummary: MonthlySummary = {
            month,
            totalExpenses: 0,
            categoryBreakdown: {},
            walletBreakdown: {},
            isDirty: true,
            lastComputed: new Date().toISOString()
        };
        await saveMonthlySummary(newSummary);
    }
}

// ============================================================================
// METADATA OPERATIONS
// ============================================================================

export async function getMetadata(): Promise<AppMetadata | null> {
    const metadata = await get<AppMetadata>(KEYS.METADATA, customStore);
    return metadata || null;
}

export async function saveMetadata(metadata: AppMetadata): Promise<void> {
    await set(KEYS.METADATA, metadata, customStore);
}

// ============================================================================
// UTILITY OPERATIONS
// ============================================================================

export async function exportAllData(): Promise<object> {
    const data = {
        wallets: await getWallets(),
        expenses: await getExpenses(),
        transfers: await getTransfers(),
        debts: await getDebts(),
        budgets: await getBudgets(),
        categories: await getCategories(),
        summaries: await get<Record<string, MonthlySummary>>(KEYS.SUMMARIES, customStore),
        metadata: await getMetadata()
    };
    return data;
}

export async function importAllData(data: any): Promise<void> {
    if (data.wallets) await set(KEYS.WALLETS, data.wallets, customStore);
    if (data.expenses) await set(KEYS.EXPENSES, data.expenses, customStore);
    if (data.transfers) await set(KEYS.TRANSFERS, data.transfers, customStore);
    if (data.debts) await set(KEYS.DEBTS, data.debts, customStore);
    if (data.budgets) await set(KEYS.BUDGETS, data.budgets, customStore);
    if (data.categories) await set(KEYS.CATEGORIES, data.categories, customStore);
    if (data.summaries) await set(KEYS.SUMMARIES, data.summaries, customStore);
    if (data.metadata) await set(KEYS.METADATA, data.metadata, customStore);
}

export async function clearAllData(): Promise<void> {
    await set(KEYS.WALLETS, [], customStore);
    await set(KEYS.EXPENSES, [], customStore);
    await set(KEYS.TRANSFERS, [], customStore);
    await set(KEYS.DEBTS, [], customStore);
    await set(KEYS.BUDGETS, [], customStore);
    await set(KEYS.CATEGORIES, [], customStore);
    await set(KEYS.SUMMARIES, {}, customStore);
    await del(KEYS.METADATA, customStore);
}

// ============================================================================
// INITIALIZATION & MIGRATION
// ============================================================================

/**
 * Initialize the database with default data if needed
 */
export async function initializeDatabase(): Promise<void> {
    const metadata = await getMetadata();

    if (!metadata) {
        // First time initialization
        const newMetadata: AppMetadata = {
            schemaVersion: CURRENT_SCHEMA_VERSION,
            lastMigrated: new Date().toISOString(),
            created: new Date().toISOString()
        };
        await saveMetadata(newMetadata);

        // Initialize default categories
        await initializeDefaultCategories();

        // Initialize default wallets
        await set(KEYS.WALLETS, DEFAULT_WALLETS, customStore);

        // Initialize empty arrays
        await set(KEYS.EXPENSES, [], customStore);
        await set(KEYS.TRANSFERS, [], customStore);
        await set(KEYS.DEBTS, [], customStore);
        await set(KEYS.BUDGETS, [], customStore);
        await set(KEYS.SUMMARIES, {}, customStore);

        console.log('✅ Database initialized with default data');
    } else if (metadata.schemaVersion < CURRENT_SCHEMA_VERSION) {
        // Run migrations
        await runMigrations(metadata.schemaVersion);
    }
}

/**
 * Run database migrations from oldVersion to CURRENT_SCHEMA_VERSION
 */
async function runMigrations(fromVersion: number): Promise<void> {
    console.log(`🔄 Running migrations from v${fromVersion} to v${CURRENT_SCHEMA_VERSION}`);

    // Future migrations will go here
    // Example:
    // if (fromVersion < 2) {
    //   await migrateToV2();
    // }
    // if (fromVersion < 3) {
    //   await migrateToV3();
    // }

    // Update metadata
    const metadata = await getMetadata();
    if (metadata) {
        metadata.schemaVersion = CURRENT_SCHEMA_VERSION;
        metadata.lastMigrated = new Date().toISOString();
        await saveMetadata(metadata);
    }

    console.log('✅ Migrations complete');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a UUID v4
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Get current ISO date string
 */
export function getCurrentDateISO(): string {
    return new Date().toISOString();
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
 * Convert paise to rupees
 */
export function paiseToRupees(paise: number): number {
    return paise / 100;
}

/**
 * Convert rupees to paise
 */
export function rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
}
