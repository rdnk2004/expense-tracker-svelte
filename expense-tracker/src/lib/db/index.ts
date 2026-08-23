// IndexedDB data layer using idb-keyval for the Student Finance & Wealth Intelligence OS
import { createStore, get, set, del, keys } from 'idb-keyval';
import type {
    Wallet,
    Category,
    Expense,
    Income,
    Transfer,
    Debt,
    Budget,
    MonthlySummary,
    AppMetadata,
    StudentProfile,
    Subscription,
    SavingsGoal,
    GoalContribution,
    BillSplit,
    FinancialBadge
} from '$lib/types';

// ============================================================================
// CUSTOM STORE SETUP
// ============================================================================

const customStore = createStore('finance-tracker-db', 'finance-tracker-store');

// Storage keys
const KEYS = {
    WALLETS: 'wallets',
    EXPENSES: 'expenses',
    INCOME: 'income',
    TRANSFERS: 'transfers',
    DEBTS: 'debts',
    BUDGETS: 'budgets',
    CATEGORIES: 'categories',
    SUMMARIES: 'summaries', // Map of month -> MonthlySummary
    METADATA: 'metadata',
    STUDENT_PROFILE: 'student_profile',
    SUBSCRIPTIONS: 'subscriptions',
    GOALS: 'goals',
    BILL_SPLITS: 'bill_splits',
    BADGES: 'badges'
} as const;

// Schema version
const CURRENT_SCHEMA_VERSION = 3;

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_CATEGORIES: Category[] = [
    {
        id: 'cat-food',
        name: 'Food & Canteen',
        subcategories: ['Tea & Chai', 'Breakfast', 'Canteen', 'Lunch', 'Dinner', 'Late Night Swiggy'],
        color: '#FF6B6B',
        icon: 'Utensils',
        isDefault: true,
        bucketType: 'survival'
    },
    {
        id: 'cat-entertainment',
        name: 'Fun & Outings',
        subcategories: ['Cinema', 'Turf & Gaming', 'Clubbing', 'Weekend Trips', 'Events'],
        color: '#4ECDC4',
        icon: 'Gamepad2',
        isDefault: true,
        bucketType: 'fun'
    },
    {
        id: 'cat-academics',
        name: 'Academics & Skills',
        subcategories: ['Books & Notes', 'Printing/Stationery', 'Course/Certifications', 'Hackathons'],
        color: '#3B82F6',
        icon: 'GraduationCap',
        isDefault: true,
        bucketType: 'survival'
    },
    {
        id: 'cat-home',
        name: 'Hostel & Living',
        subcategories: ['Rent/Mess', 'Laundry', 'Room Groceries', 'Utilities'],
        color: '#95E1D3',
        icon: 'Home',
        isDefault: true,
        bucketType: 'survival'
    },
    {
        id: 'cat-transport',
        name: 'Transport',
        subcategories: ['Fuel', 'Auto/Cab', 'Bus/Metro', 'Train Tickets', 'Parking'],
        color: '#F38181',
        icon: 'Car',
        isDefault: true,
        bucketType: 'survival'
    },
    {
        id: 'cat-shopping',
        name: 'Lifestyle & Clothes',
        subcategories: ['Clothes', 'Electronics', 'Personal Care', 'Accessories'],
        color: '#AA96DA',
        icon: 'ShoppingBag',
        isDefault: true,
        bucketType: 'fun'
    },
    {
        id: 'cat-subscriptions',
        name: 'Subscriptions',
        subcategories: ['Spotify', 'Netflix', 'ChatGPT/AI', 'iCloud/Cloud', 'WiFi'],
        color: '#8B5CF6',
        icon: 'Smartphone',
        isDefault: true,
        bucketType: 'fun'
    },
    {
        id: 'cat-savings',
        name: 'Sinking Funds & Buffer',
        subcategories: ['Goa Trip Fund', 'Tech Upgrade', 'Emergency Buffer', 'SIP/Investments'],
        color: '#10B981',
        icon: 'PiggyBank',
        isDefault: true,
        bucketType: 'future'
    },
    {
        id: 'cat-other',
        name: 'Other Discretionary',
        subcategories: ['Misc', 'Gifts', 'Chits'],
        color: '#FCBAD3',
        icon: 'Package',
        isDefault: true,
        bucketType: 'fun'
    }
];

const DEFAULT_WALLETS: Wallet[] = [
    {
        id: 'wallet-upi',
        name: 'UPI / GPay / PhonePe',
        balance: 0, // in paise
        updated: new Date().toISOString(),
        created: new Date().toISOString()
    },
    {
        id: 'wallet-cash',
        name: 'Pocket Cash',
        balance: 0, // in paise
        updated: new Date().toISOString(),
        created: new Date().toISOString()
    }
];

const DEFAULT_STUDENT_PROFILE: StudentProfile = {
    id: 'default-student-profile',
    monthlyAllowance: 800000, // ₹8,000 in paise
    allowanceDay: 1, // 1st of month
    hourlyWageRate: 20000, // ₹200/hr in paise
    collegeName: 'Campus Student',
    semester: 'Semester 4',
    currencySymbol: '₹',
    targetSavingsPercent: 20,
    survivalBucketPercent: 50,
    funBucketPercent: 30,
    futureBucketPercent: 20,
    updated: new Date().toISOString()
};

const DEFAULT_BADGES: FinancialBadge[] = [
    {
        id: 'badge-first-step',
        title: 'Campus Scout',
        description: 'Logged your first 3 expenses with mindful value tags',
        icon: 'Compass',
        isUnlocked: false,
        category: 'discipline'
    },
    {
        id: 'badge-runway-master',
        title: 'Runway Pilot',
        description: 'Maintained a positive daily safe spend for 14 straight days',
        icon: 'Plane',
        isUnlocked: false,
        category: 'runway'
    },
    {
        id: 'badge-zero-debt',
        title: 'Zero Debt Hero',
        description: 'Settled all pending friend tab debts within 48 hours',
        icon: 'ShieldCheck',
        isUnlocked: false,
        category: 'debt'
    },
    {
        id: 'badge-boba-restraint',
        title: 'Impulse Shield',
        description: 'Zero regretted expenses logged across an entire week',
        icon: 'Sparkles',
        isUnlocked: false,
        category: 'discipline'
    },
    {
        id: 'badge-savings-streak',
        title: 'Future Architect',
        description: 'Allocated 20%+ of your allowance into sinking fund goals',
        icon: 'PiggyBank',
        isUnlocked: false,
        category: 'savings'
    },
    {
        id: 'badge-semester-survivor',
        title: 'Semester Survivor',
        description: 'Finished the month without exhausting your emergency buffer',
        icon: 'Award',
        isUnlocked: false,
        category: 'runway'
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

export async function addExpense(expenseData: Omit<Expense, 'id' | 'created'>): Promise<Expense> {
    const newExpense: Expense = {
        ...expenseData,
        id: generateId(),
        created: getCurrentDateISO()
    };
    await saveExpense(newExpense);
    return newExpense;
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const expenses = await getExpenses();
    const index = expenses.findIndex((e) => e.id === id);
    if (index >= 0) {
        expenses[index] = { ...expenses[index], ...updates };
        await saveExpense(expenses[index]);
        return expenses[index];
    }
    return null;
}

export async function deleteExpense(id: string): Promise<boolean> {
    const expenses = await getExpenses();
    const expense = expenses.find((e) => e.id === id);

    if (expense) {
        const filtered = expenses.filter((e) => e.id !== id);
        await set(KEYS.EXPENSES, filtered, customStore);

        // Mark the month's summary as dirty
        const month = expense.date.substring(0, 7);
        await markSummaryDirty(month);
        return true;
    }
    return false;
}

// ============================================================================
// INCOME OPERATIONS
// ============================================================================

export async function getIncome(): Promise<Income[]> {
    const income = await get<Income[]>(KEYS.INCOME, customStore);
    return income || [];
}

export async function saveIncome(incomeItem: Income): Promise<void> {
    const incomeList = await getIncome();
    const index = incomeList.findIndex((i) => i.id === incomeItem.id);

    if (index >= 0) {
        incomeList[index] = incomeItem;
    } else {
        incomeList.push(incomeItem);
    }

    await set(KEYS.INCOME, incomeList, customStore);
}

export async function addIncome(incomeData: Omit<Income, 'id' | 'created'>): Promise<Income> {
    const newIncome: Income = {
        ...incomeData,
        id: generateId(),
        created: getCurrentDateISO()
    };
    await saveIncome(newIncome);
    return newIncome;
}

export async function updateIncome(id: string, updates: Partial<Income>): Promise<Income | null> {
    const list = await getIncome();
    const index = list.findIndex((i) => i.id === id);
    if (index >= 0) {
        list[index] = { ...list[index], ...updates };
        await saveIncome(list[index]);
        return list[index];
    }
    return null;
}

export async function deleteIncome(id: string): Promise<boolean> {
    const list = await getIncome();
    const item = list.find((i) => i.id === id);

    if (item) {
        const filtered = list.filter((i) => i.id !== id);
        await set(KEYS.INCOME, filtered, customStore);
        return true;
    }
    return false;
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

export async function addDebt(debtData: Omit<Debt, 'id' | 'created'>): Promise<Debt> {
    const newDebt: Debt = {
        ...debtData,
        id: generateId(),
        created: getCurrentDateISO()
    };
    await saveDebt(newDebt);
    return newDebt;
}

export async function updateDebt(id: string, updates: Partial<Debt>): Promise<void> {
    const debts = await getDebts();
    const index = debts.findIndex((d) => d.id === id);

    if (index >= 0) {
        debts[index] = { ...debts[index], ...updates };
        await set(KEYS.DEBTS, debts, customStore);
    }
}

export async function deleteDebt(id: string): Promise<boolean> {
    const debts = await getDebts();
    const filtered = debts.filter((d) => d.id !== id);
    if (filtered.length !== debts.length) {
        await set(KEYS.DEBTS, filtered, customStore);
        return true;
    }
    return false;
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

export async function addCategory(categoryData: Omit<Category, 'id'>): Promise<Category> {
    const newCategory: Category = {
        ...categoryData,
        id: generateId()
    };
    await saveCategory(newCategory);
    return newCategory;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const categories = await getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index >= 0) {
        categories[index] = { ...categories[index], ...updates };
        await saveCategory(categories[index]);
        return categories[index];
    }
    return null;
}

export async function deleteCategory(id: string): Promise<boolean> {
    const categories = await getCategories();
    const cat = categories.find((c) => c.id === id);
    if (cat) {
        const filtered = categories.filter((c) => c.id !== id);
        await set(KEYS.CATEGORIES, filtered, customStore);
        return true;
    }
    return false;
}

export async function initializeDefaultCategories(): Promise<void> {
    const existing = await getCategories();
    if (existing.length === 0) {
        await set(KEYS.CATEGORIES, DEFAULT_CATEGORIES, customStore);
    }
}

// ============================================================================
// STUDENT PROFILE OPERATIONS
// ============================================================================

export async function getStudentProfile(): Promise<StudentProfile> {
    const profile = await get<StudentProfile>(KEYS.STUDENT_PROFILE, customStore);
    return profile || DEFAULT_STUDENT_PROFILE;
}

export async function saveStudentProfile(profile: Partial<StudentProfile>): Promise<StudentProfile> {
    const existing = await getStudentProfile();
    const updated: StudentProfile = {
        ...existing,
        ...profile,
        updated: getCurrentDateISO()
    };
    await set(KEYS.STUDENT_PROFILE, updated, customStore);
    return updated;
}

// ============================================================================
// SUBSCRIPTION & MICRO-LEAKAGE OPERATIONS
// ============================================================================

export async function getSubscriptions(): Promise<Subscription[]> {
    const subs = await get<Subscription[]>(KEYS.SUBSCRIPTIONS, customStore);
    return subs || [];
}

export async function saveSubscription(sub: Subscription): Promise<void> {
    const list = await getSubscriptions();
    const index = list.findIndex((s) => s.id === sub.id);
    if (index >= 0) {
        list[index] = sub;
    } else {
        list.push(sub);
    }
    await set(KEYS.SUBSCRIPTIONS, list, customStore);
}

export async function addSubscription(subData: Omit<Subscription, 'id' | 'created'>): Promise<Subscription> {
    const newSub: Subscription = {
        ...subData,
        id: generateId(),
        created: getCurrentDateISO()
    };
    await saveSubscription(newSub);
    return newSub;
}

export async function updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    const list = await getSubscriptions();
    const index = list.findIndex((s) => s.id === id);
    if (index >= 0) {
        list[index] = { ...list[index], ...updates };
        await set(KEYS.SUBSCRIPTIONS, list, customStore);
        return list[index];
    }
    return null;
}

export async function deleteSubscription(id: string): Promise<boolean> {
    const list = await getSubscriptions();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length !== list.length) {
        await set(KEYS.SUBSCRIPTIONS, filtered, customStore);
        return true;
    }
    return false;
}

// ============================================================================
// SAVINGS GOALS & SINKING FUNDS OPERATIONS
// ============================================================================

export async function getGoals(): Promise<SavingsGoal[]> {
    const goals = await get<SavingsGoal[]>(KEYS.GOALS, customStore);
    return goals || [];
}

export async function saveGoal(goal: SavingsGoal): Promise<void> {
    const goals = await getGoals();
    const index = goals.findIndex((g) => g.id === goal.id);
    if (index >= 0) {
        goals[index] = goal;
    } else {
        goals.push(goal);
    }
    await set(KEYS.GOALS, goals, customStore);
}

export async function addGoal(
    goalData: Omit<SavingsGoal, 'id' | 'created' | 'contributions' | 'currentAmount' | 'isCompleted'>
): Promise<SavingsGoal> {
    const newGoal: SavingsGoal = {
        ...goalData,
        id: generateId(),
        currentAmount: 0,
        contributions: [],
        isCompleted: false,
        created: getCurrentDateISO()
    };
    await saveGoal(newGoal);
    return newGoal;
}

export async function updateGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal | null> {
    const goals = await getGoals();
    const index = goals.findIndex((g) => g.id === id);
    if (index >= 0) {
        goals[index] = { ...goals[index], ...updates };
        await set(KEYS.GOALS, goals, customStore);
        return goals[index];
    }
    return null;
}

export async function addGoalContribution(
    goalId: string,
    amountInPaise: number,
    walletId?: string,
    note?: string
): Promise<SavingsGoal | null> {
    const goals = await getGoals();
    const index = goals.findIndex((g) => g.id === goalId);
    if (index >= 0) {
        const goal = goals[index];
        const contribution: GoalContribution = {
            id: generateId(),
            goalId,
            amount: amountInPaise,
            walletId,
            date: getCurrentDateISO(),
            note
        };
        goal.contributions = [...(goal.contributions || []), contribution];
        goal.currentAmount = (goal.currentAmount || 0) + amountInPaise;
        if (goal.currentAmount >= goal.targetAmount) {
            goal.isCompleted = true;
        }
        await saveGoal(goal);
        return goal;
    }
    return null;
}

export async function deleteGoal(id: string): Promise<boolean> {
    const goals = await getGoals();
    const filtered = goals.filter((g) => g.id !== id);
    if (filtered.length !== goals.length) {
        await set(KEYS.GOALS, filtered, customStore);
        return true;
    }
    return false;
}

// ============================================================================
// BILL SPLITS OPERATIONS
// ============================================================================

export async function getBillSplits(): Promise<BillSplit[]> {
    const splits = await get<BillSplit[]>(KEYS.BILL_SPLITS, customStore);
    return splits || [];
}

export async function saveBillSplit(split: BillSplit): Promise<void> {
    const list = await getBillSplits();
    const index = list.findIndex((s) => s.id === split.id);
    if (index >= 0) {
        list[index] = split;
    } else {
        list.push(split);
    }
    await set(KEYS.BILL_SPLITS, list, customStore);
}

export async function addBillSplit(splitData: Omit<BillSplit, 'id' | 'created'>): Promise<BillSplit> {
    const newSplit: BillSplit = {
        ...splitData,
        id: generateId(),
        created: getCurrentDateISO()
    };
    await saveBillSplit(newSplit);
    return newSplit;
}

export async function deleteBillSplit(id: string): Promise<boolean> {
    const list = await getBillSplits();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length !== list.length) {
        await set(KEYS.BILL_SPLITS, filtered, customStore);
        return true;
    }
    return false;
}

// ============================================================================
// BADGES & GAMIFICATION OPERATIONS
// ============================================================================

export async function getBadges(): Promise<FinancialBadge[]> {
    const badges = await get<FinancialBadge[]>(KEYS.BADGES, customStore);
    return badges || DEFAULT_BADGES;
}

export async function saveBadges(badges: FinancialBadge[]): Promise<void> {
    await set(KEYS.BADGES, badges, customStore);
}

export async function unlockBadge(badgeId: string): Promise<FinancialBadge | null> {
    const badges = await getBadges();
    const badge = badges.find((b) => b.id === badgeId);
    if (badge && !badge.isUnlocked) {
        badge.isUnlocked = true;
        badge.unlockedAt = getCurrentDateISO();
        await saveBadges(badges);
        return badge;
    }
    return null;
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
// UTILITY OPERATIONS (BACKUP & RESTORE)
// ============================================================================

export async function exportAllData(): Promise<object> {
    return {
        wallets: await getWallets(),
        expenses: await getExpenses(),
        income: await getIncome(),
        transfers: await getTransfers(),
        debts: await getDebts(),
        budgets: await getBudgets(),
        categories: await getCategories(),
        studentProfile: await getStudentProfile(),
        subscriptions: await getSubscriptions(),
        goals: await getGoals(),
        billSplits: await getBillSplits(),
        badges: await getBadges(),
        summaries: await get<Record<string, MonthlySummary>>(KEYS.SUMMARIES, customStore),
        metadata: await getMetadata()
    };
}

export async function importAllData(data: any): Promise<void> {
    if (data.wallets) await set(KEYS.WALLETS, data.wallets, customStore);
    if (data.expenses) await set(KEYS.EXPENSES, data.expenses, customStore);
    if (data.income) await set(KEYS.INCOME, data.income, customStore);
    if (data.transfers) await set(KEYS.TRANSFERS, data.transfers, customStore);
    if (data.debts) await set(KEYS.DEBTS, data.debts, customStore);
    if (data.budgets) await set(KEYS.BUDGETS, data.budgets, customStore);
    if (data.categories) await set(KEYS.CATEGORIES, data.categories, customStore);
    if (data.studentProfile) await set(KEYS.STUDENT_PROFILE, data.studentProfile, customStore);
    if (data.subscriptions) await set(KEYS.SUBSCRIPTIONS, data.subscriptions, customStore);
    if (data.goals) await set(KEYS.GOALS, data.goals, customStore);
    if (data.billSplits) await set(KEYS.BILL_SPLITS, data.billSplits, customStore);
    if (data.badges) await set(KEYS.BADGES, data.badges, customStore);
    if (data.summaries) await set(KEYS.SUMMARIES, data.summaries, customStore);
    if (data.metadata) await set(KEYS.METADATA, data.metadata, customStore);
}

export async function clearAllData(): Promise<void> {
    await set(KEYS.WALLETS, [], customStore);
    await set(KEYS.EXPENSES, [], customStore);
    await set(KEYS.INCOME, [], customStore);
    await set(KEYS.TRANSFERS, [], customStore);
    await set(KEYS.DEBTS, [], customStore);
    await set(KEYS.BUDGETS, [], customStore);
    await set(KEYS.CATEGORIES, DEFAULT_CATEGORIES, customStore);
    await set(KEYS.STUDENT_PROFILE, DEFAULT_STUDENT_PROFILE, customStore);
    await set(KEYS.SUBSCRIPTIONS, [], customStore);
    await set(KEYS.GOALS, [], customStore);
    await set(KEYS.BILL_SPLITS, [], customStore);
    await set(KEYS.BADGES, DEFAULT_BADGES, customStore);
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

        // Initialize default student intelligence collections
        await set(KEYS.STUDENT_PROFILE, DEFAULT_STUDENT_PROFILE, customStore);
        await set(KEYS.BADGES, DEFAULT_BADGES, customStore);
        await set(KEYS.SUBSCRIPTIONS, [], customStore);
        await set(KEYS.GOALS, [], customStore);
        await set(KEYS.BILL_SPLITS, [], customStore);

        // Initialize empty arrays
        await set(KEYS.EXPENSES, [], customStore);
        await set(KEYS.INCOME, [], customStore);
        await set(KEYS.TRANSFERS, [], customStore);
        await set(KEYS.DEBTS, [], customStore);
        await set(KEYS.BUDGETS, [], customStore);
        await set(KEYS.SUMMARIES, {}, customStore);

        console.log('✅ Student Finance Database initialized with default data');
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

    if (fromVersion < 2) {
        await migrateToV2();
    }
    if (fromVersion < 3) {
        await migrateToV3();
    }

    // Update metadata
    const metadata = await getMetadata();
    if (metadata) {
        metadata.schemaVersion = CURRENT_SCHEMA_VERSION;
        metadata.lastMigrated = new Date().toISOString();
        await saveMetadata(metadata);
    }

    console.log('✅ Migrations complete to v' + CURRENT_SCHEMA_VERSION);
}

/**
 * Migrate to v2: Update category icons from emojis to Lucide names
 */
async function migrateToV2(): Promise<void> {
    console.log('📦 Migrating to v2: Updating category icons...');
    const categories = await getCategories();

    const emojiMap: Record<string, string> = {
        '🍽️': 'Utensils',
        '🎮': 'Gamepad2',
        '🏠': 'Home',
        '🚗': 'Car',
        '🛍️': 'ShoppingBag',
        '📦': 'Package',
        '💊': 'HeartPulse',
        '🎓': 'GraduationCap',
        '✈️': 'Plane',
        '⚡': 'Zap',
        '☕': 'Coffee',
        '🎵': 'Music',
        '📱': 'Smartphone',
        '💪': 'Dumbbell',
        '💳': 'CreditCard'
    };

    let updatedCount = 0;

    for (const category of categories) {
        if (emojiMap[category.icon]) {
            category.icon = emojiMap[category.icon];
            updatedCount++;
        }
    }

    if (updatedCount > 0) {
        await set(KEYS.CATEGORIES, categories, customStore);
    }

    console.log(`✅ Updated ${updatedCount} categories`);
}

/**
 * Migrate to v3: Add Student Profile, Badges, Subscriptions, Goals, and 3-Bucket category mappings
 */
async function migrateToV3(): Promise<void> {
    console.log('🎓 Migrating to v3: Initializing Student Financial Intelligence features...');

    // 1. Ensure Student Profile exists
    const profile = await get<StudentProfile>(KEYS.STUDENT_PROFILE, customStore);
    if (!profile) {
        await set(KEYS.STUDENT_PROFILE, DEFAULT_STUDENT_PROFILE, customStore);
    }

    // 2. Ensure Badges exist
    const badges = await get<FinancialBadge[]>(KEYS.BADGES, customStore);
    if (!badges || badges.length === 0) {
        await set(KEYS.BADGES, DEFAULT_BADGES, customStore);
    }

    // 3. Ensure Subscriptions, Goals, BillSplits collections exist
    const subs = await get<Subscription[]>(KEYS.SUBSCRIPTIONS, customStore);
    if (!subs) await set(KEYS.SUBSCRIPTIONS, [], customStore);

    const goals = await get<SavingsGoal[]>(KEYS.GOALS, customStore);
    if (!goals) await set(KEYS.GOALS, [], customStore);

    const splits = await get<BillSplit[]>(KEYS.BILL_SPLITS, customStore);
    if (!splits) await set(KEYS.BILL_SPLITS, [], customStore);

    // 4. Ensure existing categories have 3-Bucket classifications
    const categories = await getCategories();
    let updatedCats = false;
    for (const cat of categories) {
        if (!cat.bucketType) {
            const nameLower = cat.name.toLowerCase();
            if (nameLower.includes('food') || nameLower.includes('mess') || nameLower.includes('rent') || nameLower.includes('home') || nameLower.includes('transport') || nameLower.includes('academic')) {
                cat.bucketType = 'survival';
            } else if (nameLower.includes('saving') || nameLower.includes('goal') || nameLower.includes('invest')) {
                cat.bucketType = 'future';
            } else {
                cat.bucketType = 'fun';
            }
            updatedCats = true;
        }
    }
    if (updatedCats) {
        await set(KEYS.CATEGORIES, categories, customStore);
    }

    console.log('✅ v3 Student Financial Migration completed successfully');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function generateId(): string {
    return crypto.randomUUID();
}

export function getCurrentDateISO(): string {
    return new Date().toISOString();
}

export function getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

export function paiseToRupees(paise: number): number {
    return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
}
