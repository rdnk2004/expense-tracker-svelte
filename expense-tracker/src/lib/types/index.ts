// TypeScript type definitions for the Student Finance & Wealth Intelligence OS

// ============================================================================
// HELPER & ENUM TYPES
// ============================================================================

export type WalletType = 'upi' | 'cash' | 'bank' | 'other';
export type DebtDirection = 'give' | 'receive';
export type BudgetType = 'overall' | 'category';

/**
 * 3-Bucket Macro Budgeting for Students (Modified 50/30/20 Rule)
 * - survival: Mess, Rent/Hostel, Basic Transport, Essential Medicine, Required Books
 * - fun: Canteen, Outings, Movies, Gaming, Cafes, Non-essential Shopping
 * - future: Emergency buffer, Tech upgrades, Post-exam trips, Investments
 */
export type BudgetBucketType = 'survival' | 'fun' | 'future';

/**
 * Value Tagging during expense logging
 */
export type ValueTag = 'need' | 'want' | 'growth';

/**
 * Post-purchase emotional satisfaction audit
 */
export type SatisfactionRating = 'worth_it' | 'neutral' | 'regretted';

/**
 * Subscription billing frequencies
 */
export type SubscriptionCycle = 'monthly' | 'quarterly' | 'annual' | 'weekly';

/**
 * Savings goal / Sinking fund categories
 */
export type GoalCategory = 'travel' | 'tech' | 'academics' | 'fest' | 'emergency' | 'other';

/**
 * Financial runway velocity status
 */
export type BurnRateStatus = 'safe' | 'caution' | 'critical';

/**
 * Financial badge categories
 */
export type BadgeCategory = 'runway' | 'debt' | 'savings' | 'discipline';

/**
 * FP&A Financial Analyst Insight type
 */
export type AnalystInsightType = 'warning' | 'opportunity' | 'praise' | 'tip';

// ============================================================================
// DATA MODELS
// ============================================================================

/**
 * Wallet - Represents a payment method (UPI, Cash, Bank, etc.)
 * All amounts stored as integers in paise (₹1 = 100 paise)
 */
export interface Wallet {
    id: string; // UUID
    name: string; // 'UPI' | 'Cash' | etc.
    balance: number; // in paise
    updated: string; // ISO date string
    created: string; // ISO date string
}

/**
 * Category - Expense categories with subcategories & 3-Bucket classification
 */
export interface Category {
    id: string;
    name: string;
    subcategories: string[];
    color: string; // hex color code
    icon: string; // lucide icon name
    isDefault: boolean;
    type?: 'expense' | 'income' | string;
    bucketType?: BudgetBucketType; // Student 3-bucket mapping
}

/**
 * Income - Individual income transaction with gig / hourly rate attribution
 */
export interface Income {
    id: string; // UUID
    amount: number; // in paise
    walletId: string;
    categoryId: string;
    date: string; // ISO date string
    source?: string;
    sourceType?: 'allowance' | 'gig' | 'freelance' | 'stipend' | 'gift' | 'other';
    hourlyWageBasis?: number; // in paise
    note: string | null;
    created: string; // ISO date string
}

/**
 * Expense - Individual expense transaction with student behavioral tags
 */
export interface Expense {
    id: string; // UUID
    amount: number; // in paise
    walletId: string;
    categoryId: string;
    subcategory: string | null;
    date: string; // ISO date string
    note: string | null;
    valueTag?: ValueTag; // 'need' | 'want' | 'growth'
    satisfactionRating?: SatisfactionRating; // 'worth_it' | 'neutral' | 'regretted'
    splitGroupId?: string; // Links to BillSplit if part of a group split
    isRecurring?: boolean;
    subscriptionId?: string; // Links to Subscription if auto-logged
    created: string; // ISO date string
}

/**
 * Transaction - General transaction (Expense or Income)
 */
export type Transaction = Expense | Income;

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
 * Debt - Track money owed to/from others with UPI settlement support
 */
export interface Debt {
    id: string; // UUID
    person: string;
    amount: number; // in paise
    direction: DebtDirection; // 'give' = I owe them, 'receive' = They owe me
    date: string; // ISO date string
    note: string | null;
    upiId?: string; // Optional UPI ID (e.g., rahul@okaxis) for 1-click settlement
    splitId?: string; // Optional link to BillSplit
    category?: string; // Optional category tag
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
 * StudentProfile - Student financial configuration & allowance cycles
 */
export interface StudentProfile {
    id: string;
    monthlyAllowance: number; // in paise
    allowanceDay: number; // 1-31 (Day of month allowance is received)
    hourlyWageRate: number; // in paise (e.g. 20000 = ₹200/hr)
    collegeName?: string;
    semester?: string;
    currencySymbol: string; // '₹'
    targetSavingsPercent: number; // default 20%
    survivalBucketPercent?: number; // default 50%
    funBucketPercent?: number; // default 30%
    futureBucketPercent?: number; // default 20%
    updated: string; // ISO date string
}

/**
 * Subscription - Recurring expenses & micro-leakage tracker
 */
export interface Subscription {
    id: string; // UUID
    name: string; // 'Spotify', 'Netflix', 'WiFi', 'Gym'
    amount: number; // in paise
    billingCycle: SubscriptionCycle;
    nextRenewalDate: string; // 'YYYY-MM-DD'
    categoryId: string;
    walletId: string;
    isEssential: boolean; // Essential vs Nice-to-have
    active: boolean;
    notes?: string | null;
    created: string; // ISO date string
}

/**
 * GoalContribution - History of transfers/savings added to a goal
 */
export interface GoalContribution {
    id: string;
    goalId: string;
    amount: number; // in paise
    walletId?: string;
    date: string; // ISO date string
    note?: string;
}

/**
 * SavingsGoal - Semester Sinking Funds & Milestone Savings
 */
export interface SavingsGoal {
    id: string; // UUID
    title: string; // 'Goa Trip', 'MacBook Fund', 'Hackathon'
    targetAmount: number; // in paise
    currentAmount: number; // in paise
    targetDate: string; // 'YYYY-MM-DD'
    category: GoalCategory;
    emoji: string;
    walletId?: string;
    contributions: GoalContribution[];
    isCompleted: boolean;
    created: string; // ISO date string
}

/**
 * SplitParticipant - Individual person in a campus bill split
 */
export interface SplitParticipant {
    name: string;
    shareAmount: number; // in paise
    isPaid: boolean;
    debtId?: string; // Linked debt record ID
}

/**
 * BillSplit - Group bill splitting record
 */
export interface BillSplit {
    id: string; // UUID
    title: string; // 'Hostel Groceries', 'Canteen Feast'
    totalAmount: number; // in paise
    payerWalletId: string;
    payerName: string;
    date: string; // ISO date string
    participants: SplitParticipant[];
    expenseId?: string; // Linked expense ID
    created: string; // ISO date string
}

/**
 * FinancialBadge - Gamified student achievement milestone
 */
export interface FinancialBadge {
    id: string;
    title: string;
    description: string;
    icon: string;
    isUnlocked: boolean;
    unlockedAt?: string | null;
    category: BadgeCategory;
    progress?: number; // 0 - 100
}

/**
 * FinancialHealthScore - Gamified 0-100 student resilience index
 */
export interface FinancialHealthScore {
    overallScore: number; // 0 - 100
    runwayScore: number; // 0 - 25
    debtScore: number; // 0 - 25
    savingsScore: number; // 0 - 25
    regretControlScore: number; // 0 - 25
    grade: 'A+' | 'A' | 'B' | 'C' | 'D';
    topRecommendation: string;
    calculatedAt: string;
}

/**
 * AllowanceCycle - Dynamic safe-to-spend & runway metrics
 */
export interface AllowanceCycle {
    startDate: string;
    endDate: string;
    daysRemaining: number;
    totalDays: number;
    dailySafeSpend: number; // in paise
    totalLiquidBalance: number; // in paise
    fixedCommitments: number; // in paise
    burnRateStatus: BurnRateStatus;
}

/**
 * AnalystInsight - Actionable FP&A guidance & intelligent nudges
 */
export interface AnalystInsight {
    id: string;
    type: AnalystInsightType;
    title: string;
    message: string;
    actionLabel?: string;
    actionHref?: string;
    icon?: string;
    priority: 'high' | 'medium' | 'low';
    created: string;
}

/**
 * MonthlySummary - Pre-computed monthly statistics
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
// UTILITY & QUERY TYPES
// ============================================================================

export type NewWallet = Omit<Wallet, 'id' | 'created' | 'updated'>;
export type NewCategory = Omit<Category, 'id'>;
export type NewExpense = Omit<Expense, 'id' | 'created'>;
export type NewTransfer = Omit<Transfer, 'id' | 'created'>;
export type NewDebt = Omit<Debt, 'id' | 'created'>;
export type NewBudget = Omit<Budget, 'id' | 'created'>;
export type NewSubscription = Omit<Subscription, 'id' | 'created'>;
export type NewSavingsGoal = Omit<SavingsGoal, 'id' | 'created' | 'contributions' | 'currentAmount' | 'isCompleted'>;
export type NewBillSplit = Omit<BillSplit, 'id' | 'created'>;

export type UpdateWallet = Partial<Omit<Wallet, 'id' | 'created'>> & { id: string };
export type UpdateCategory = Partial<Omit<Category, 'id'> & { id: string }>;
export type UpdateExpense = Partial<Omit<Expense, 'id' | 'created'>> & { id: string };
export type UpdateTransfer = Partial<Omit<Transfer, 'id' | 'created'>> & { id: string };
export type UpdateDebt = Partial<Omit<Debt, 'id' | 'created'>> & { id: string };
export type UpdateBudget = Partial<Omit<Budget, 'id' | 'created'>> & { id: string };
export type UpdateSubscription = Partial<Omit<Subscription, 'id' | 'created'>> & { id: string };
export type UpdateSavingsGoal = Partial<Omit<SavingsGoal, 'id' | 'created'>> & { id: string };

export interface DateRange {
    start: string; // ISO date string
    end: string; // ISO date string
}

export interface ExpenseFilter {
    walletIds?: string[];
    categoryIds?: string[];
    dateRange?: DateRange;
    minAmount?: number; // in paise
    maxAmount?: number; // in paise
    searchText?: string;
    valueTag?: ValueTag;
    satisfactionRating?: SatisfactionRating;
}

export interface DebtFilter {
    direction?: DebtDirection;
    isSettled?: boolean;
    personName?: string;
}

export interface CategoryStats {
    categoryId: string;
    categoryName: string;
    total: number;
    count: number;
    percentage: number;
    color: string;
}

export interface PeriodStats {
    income: number;
    expenses: number;
    balance: number;
    topCategories: CategoryStats[];
    transactionCount: number;
}

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

export interface UIState {
    currentView: 'dashboard' | 'expenses' | 'wallets' | 'debts' | 'budgets' | 'subscriptions' | 'goals' | 'analytics' | 'settings';
    selectedMonth: string; // 'YYYY-MM'
    isLoading: boolean;
    sidebarOpen: boolean;
}
