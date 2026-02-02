<script lang="ts">
	import {
		budgets,
		categories,
		currentMonth,
		currentMonthExpenses,
		setBudget,
		formatCurrency,
		goToPreviousMonth,
		goToNextMonth,
		getMonthName
	} from '$lib/stores';

	// Form state
	let overallBudgetAmount = $state('');
	let categoryBudgetInputs = $state<Record<string, string>>({});
	let selectedMonth = $state($currentMonth);
	let showToast = $state(false);
	let toastMessage = $state('');

	// Computed values
	let overallBudget = $derived(
		$budgets.find((b) => b.type === 'overall' && b.month === selectedMonth)
	);

	let categoryBudgets = $derived(
		$budgets.filter((b) => b.type === 'category' && b.month === selectedMonth)
	);

	let totalExpenses = $derived($currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0));

	let categorySpending = $derived(
		$currentMonthExpenses.reduce(
			(acc, expense) => {
				acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
				return acc;
			},
			{} as Record<string, number>
		)
	);

	let categoriesWithBudgets = $derived(
		$categories.map((cat) => {
			const budget = categoryBudgets.find((b) => b.categoryId === cat.id);
			const spent = categorySpending[cat.id] || 0;
			return {
				category: cat,
				budget,
				spent,
				percentage: budget ? (spent / budget.amount) * 100 : 0
			};
		})
	);

	let overBudgetCount = $derived(
		categoriesWithBudgets.filter((c) => c.budget && c.spent > c.budget.amount).length
	);

	let daysInMonth = $derived(
		new Date(
			parseInt(selectedMonth.split('-')[0]),
			parseInt(selectedMonth.split('-')[1]),
			0
		).getDate()
	);

	let daysElapsed = $derived(selectedMonth === $currentMonth ? new Date().getDate() : daysInMonth);

	let daysRemaining = $derived(Math.max(0, daysInMonth - daysElapsed));

	let averageDailySpending = $derived(daysElapsed > 0 ? totalExpenses / daysElapsed : 0);

	let projectedMonthlySpending = $derived(averageDailySpending * daysInMonth);

	let overallBudgetPercentage = $derived(
		overallBudget ? (totalExpenses / overallBudget.amount) * 100 : 0
	);

	async function handleSetOverallBudget() {
		if (!overallBudgetAmount || parseFloat(overallBudgetAmount) <= 0) {
			showSuccessToast('Please enter a valid amount ❌');
			return;
		}

		try {
			await setBudget('overall', Math.round(parseFloat(overallBudgetAmount) * 100));

			overallBudgetAmount = '';
			showSuccessToast('Overall budget set successfully! 🎉');
		} catch (error) {
			console.error('Failed to set budget:', error);
			showSuccessToast('Failed to set budget ❌');
		}
	}

	async function handleSetCategoryBudget(categoryId: string) {
		const amount = categoryBudgetInputs[categoryId];
		if (!amount || parseFloat(amount) <= 0) {
			showSuccessToast('Please enter a valid amount ❌');
			return;
		}

		try {
			await setBudget('category', Math.round(parseFloat(amount) * 100), categoryId);

			categoryBudgetInputs = { ...categoryBudgetInputs, [categoryId]: '' };
			showSuccessToast('Category budget set successfully! 🎉');
		} catch (error) {
			console.error('Failed to set budget:', error);
			showSuccessToast('Failed to set budget ❌');
		}
	}

	function showSuccessToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	function getBudgetColor(percentage: number): string {
		if (percentage < 70) return 'var(--success)';
		if (percentage < 90) return 'var(--warning)';
		if (percentage < 100) return '#fb8c00';
		return 'var(--danger)';
	}
</script>

<div class="budgets-page">
	<!-- Toast Notification -->
	{#if showToast}
		<div class="toast">{toastMessage}</div>
	{/if}

	<h1 class="page-title">🎯 Budgets</h1>

	<!-- Month Selector -->
	<div class="month-selector-card">
		<button class="month-nav-btn" onclick={goToPreviousMonth} aria-label="Previous month">
			◀
		</button>
		<div class="month-display">{getMonthName(selectedMonth)}</div>
		<button class="month-nav-btn" onclick={goToNextMonth} aria-label="Next month">▶</button>
	</div>

	<!-- Budget Insights -->
	{#if overallBudget || categoryBudgets.length > 0}
		<div class="insights-card">
			<h2 class="insights-title">📊 Budget Insights</h2>
			<div class="insights-grid">
				<div class="insight">
					<div class="insight-label">Status</div>
					<div
						class="insight-value"
						class:success={overBudgetCount === 0}
						class:danger={overBudgetCount > 0}
					>
						{#if overBudgetCount === 0}
							✅ You're on track!
						{:else}
							⚠️ {overBudgetCount} budget{overBudgetCount > 1 ? 's' : ''} exceeded
						{/if}
					</div>
				</div>

				<div class="insight">
					<div class="insight-label">Projected Spending</div>
					<div class="insight-value">{formatCurrency(projectedMonthlySpending)}</div>
					<div class="insight-sub">At current rate</div>
				</div>

				<div class="insight">
					<div class="insight-label">Avg Daily Spending</div>
					<div class="insight-value">{formatCurrency(averageDailySpending)}</div>
					<div class="insight-sub">
						{#if overallBudget}
							Budget: {formatCurrency(overallBudget.amount / daysInMonth)}/day
						{/if}
					</div>
				</div>

				<div class="insight">
					<div class="insight-label">Days Remaining</div>
					<div class="insight-value">{daysRemaining}</div>
					<div class="insight-sub">out of {daysInMonth} days</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Set Overall Budget -->
	<div class="budget-card">
		<h2 class="card-title">💰 Overall Budget</h2>

		{#if overallBudget}
			<div class="current-budget">
				<div class="budget-header">
					<span>Monthly Budget</span>
					<span class="budget-amount">{formatCurrency(overallBudget.amount)}</span>
				</div>
				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {Math.min(overallBudgetPercentage, 100)}%; background: {getBudgetColor(
							overallBudgetPercentage
						)};"
					></div>
				</div>
				<div class="budget-footer">
					<span>Spent: {formatCurrency(totalExpenses)}</span>
					<span style="color: {getBudgetColor(overallBudgetPercentage)};"
						>{overallBudgetPercentage.toFixed(1)}% used</span
					>
				</div>
			</div>
		{/if}

		<div class="budget-form">
			<div class="form-group">
				<label for="overall-budget">{overallBudget ? 'Update' : 'Set'} Overall Budget (₹)</label>
				<div class="input-row">
					<input
						type="number"
						id="overall-budget"
						bind:value={overallBudgetAmount}
						placeholder={overallBudget ? overallBudget.amount / 100 + '' : '5000.00'}
						step="0.01"
						min="0"
					/>
					<button class="set-btn" onclick={handleSetOverallBudget}>
						{overallBudget ? 'Update' : 'Set'} Budget
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Category Budgets -->
	<div class="category-budgets-card">
		<h2 class="card-title">📁 Category Budgets</h2>

		{#if categoriesWithBudgets.length > 0}
			<div class="categories-list">
				{#each categoriesWithBudgets as { category, budget, spent, percentage } (category.id)}
					<div class="category-budget-item">
						<div class="category-header">
							<div class="category-info">
								<span class="category-icon">{category.icon}</span>
								<span class="category-name">{category.name}</span>
							</div>
							<div class="category-spent">{formatCurrency(spent)}</div>
						</div>

						{#if budget}
							<div class="budget-details">
								<div class="budget-bar-header">
									<span class="budget-limit">Budget: {formatCurrency(budget.amount)}</span>
									<span class="budget-percentage" style="color: {getBudgetColor(percentage)};"
										>{percentage.toFixed(1)}%</span
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
						{:else}
							<div class="set-budget-form">
								<div class="input-row">
									<input
										type="number"
										bind:value={categoryBudgetInputs[category.id]}
										placeholder="Set budget..."
										step="0.01"
										min="0"
									/>
									<button
										class="set-btn small"
										onclick={() => handleSetCategoryBudget(category.id)}
									>
										Set
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<p>No categories available</p>
			</div>
		{/if}
	</div>

	<!-- Budget Overview Chart -->
	{#if categoryBudgets.length > 0}
		<div class="overview-card">
			<h2 class="card-title">📈 Budget Overview</h2>
			<div class="overview-chart">
				{#each categoriesWithBudgets.filter((c) => c.budget) as { category, budget, spent, percentage }}
					<div class="chart-row">
						<div class="chart-label">
							<span>{category.icon}</span>
							<span>{category.name}</span>
						</div>
						<div class="chart-bars">
							<div class="chart-bar-container">
								<div
									class="chart-bar spent"
									style="width: {budget
										? (spent / budget.amount) * 100
										: 0}%; background: {getBudgetColor(percentage)};"
								>
									<span class="bar-label">{formatCurrency(spent)}</span>
								</div>
							</div>
							<div class="chart-total">{formatCurrency(budget?.amount || 0)}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.budgets-page {
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

	/* Toast */
	.toast {
		position: fixed;
		top: 2rem;
		right: 2rem;
		background: var(--success);
		color: white;
		padding: 1rem 1.5rem;
		border-radius: var(--border-radius);
		box-shadow: var(--shadow-lg);
		z-index: 1000;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* Page Title */
	.page-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	/* Month Selector */
	.month-selector-card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1rem;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: var(--shadow-md);
	}

	.month-nav-btn {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--accent-primary);
		width: 40px;
		height: 40px;
		border-radius: var(--border-radius);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		transition: all 0.2s;
	}

	.month-nav-btn:hover {
		background: var(--bg-hover);
		border-color: var(--accent-primary);
		transform: scale(1.05);
	}

	.month-display {
		flex: 1;
		text-align: center;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	/* Insights Card */
	.insights-card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: var(--shadow-md);
	}

	.insights-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.insights-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
	}

	.insight {
		text-align: center;
	}

	.insight-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.insight-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent-primary);
		margin-bottom: 0.25rem;
	}

	.insight-value.success {
		color: var(--success);
	}

	.insight-value.danger {
		color: var(--danger);
	}

	.insight-sub {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	/* Budget Card */
	.budget-card,
	.category-budgets-card,
	.overview-card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: var(--shadow-md);
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	/* Current Budget */
	.current-budget {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.budget-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.budget-amount {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent-primary);
	}

	.progress-bar {
		height: 12px;
		background: var(--bg-primary);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.75rem;
		position: relative;
	}

	.progress-bar.small {
		height: 8px;
	}

	.progress-fill {
		height: 100%;
		transition:
			width 0.5s ease,
			background 0.3s ease;
		border-radius: 6px;
		position: relative;
	}

	.budget-footer {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	/* Budget Form */
	.budget-form,
	.set-budget-form {
		margin-top: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.input-row {
		display: flex;
		gap: 0.75rem;
	}

	input[type='number'] {
		flex: 1;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.75rem;
		border-radius: var(--border-radius);
		font-size: 1rem;
		transition: all 0.2s;
	}

	input[type='number']:focus {
		outline: none;
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px rgba(192, 192, 192, 0.1);
	}

	.set-btn {
		background: var(--accent-primary);
		color: var(--bg-primary);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: var(--border-radius);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.set-btn.small {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
	}

	.set-btn:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
	}

	/* Category Budgets */
	.categories-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.category-budget-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1.25rem;
		transition: all 0.2s;
	}

	.category-budget-item:hover {
		background: var(--bg-hover);
		box-shadow: var(--shadow-sm);
	}

	.category-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.category-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.category-icon {
		font-size: 1.5rem;
	}

	.category-name {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1.125rem;
	}

	.category-spent {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--accent-primary);
	}

	.budget-details {
		margin-top: 1rem;
	}

	.budget-bar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.budget-limit {
		color: var(--text-secondary);
	}

	.budget-percentage {
		font-weight: 600;
	}

	/* Overview Chart */
	.overview-chart {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.chart-row {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.chart-label {
		min-width: 150px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.chart-bars {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.chart-bar-container {
		flex: 1;
		height: 32px;
		background: var(--bg-secondary);
		border-radius: var(--border-radius);
		overflow: hidden;
		position: relative;
	}

	.chart-bar {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0 0.75rem;
		transition: width 0.5s ease;
		min-width: fit-content;
	}

	.bar-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		white-space: nowrap;
	}

	.chart-total {
		min-width: 100px;
		text-align: right;
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.insights-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}

		.chart-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.chart-label {
			width: 100%;
		}

		.chart-bars {
			width: 100%;
		}

		.chart-total {
			text-align: left;
		}

		.input-row {
			flex-direction: column;
		}

		.set-btn {
			width: 100%;
		}
	}
</style>
