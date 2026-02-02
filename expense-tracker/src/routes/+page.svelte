<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
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

	// Register Chart.js components
	Chart.register(...registerables);

	let walletChartCanvas: HTMLCanvasElement;
	let categoryChartCanvas: HTMLCanvasElement;
	let walletChart: Chart | null = null;
	let categoryChart: Chart | null = null;

	// Computed values
	$: upiWallet = $wallets.find((w) => w.name === 'UPI');
	$: cashWallet = $wallets.find((w) => w.name === 'Cash');

	$: totalExpenses = $currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

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

	$: categoryData = Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount);

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
	$: budgetPercentage = overallBudget ? (totalExpenses / overallBudget.amount) * 100 : 0;

	$: daysInMonth = new Date(
		parseInt($currentMonth.split('-')[0]),
		parseInt($currentMonth.split('-')[1]),
		0
	).getDate();
	$: today = new Date().getDate();
	$: daysRemaining = Math.max(0, daysInMonth - today);

	// Create/update charts
	$: if (walletChartCanvas && $wallets.length > 0) {
		updateWalletChart();
	}

	$: if (categoryChartCanvas && categoryData.length > 0) {
		updateCategoryChart();
	}

	function updateWalletChart() {
		if (walletChart) {
			walletChart.destroy();
		}

		const ctx = walletChartCanvas.getContext('2d');
		if (!ctx) return;

		walletChart = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: $wallets.map((w) => w.name),
				datasets: [
					{
						data: $wallets.map((w) => w.balance),
						backgroundColor: ['#4ECDC4', '#FF6B6B'],
						borderColor: '#1e1e1e',
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								const value = context.parsed as number;
								return `${context.label}: ${formatCurrency(value)}`;
							}
						}
					}
				}
			}
		});
	}

	function updateCategoryChart() {
		if (categoryChart) {
			categoryChart.destroy();
		}

		const ctx = categoryChartCanvas.getContext('2d');
		if (!ctx) return;

		categoryChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: categoryData.map((c) => c.icon + ' ' + c.name),
				datasets: [
					{
						label: 'Spending',
						data: categoryData.map((c) => c.amount / 100), // Convert to rupees for display
						backgroundColor: categoryData.map((c) => c.color),
						borderRadius: 6
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							color: '#a0a0a0',
							callback: (value) => '₹' + value
						},
						grid: {
							color: '#2a2a2a'
						}
					},
					x: {
						ticks: {
							color: '#a0a0a0'
						},
						grid: {
							display: false
						}
					}
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								return `₹${context.parsed.y.toFixed(2)}`;
							}
						}
					}
				}
			}
		});
	}

	onMount(() => {
		return () => {
			if (walletChart) walletChart.destroy();
			if (categoryChart) categoryChart.destroy();
		};
	});

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

	<div class="grid">
		<!-- Wallet Overview Card -->
		<div class="card">
			<h2 class="card-title">💰 Wallet Overview</h2>
			<div class="wallet-balance">
				<div class="total-balance">
					<span class="label">Total Balance</span>
					<span class="amount">{formatCurrency($totalBalance)}</span>
				</div>
			</div>

			{#if $wallets.length > 0}
				<div class="wallet-split">
					<div class="wallet-item">
						<span class="wallet-name">📱 UPI</span>
						<span class="wallet-amount">{formatCurrency(upiWallet?.balance || 0)}</span>
					</div>
					<div class="wallet-item">
						<span class="wallet-name">💵 Cash</span>
						<span class="wallet-amount">{formatCurrency(cashWallet?.balance || 0)}</span>
					</div>
				</div>

				<div class="chart-container">
					<canvas bind:this={walletChartCanvas}></canvas>
				</div>
			{:else}
				<div class="empty-state">
					<p>No wallet data available</p>
				</div>
			{/if}
		</div>

		<!-- Monthly Spending Card -->
		<div class="card">
			<h2 class="card-title">📊 Monthly Spending</h2>
			<div class="spending-summary">
				<div class="total-spent">
					<span class="label">Total Spent</span>
					<span class="amount">{formatCurrency(totalExpenses)}</span>
				</div>
			</div>

			{#if categoryData.length > 0}
				<div class="chart-container" style="height: 250px;">
					<canvas bind:this={categoryChartCanvas}></canvas>
				</div>
			{:else}
				<div class="empty-state">
					<p>No expenses this month</p>
					<a href="/expenses" class="link">Add your first expense →</a>
				</div>
			{/if}
		</div>

		<!-- Budget Health Card -->
		<div class="card">
			<h2 class="card-title">🎯 Budget Health</h2>

			{#if overallBudget}
				<div class="budget-overall">
					<div class="budget-header">
						<span>Overall Budget</span>
						<span class="budget-amount"
							>{formatCurrency(totalExpenses)} / {formatCurrency(overallBudget.amount)}</span
						>
					</div>
					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: {Math.min(budgetPercentage, 100)}%; background: {getBudgetColor(
								budgetPercentage
							)};"
						></div>
					</div>
					<div class="budget-footer">
						<span class="percentage" style="color: {getBudgetColor(budgetPercentage)};"
							>{budgetPercentage.toFixed(1)}% used</span
						>
						<span class="days-remaining">{daysRemaining} days left</span>
					</div>
				</div>
			{:else}
				<div class="empty-state">
					<p>No budget set for this month</p>
					<a href="/budgets" class="link">Set a budget →</a>
				</div>
			{/if}

			{#if $currentMonthBudgets.filter((b) => b.type === 'category').length > 0}
				<div class="category-budgets">
					<h3>Category Budgets</h3>
					{#each $currentMonthBudgets.filter((b) => b.type === 'category') as budget}
						{@const category = getCategoryById(budget.categoryId || '')}
						{@const spent = categoryBreakdown[budget.categoryId || '']?.amount || 0}
						{@const percentage = (spent / budget.amount) * 100}
						<div class="category-budget-item">
							<div class="category-budget-header">
								<span>{category?.icon} {category?.name}</span>
								<span class="budget-amount"
									>{formatCurrency(spent)} / {formatCurrency(budget.amount)}</span
								>
							</div>
							<div class="progress-bar small">
								<div
									class="progress-fill"
									style="width: {Math.min(percentage, 100)}%; background: {getBudgetColor(
										percentage
									)};"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Debt Summary Card -->
		<div class="card">
			<h2 class="card-title">🤝 Debt Summary</h2>

			<div class="debt-stats">
				<div class="debt-stat">
					<span class="debt-label">You Owe</span>
					<span class="debt-amount danger">{formatCurrency(totalOwed)}</span>
				</div>
				<div class="debt-stat">
					<span class="debt-label">Owed to You</span>
					<span class="debt-amount success">{formatCurrency(totalReceivable)}</span>
				</div>
				<div class="debt-stat highlight">
					<span class="debt-label">Net Position</span>
					<span class="debt-amount" class:success={netPosition >= 0} class:danger={netPosition < 0}
						>{formatCurrency(Math.abs(netPosition))}
						{netPosition >= 0 ? '(receive)' : '(pay)'}</span
					>
				</div>
			</div>

			{#if $unsettledDebts.length > 0}
				<div class="debt-count">
					<span
						>{$unsettledDebts.length} unsettled debt{$unsettledDebts.length !== 1 ? 's' : ''}</span
					>
					<a href="/debts" class="link">View all →</a>
				</div>
			{:else}
				<div class="empty-state">
					<p>No unsettled debts</p>
				</div>
			{/if}
		</div>

		<!-- Recent Transactions -->
		<div class="card full-width">
			<h2 class="card-title">🧾 Recent Transactions</h2>

			{#if recentExpenses.length > 0}
				<div class="transactions-list">
					{#each recentExpenses as expense}
						{@const category = getCategoryById(expense.categoryId)}
						{@const wallet = $wallets.find((w) => w.id === expense.walletId)}
						<div class="transaction-item">
							<div class="transaction-icon">{category?.icon || '📦'}</div>
							<div class="transaction-details">
								<div class="transaction-category">{category?.name || 'Unknown'}</div>
								{#if expense.subcategory}
									<div class="transaction-subcategory">{expense.subcategory}</div>
								{/if}
								{#if expense.note}
									<div class="transaction-note">{expense.note}</div>
								{/if}
							</div>
							<div class="transaction-meta">
								<div class="transaction-amount">{formatCurrency(expense.amount)}</div>
								<div class="transaction-info">
									<span class="wallet-badge">{wallet?.name || 'Unknown'}</span>
									<span class="transaction-date">{formatDate(expense.date)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
				<a href="/expenses" class="view-all-link">View all expenses →</a>
			{:else}
				<div class="empty-state">
					<p>No transactions yet</p>
					<a href="/expenses" class="link">Add your first expense →</a>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.dashboard {
		animation: fadeIn 0.3s ease-out;
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

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 2rem;
		color: var(--text-primary);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-md);
		transition: all 0.3s;
	}

	.card:hover {
		box-shadow: var(--shadow-lg);
		border-color: var(--accent-secondary);
	}

	.card.full-width {
		grid-column: 1 / -1;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	/* Wallet Overview */
	.wallet-balance {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.total-balance,
	.total-spent {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.amount {
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent-primary);
		text-shadow: 0 2px 8px rgba(192, 192, 192, 0.3);
	}

	.wallet-split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.wallet-item {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: var(--border-radius);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: 1px solid var(--border-color);
	}

	.wallet-name {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.wallet-amount {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.chart-container {
		height: 200px;
		position: relative;
	}

	/* Spending */
	.spending-summary {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	/* Budget */
	.budget-overall {
		margin-bottom: 1.5rem;
	}

	.budget-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}

	.budget-amount {
		font-weight: 600;
		color: var(--text-secondary);
	}

	.progress-bar {
		height: 12px;
		background: var(--bg-secondary);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}

	.progress-bar.small {
		height: 8px;
	}

	.progress-fill {
		height: 100%;
		transition:
			width 0.3s ease,
			background 0.3s ease;
		border-radius: 6px;
	}

	.budget-footer {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
	}

	.percentage {
		font-weight: 600;
	}

	.days-remaining {
		color: var(--text-secondary);
	}

	.category-budgets {
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.category-budgets h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	.category-budget-item {
		margin-bottom: 1rem;
	}

	.category-budget-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	/* Debt */
	.debt-stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.debt-stat {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: var(--border-radius);
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 1px solid var(--border-color);
	}

	.debt-stat.highlight {
		border-color: var(--accent-secondary);
		background: linear-gradient(135deg, var(--bg-secondary) 0%, #1a1a1a 100%);
	}

	.debt-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.debt-amount {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.debt-amount.success {
		color: var(--success);
	}

	.debt-amount.danger {
		color: var(--danger);
	}

	.debt-count {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	/* Transactions */
	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.transaction-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: var(--border-radius);
		border: 1px solid var(--border-color);
		transition: all 0.2s;
	}

	.transaction-item:hover {
		background: var(--bg-hover);
		border-color: var(--accent-secondary);
	}

	.transaction-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.transaction-details {
		flex: 1;
	}

	.transaction-category {
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.transaction-subcategory {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.transaction-note {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
	}

	.transaction-meta {
		text-align: right;
	}

	.transaction-amount {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--accent-primary);
		margin-bottom: 0.25rem;
	}

	.transaction-info {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: flex-end;
		flex-wrap: wrap;
	}

	.wallet-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		color: var(--text-secondary);
	}

	.transaction-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.view-all-link {
		display: block;
		text-align: center;
		color: var(--accent-primary);
		text-decoration: none;
		font-weight: 500;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		transition: all 0.2s;
	}

	.view-all-link:hover {
		background: var(--bg-secondary);
		border-color: var(--accent-primary);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 2rem 1rem;
		color: var(--text-secondary);
	}

	.empty-state p {
		margin-bottom: 0.5rem;
	}

	.link {
		color: var(--accent-primary);
		text-decoration: none;
		transition: color 0.2s;
	}

	.link:hover {
		color: var(--accent-hover);
		text-decoration: underline;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.grid {
			grid-template-columns: 1fr;
		}

		.page-title {
			font-size: 1.5rem;
			margin-bottom: 1.5rem;
		}

		.amount {
			font-size: 1.5rem;
		}

		.transaction-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.transaction-meta {
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.transaction-info {
			justify-content: flex-start;
		}
	}
</style>
