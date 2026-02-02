// Svelte store for categories with IndexedDB persistence
import { writable, derived } from 'svelte/store';
import type { Category } from '$lib/types';
import { getCategories, addCategory, updateCategory, deleteCategory } from '$lib/db';

function createCategoriesStore() {
    const { subscribe, set, update } = writable<Category[]>([]);

    return {
        subscribe,
        // Load categories from IndexedDB
        load: async () => {
            const categories = await getCategories();
            set(categories);
        },
        // Add new category
        add: async (category: Omit<Category, 'id' | 'createdAt'>) => {
            const newCategory = await addCategory(category);
            update((categories) => [...categories, newCategory]);
            return newCategory;
        },
        // Update existing category
        update: async (id: string, updates: Partial<Category>) => {
            const updated = await updateCategory(id, updates);
            if (updated) {
                update((categories) => categories.map((c) => (c.id === id ? updated : c)));
            }
            return updated;
        },
        // Delete category
        delete: async (id: string) => {
            const success = await deleteCategory(id);
            if (success) {
                update((categories) => categories.filter((c) => c.id !== id));
            }
            return success;
        }
    };
}

export const categories = createCategoriesStore();

// Derived store for expense categories
export const expenseCategories = derived(categories, ($categories) =>
    $categories.filter((c) => c.type === 'expense')
);

// Derived store for income categories
export const incomeCategories = derived(categories, ($categories) =>
    $categories.filter((c) => c.type === 'income')
);

// Derived store for category lookup by ID
export const categoryLookup = derived(categories, ($categories) => {
    const lookup = new Map<string, Category>();
    $categories.forEach((cat) => lookup.set(cat.id, cat));
    return lookup;
});
