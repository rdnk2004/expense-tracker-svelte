// Svelte store for expenses with IndexedDB persistence
import { writable, derived } from 'svelte/store';
import type { Expense } from '$lib/types';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '$lib/db';

function createExpensesStore() {
    const { subscribe, set, update } = writable<Expense[]>([]);

    return {
        subscribe,
        // Load expenses from IndexedDB
        load: async () => {
            const expenses = await getExpenses();
            set(expenses);
        },
        // Add new expense
        add: async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
            const newExpense = await addExpense(expense);
            update((expenses) => [...expenses, newExpense]);
            return newExpense;
        },
        // Update existing expense
        update: async (id: string, updates: Partial<Expense>) => {
            const updated = await updateExpense(id, updates);
            if (updated) {
                update((expenses) => expenses.map((e) => (e.id === id ? updated : e)));
            }
            return updated;
        },
        // Delete expense
        delete: async (id: string) => {
            const success = await deleteExpense(id);
            if (success) {
                update((expenses) => expenses.filter((e) => e.id !== id));
            }
            return success;
        }
    };
}

export const expenses = createExpensesStore();

// Derived store for total expenses
export const totalExpenses = derived(expenses, ($expenses) =>
    $expenses.reduce((sum, expense) => sum + expense.amount, 0)
);

// Derived store for expenses by category
export const expensesByCategory = derived(expenses, ($expenses) => {
    const grouped = new Map<string, Expense[]>();
    $expenses.forEach((expense) => {
        const existing = grouped.get(expense.categoryId) || [];
        grouped.set(expense.categoryId, [...existing, expense]);
    });
    return grouped;
});

// Derived store for recent expenses (last 10)
export const recentExpenses = derived(expenses, ($expenses) =>
    [...$expenses].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)
);
