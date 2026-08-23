// Svelte store for Recurring Subscriptions & Micro-Leakage Radar
import { writable, derived } from 'svelte/store';
import type { Subscription, SubscriptionCycle } from '$lib/types';
import * as db from '$lib/db';

function createSubscriptionsStore() {
    const { subscribe, set, update } = writable<Subscription[]>([]);

    return {
        subscribe,
        load: async () => {
            const list = await db.getSubscriptions();
            set(list);
            return list;
        },
        add: async (subData: Omit<Subscription, 'id' | 'created'>) => {
            const newSub = await db.addSubscription(subData);
            update((list) => [...list, newSub]);
            return newSub;
        },
        update: async (id: string, updates: Partial<Subscription>) => {
            const updated = await db.updateSubscription(id, updates);
            if (updated) {
                update((list) => list.map((s) => (s.id === id ? updated : s)));
            }
            return updated;
        },
        delete: async (id: string) => {
            const success = await db.deleteSubscription(id);
            if (success) {
                update((list) => list.filter((s) => s.id !== id));
            }
            return success;
        }
    };
}

export const subscriptions = createSubscriptionsStore();

/**
 * Normalizes subscription amount to monthly cost in paise
 */
export function getMonthlyNormalizedCost(amount: number, cycle: SubscriptionCycle): number {
    switch (cycle) {
        case 'weekly':
            return Math.round(amount * 4.33);
        case 'monthly':
            return amount;
        case 'quarterly':
            return Math.round(amount / 3);
        case 'annual':
            return Math.round(amount / 12);
        default:
            return amount;
    }
}

/**
 * Derived analytics for recurring subscriptions
 */
export const subscriptionStats = derived(subscriptions, ($subscriptions) => {
    const activeSubs = $subscriptions.filter((s) => s.active);

    let monthlyTotal = 0;
    let essentialMonthly = 0;
    let discretionaryMonthly = 0;

    activeSubs.forEach((sub) => {
        const monthly = getMonthlyNormalizedCost(sub.amount, sub.billingCycle);
        monthlyTotal += monthly;
        if (sub.isEssential) {
            essentialMonthly += monthly;
        } else {
            discretionaryMonthly += monthly;
        }
    });

    const annualTotal = monthlyTotal * 12;

    // Upcoming renewals sorted by date
    const now = new Date();
    const sortedUpcoming = [...activeSubs].sort((a, b) => {
        return new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime();
    });

    return {
        count: activeSubs.length,
        monthlyTotal,
        annualTotal,
        essentialMonthly,
        discretionaryMonthly,
        essentialPercent: monthlyTotal > 0 ? Math.round((essentialMonthly / monthlyTotal) * 100) : 0,
        discretionaryPercent: monthlyTotal > 0 ? Math.round((discretionaryMonthly / monthlyTotal) * 100) : 0,
        upcomingRenewals: sortedUpcoming
    };
});
