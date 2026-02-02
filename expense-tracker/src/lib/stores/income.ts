// Svelte store for income with IndexedDB persistence
import { writable, derived } from 'svelte/store';
import type { Income } from '$lib/types';
import { getIncome, addIncome, updateIncome, deleteIncome } from '$lib/db';

function createIncomeStore() {
    const { subscribe, set, update } = writable<Income[]>([]);

    return {
        subscribe,
        // Load income from IndexedDB
        load: async () => {
            const income = await getIncome();
            set(income);
        },
        // Add new income
        add: async (income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>) => {
            const newIncome = await addIncome(income);
            update((incomeList) => [...incomeList, newIncome]);
            return newIncome;
        },
        // Update existing income
        update: async (id: string, updates: Partial<Income>) => {
            const updated = await updateIncome(id, updates);
            if (updated) {
                update((incomeList) => incomeList.map((i) => (i.id === id ? updated : i)));
            }
            return updated;
        },
        // Delete income
        delete: async (id: string) => {
            const success = await deleteIncome(id);
            if (success) {
                update((incomeList) => incomeList.filter((i) => i.id !== id));
            }
            return success;
        }
    };
}

export const income = createIncomeStore();

// Derived store for total income
export const totalIncome = derived(income, ($income) =>
    $income.reduce((sum, inc) => sum + inc.amount, 0)
);

// Derived store for income by category
export const incomeByCategory = derived(income, ($income) => {
    const grouped = new Map<string, Income[]>();
    $income.forEach((inc) => {
        const existing = grouped.get(inc.categoryId) || [];
        grouped.set(inc.categoryId, [...existing, inc]);
    });
    return grouped;
});

// Derived store for recent income (last 10)
export const recentIncome = derived(income, ($income) =>
    [...$income].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)
);
