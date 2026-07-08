<script lang="ts">
	import { onMount } from 'svelte';
	import {
		wallets,
		currentMonthExpenses,
		totalBalance,
		categories,
		unsettledDebts,
		currentMonthBudgets,
		currentMonth,
		formatCurrency,
		formatDate
	} from '$lib/stores';
	import {
		Wallet,
		ChartPie,
		Target,
		Handshake,
		Receipt,
		Smartphone,
		Banknote,
		Package,
		ArrowRight,
		ChevronDown,
		MoreVertical,
		Bell,
		ArrowDownLeft,
		ArrowUpRight,
		ChevronRight
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';

	// Computed values
	$: upiWallet = $wallets.find((w) => w.name === 'UPI');
	$: cashWallet = $wallets.find((w) => w.name === 'Cash');

	// Calculate Income and Expense
	$: monthlyExpense = $currentMonthExpenses
		.filter((e) => e.categoryId !== 'income')
		.reduce((sum, e) => sum + e.amount, 0);
	$: monthlyIncome = $currentMonthExpenses
		.filter((e) => e.categoryId === 'income')
		.reduce((sum, e) => sum + e.amount, 0);

	$: categoryBreakdown = $currentMonthExpenses.reduce(
		(acc, expense) => {
			const category = $categories.find((c) => c.id === expense.categoryId);
			if (category) {
				acc[category.id] = acc[category.id] || {
					name: category.name,
					color: category.color,
					icon: category.icon,
					amount: 0
				};
				acc[category.id].amount += expense.amount;
			}
			return acc;
		},
		{} as Record<string, { name: string; color: string; icon: string; amount: number }>
	);

	$: recentExpenses = [...$currentMonthExpenses]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 5);

	$: totalOwed = $unsettledDebts
		.filter((d) => d.direction === 'give')
		.reduce((sum, d) => sum + d.amount, 0);

	$: totalReceivable = $unsettledDebts
		.filter((d) => d.direction === 'receive')
		.reduce((sum, d) => sum + d.amount, 0);

	$: netPosition = totalReceivable - totalOwed;

	$: overallBudget = $currentMonthBudgets.find((b) => b.type === 'overall');

	// Helper colors
	function getBudgetColor(percentage: number): string {
		if (percentage < 70) return 'var(--success)';
		if (percentage < 90) return 'var(--warning)';
		if (percentage < 100) return '#fb8c00';
		return 'var(--danger)';
	}

	function getCategoryById(id: string) {
		return $categories.find((c) => c.id === id);
	}
</script>

<div class="dashboard">
	<h1 class="page-title">Dashboard</h1>

	<div class="dashboard-container">
		<!-- Wallet Overview Hero Card -->
		<div class="card card-hero">
			<div class="card-header-hero">
				<div class="account-selector">
					<span>Main Account</span>
					<ChevronDown size={16} />
				</div>
				<button class="icon-btn-ghost">
					<MoreVertical size={20} />
				</button>
			</div>

			<div class="balance-section">
				<span class="label-sm">Total Balance</span>
				<h1 class="balance-display">{formatCurrency($totalBalance)}</h1>
			</div>

			<div class="stats-row">
				<div class="stat-item">
					<div class="stat-label">
						<ArrowDownLeft size={14} class="text-success" /> Income
					</div>
					<div class="stat-value">{formatCurrency(monthlyIncome)}</div>
				</div>
				<div class="stat-item">
					<div class="stat-label">
						<ArrowUpRight size={14} class="text-danger" /> Expense
					</div>
					<div class="stat-value">{formatCurrency(monthlyExpense)}</div>
				</div>
			</div>
		</div>

		<!-- Monthly Budget Section -->
		<div class="section-budget">
			<h3 class="section-title">Monthly Budget</h3>

			{#if overallBudget}
				<div class="budget-pill-card">
					<div class="budget-progress-container">
						<div
							class="budget-progress-bar"
							style="width: {Math.min(
								(monthlyExpense / overallBudget.amount) * 100,
								100
							)}%; background: {getBudgetColor((monthlyExpense / overallBudget.amount) * 100)}"
						></div>
					</div>
					<div class="budget-info">
						<span class="spent-text">Spent {formatCurrency(monthlyExpense)}</span>
						<span class="limit-text">/ {formatCurrency(overallBudget.amount)}</span>
						<span class="percentage-text"
							>{Math.round((monthlyExpense / overallBudget.amount) * 100)}%</span
						>
					</div>
				</div>
			{:else}
				<div class="empty-state-pill">
					<p>No budget set</p>
					<a href="/budgets" class="text-button">Set Budget</a>
				</div>
			{/if}
		</div>

		<!-- Upcoming Bills (Debts) -->
		<div class="section-bills">
			<div class="section-header">
				<h3 class="section-title">Upcoming Bills</h3>
				<a href="/debts" class="view-all-link">View All <ChevronRight size={16} /></a>
			</div>

			<div class="bills-list">
				{#each $unsettledDebts.slice(0, 3) as debt}
					<div class="bill-item">
						<div class="bill-icon-wrapper">
							<div class="bill-icon">
								<Receipt size={20} />
							</div>
						</div>
						<div class="bill-details">
							<div class="bill-name">{debt.person}</div>
							<div class="bill-date">
								Due {new Date(debt.dueDate || Date.now()).toLocaleDateString('en-US', {
									day: 'numeric',
									month: 'short'
								})}
							</div>
						</div>
						<div class="bill-amount">
							{formatCurrency(debt.amount)}
						</div>
					</div>
				{:else}
					<div class="empty-state-bills">
						<p>No upcoming bills</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard-container {
		padding-bottom: 100px; /* Space for fab/nav */
		animation: fadeIn 0.4s ease-out;
		max-width: 600px;
		margin: 0 auto;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ===================================
	   HERO CARD
	   =================================== */
	.card-hero {
		background: var(--hero-gradient);
		border-radius: 32px;
		padding: 24px;
		color: white;
		margin-bottom: 24px;
		box-shadow: 0 20px 40px -10px rgba(31, 38, 135, 0.4);
		position: relative;
		overflow: hidden;
	}

	.card-hero::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20%;
		width: 300px;
		height: 300px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
		border-radius: 50%;
		filter: blur(40px);
		pointer-events: none;
	}

	.card-header-hero {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		position: relative;
		z-index: 2;
	}

	.account-selector {
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.15);
		padding: 8px 12px;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 500;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.icon-btn-ghost {
		background: transparent;
		color: white;
		padding: 8px;
		opacity: 0.8;
	}

	.balance-section {
		margin-bottom: 32px;
		position: relative;
		z-index: 2;
	}

	.label-sm {
		display: block;
		font-size: 0.85rem;
		opacity: 0.7;
		margin-bottom: 4px;
		font-weight: 500;
	}

	.balance-display {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -1px;
	}

	.stats-row {
		display: flex;
		gap: 24px;
		position: relative;
		z-index: 2;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.stat-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8rem;
		opacity: 0.8;
	}

	.stat-value {
		font-size: 1.1rem;
		font-weight: 600;
	}

	/* ===================================
	   BUDGET SECTION
	   =================================== */
	.section-budget {
		margin-bottom: 24px;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 12px;
		color: var(--text-primary);
		padding-left: 4px;
	}

	.budget-pill-card {
		background: var(--bg-card);
		border-radius: 24px;
		padding: 20px;
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--border-color);
	}

	.budget-progress-container {
		height: 12px;
		background: var(--bg-primary);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 12px;
	}

	.budget-progress-bar {
		height: 100%;
		border-radius: 6px;
		transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.budget-info {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 0.9rem;
	}

	.spent-text {
		font-weight: 600;
		color: var(--text-primary);
	}

	.limit-text {
		color: var(--text-secondary);
		margin-left: 4px;
	}

	.percentage-text {
		font-weight: 700;
		color: var(--accent-primary);
	}

	.empty-state-pill {
		text-align: center;
		padding: 20px;
		background: var(--bg-card);
		border-radius: 20px;
		border: 1px solid var(--border-color);
		border-style: dashed;
		color: var(--text-secondary);
	}

	.text-button {
		color: var(--accent-primary);
		font-weight: 600;
		margin-top: 4px;
		display: inline-block;
	}

	/* ===================================
	   BILLS / DEBTS SECTION
	   =================================== */
	.section-bills {
		margin-bottom: 24px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding: 0 4px;
	}

	.view-all-link {
		font-size: 0.85rem;
		color: var(--accent-primary);
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.bills-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.bill-item {
		background: var(--bg-card);
		padding: 16px;
		border-radius: 20px;
		display: flex;
		align-items: center;
		gap: 16px;
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--border-color);
		transition: transform 0.2s;
	}

	.bill-item:active {
		transform: scale(0.98);
	}

	.bill-icon-wrapper {
		width: 48px;
		height: 48px;
		background: var(--bg-primary);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent-secondary);
	}

	.bill-details {
		flex: 1;
	}

	.bill-name {
		font-weight: 600;
		font-size: 1rem;
		margin-bottom: 4px;
		color: var(--text-primary);
	}

	.bill-date {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.bill-amount {
		font-weight: 700;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.empty-state-bills {
		text-align: center;
		padding: 30px;
		color: var(--text-muted);
	}
</style>
