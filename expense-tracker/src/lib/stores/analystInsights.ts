// Svelte derived store for FP&A Financial Analyst Commentary & Proactive Nudges
import { derived } from 'svelte/store';
import { runway, debts, subscriptionStats, goalStats, analytics, buckets, studentProfile, formatCurrency } from './index';
import type { AnalystInsight } from '$lib/types';

export const analystInsights = derived(
    [runway, debts, subscriptionStats, goalStats, analytics, buckets, studentProfile],
    ([$runway, $debts, $subscriptionStats, $goalStats, $analytics, $buckets, $studentProfile]) => {
        const insights: AnalystInsight[] = [];
        const nowISO = new Date().toISOString();

        // 1. Burn Rate / Runway Velocity Insight
        if ($runway.burnRateStatus === 'critical') {
            insights.push({
                id: 'burn-critical',
                type: 'warning',
                title: 'High Burn Velocity Alert',
                message: `At your current burn rate of ${formatCurrency($runway.avgDailyBurnRate7Days)}/day, your funds will exhaust ${$runway.daysRemaining - $runway.projectedRunwayDays} days before your next allowance. Cap daily spends to ${formatCurrency($runway.dailySafeSpend)} to recover.`,
                actionLabel: 'View Runway',
                actionHref: '/budgets',
                priority: 'high',
                created: nowISO
            });
        } else if ($runway.burnRateStatus === 'safe' && $runway.todayRemainingLimit > 0) {
            insights.push({
                id: 'burn-safe',
                type: 'praise',
                title: 'Runway in Healthy Green Zone',
                message: `Pacing is great! You have ${formatCurrency($runway.todayRemainingLimit)} remaining in your safe daily spending limit for today with ${$runway.daysRemaining} days left in this allowance cycle.`,
                actionLabel: 'Sinking Goals',
                actionHref: '/goals',
                priority: 'low',
                created: nowISO
            });
        }

        // 2. Emotional Regret Audit Nudge
        const regret = $analytics.emotionalRoi;
        if (regret.regrettedTotal > 50000) { // > ₹500 in regretted purchases
            insights.push({
                id: 'regret-nudge',
                type: 'opportunity',
                title: 'Emotional ROI Optimization',
                message: `You spent ${formatCurrency(regret.regrettedTotal)} on purchases later marked as regretted (${regret.wastedLaborTime} of campus labor). Redirecting this into your sinking funds would accelerate your goals by weeks.`,
                actionLabel: 'Audit Spends',
                actionHref: '/analytics',
                priority: 'high',
                created: nowISO
            });
        }

        // 3. Social Debt Receivables Capital Drag
        const debtsOwedToYou = $debts.filter((d) => !d.isSettled && d.direction === 'receive');
        const totalReceivable = debtsOwedToYou.reduce((sum, d) => sum + d.amount, 0);

        if (totalReceivable >= 100000) { // >= ₹1,000 locked in receivables
            insights.push({
                id: 'debt-drag',
                type: 'tip',
                title: 'Capital Drag in Friend Tabs',
                message: `Friends owe you ${formatCurrency(totalReceivable)} across ${debtsOwedToYou.length} split tabs. Send a friendly 1-click UPI reminder to liberate your cash flow for the weekend.`,
                actionLabel: 'Settle Tabs',
                actionHref: '/debts',
                priority: 'medium',
                created: nowISO
            });
        }

        // 4. Upcoming Subscription Renewals
        const nextSub = $subscriptionStats.upcomingRenewals[0];
        if (nextSub) {
            const renewDate = new Date(nextSub.nextRenewalDate);
            const today = new Date();
            const diffDays = Math.round((renewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= 3) {
                insights.push({
                    id: 'sub-renewal-soon',
                    type: 'tip',
                    title: `Upcoming Auto-Debit: ${nextSub.name}`,
                    message: `${nextSub.name} (${formatCurrency(nextSub.amount)}) renews in ${diffDays === 0 ? 'today' : `${diffDays} days`}. Ensure your linked wallet has sufficient balance.`,
                    actionLabel: 'Sub Radar',
                    actionHref: '/subscriptions',
                    priority: 'medium',
                    created: nowISO
                });
            }
        }

        // 5. 3-Bucket Fun Category Spillover Warning
        if ($buckets.fun.status === 'exceeded' || $buckets.fun.spentAmount > $buckets.fun.allocatedAmount) {
            insights.push({
                id: 'fun-bucket-spill',
                type: 'warning',
                title: 'Fun Bucket Exceeded Target (30%)',
                message: `Lifestyle and entertainment expenses have exceeded your allocated 30% bucket. Shift focus to Survival essentials for the next few days.`,
                actionLabel: 'Adjust Buckets',
                actionHref: '/budgets',
                priority: 'high',
                created: nowISO
            });
        }

        // Sort priority ('high' first, then 'medium', then 'low')
        const priorityOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
        const sorted = insights.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

        return {
            insights: sorted,
            topInsight: sorted[0] || null,
            totalInsightsCount: sorted.length
        };
    }
);
