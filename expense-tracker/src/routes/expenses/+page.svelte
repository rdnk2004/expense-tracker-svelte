<script lang="ts">
	import { writable } from 'svelte/store';
	import {
		wallets,
		expenses,
		categories,
		addExpense,
		removeExpense,
		formatCurrency,
		formatDate,
		formatDateInput,
		currentMonth
	} from '$lib/stores';
	import type { Expense } from '$lib/types';

	// Form state
	let formOpen = $state(true);
	let formData = $state({
		amount: '',
		walletId: '',
		categoryId: '',
		subcategory: '',
		date: formatDateInput(new Date().toISOString()),
		note: ''
	});
	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');

	// Filter state
	let filters = $state({
		search: '',
		categoryIds: [] as string[],
		walletId: 'all',
		startDate: '',
		endDate: ''
	});

	// Computed values
	let selectedCategory = $derived($categories.find((c) => c.id === formData.categoryId));
	let selectedWallet = $derived($wallets.find((w) => w.id === formData.walletId));
	let amountInPaise = $derived(formData.amount ? Math.round(parseFloat(formData.amount) * 100) : 0);
	let hasInsufficientBalance = $derived(
		selectedWallet ? amountInPaise > selectedWallet.balance : false
	);

	// Filtered expenses
	let filteredExpenses = $derived(
		$expenses.filter((expense) => {
			// Search filter
			if (filters.search && !expense.note?.toLowerCase().includes(filters.search.toLowerCase())) {
				return false;
			}

			// Category filter
			if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(expense.categoryId)) {
				return false;
			}

			// Wallet filter
			if (filters.walletId !== 'all' && expense.walletId !== filters.walletId) {
				return false;
			}

			// Date range filter
			if (filters.startDate && expense.date < filters.startDate) {
				return false;
			}
			if (filters.endDate && expense.date > filters.endDate) {
				return false;
			}

			return true;
		})
	);

	// Sort by date (newest first)
	let sortedExpenses = $derived(
		[...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	);

	// Summary stats
	let totalExpenses = $derived(filteredExpenses.reduce((sum, e) => sum + e.amount, 0));
	let expenseCount = $derived(filteredExpenses.length);
	let averageExpense = $derived(expenseCount > 0 ? totalExpenses / expenseCount : 0);
	let categorySpending = $derived(
		filteredExpenses.reduce(
			(acc, expense) => {
				acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
				return acc;
			},
			{} as Record<string, number>
		)
	);
	let topCategory = $derived(Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0]);
	let topCategoryData = $derived(
		topCategory ? $categories.find((c) => c.id === topCategory[0]) : null
	);

	function validateForm(): boolean {
		errors = {};

		if (!formData.amount || parseFloat(formData.amount) <= 0) {
			errors.amount = 'Amount must be greater than 0';
		}

		if (!formData.walletId) {
			errors.walletId = 'Please select a wallet';
		}

		if (!formData.categoryId) {
			errors.categoryId = 'Please select a category';
		}

		if (!formData.date) {
			errors.date = 'Please select a date';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		isSubmitting = true;

		try {
			await addExpense({
				amount: amountInPaise,
				walletId: formData.walletId,
				categoryId: formData.categoryId,
				subcategory: formData.subcategory || null,
				date: new Date(formData.date).toISOString(),
				note: formData.note || null
			});

			// Reset form
			formData = {
				amount: '',
				walletId: formData.walletId, // Keep wallet selected
				categoryId: '',
				subcategory: '',
				date: formatDateInput(new Date().toISOString()),
				note: ''
			};

			showSuccessToast('Expense added successfully! 🎉');
		} catch (error) {
			console.error('Failed to add expense:', error);
			showSuccessToast('Failed to add expense ❌');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete(expense: Expense) {
		if (!confirm('Are you sure you want to delete this expense?')) return;

		try {
			await removeExpense(expense.id);
			showSuccessToast('Expense deleted');
		} catch (error) {
			console.error('Failed to delete expense:', error);
			showSuccessToast('Failed to delete expense ❌');
		}
	}

	function showSuccessToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	function resetFilters() {
		filters = {
			search: '',
			categoryIds: [],
			walletId: 'all',
			startDate: '',
			endDate: ''
		};
	}

	function toggleCategoryFilter(categoryId: string) {
		if (filters.categoryIds.includes(categoryId)) {
			filters.categoryIds = filters.categoryIds.filter((id) => id !== categoryId);
		} else {
			filters.categoryIds = [...filters.categoryIds, categoryId];
		}
	}

	function getCategoryById(id: string) {
		return $categories.find((c) => c.id === id);
	}

	function getWalletById(id: string) {
		return $wallets.find((w) => w.id === id);
	}
</script>

<div class="expenses-page">
	<!-- Toast Notification -->
	{#if showToast}
		<div class="toast">{toastMessage}</div>
	{/if}

	<div class="page-header">
		<h1 class="page-title">🧾 Expenses</h1>
		<button class="toggle-form-btn" onclick={() => (formOpen = !formOpen)}>
			{formOpen ? '▼ Hide Form' : '▶ Add Expense'}
		</button>
	</div>

	<!-- Add Expense Form -->
	{#if formOpen}
		<div class="form-card">
			<h2 class="form-title">Add New Expense</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<div class="form-grid">
					<div class="form-group">
						<label for="amount">Amount (₹) *</label>
						<input
							type="number"
							id="amount"
							bind:value={formData.amount}
							placeholder="0.00"
							step="0.01"
							min="0"
							class:error={errors.amount}
						/>
						{#if errors.amount}
							<span class="error-message">{errors.amount}</span>
						{/if}
						{#if hasInsufficientBalance}
							<span class="warning-message">⚠️ Insufficient balance in selected wallet</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="wallet">Wallet *</label>
						<select id="wallet" bind:value={formData.walletId} class:error={errors.walletId}>
							<option value="">Select wallet</option>
							{#each $wallets as wallet}
								<option value={wallet.id}>{wallet.name} ({formatCurrency(wallet.balance)})</option>
							{/each}
						</select>
						{#if errors.walletId}
							<span class="error-message">{errors.walletId}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="category">Category *</label>
						<select
							id="category"
							bind:value={formData.categoryId}
							onchange={() => (formData.subcategory = '')}
							class:error={errors.categoryId}
						>
							<option value="">Select category</option>
							{#each $categories as category}
								<option value={category.id}>{category.icon} {category.name}</option>
							{/each}
						</select>
						{#if errors.categoryId}
							<span class="error-message">{errors.categoryId}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="subcategory">Subcategory</label>
						<select
							id="subcategory"
							bind:value={formData.subcategory}
							disabled={!selectedCategory || selectedCategory.subcategories.length === 0}
						>
							<option value="">None</option>
							{#if selectedCategory}
								{#each selectedCategory.subcategories as sub}
									<option value={sub}>{sub}</option>
								{/each}
							{/if}
						</select>
					</div>

					<div class="form-group">
						<label for="date">Date *</label>
						<input type="date" id="date" bind:value={formData.date} class:error={errors.date} />
						{#if errors.date}
							<span class="error-message">{errors.date}</span>
						{/if}
					</div>

					<div class="form-group full-width">
						<label for="note">Note (optional, max 200 chars)</label>
						<input
							type="text"
							id="note"
							bind:value={formData.note}
							placeholder="e.g., Coffee with friends"
							maxlength="200"
						/>
						<span class="char-count">{formData.note.length}/200</span>
					</div>
				</div>

				<button type="submit" class="submit-btn" disabled={isSubmitting}>
					{isSubmitting ? '⏳ Adding...' : '+ Add Expense'}
				</button>
			</form>
		</div>
	{/if}

	<!-- Summary Stats -->
	<div class="stats-card">
		<div class="stat">
			<span class="stat-label">Total</span>
			<span class="stat-value">{formatCurrency(totalExpenses)}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Count</span>
			<span class="stat-value">{expenseCount}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Average</span>
			<span class="stat-value">{formatCurrency(averageExpense)}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Top Category</span>
			<span class="stat-value"
				>{topCategoryData ? `${topCategoryData.icon} ${topCategoryData.name}` : 'N/A'}</span
			>
		</div>
	</div>

	<!-- Filters Bar -->
	<div class="filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="search">Search</label>
				<input type="text" id="search" bind:value={filters.search} placeholder="Search notes..." />
			</div>

			<div class="filter-group">
				<label for="wallet-filter">Wallet</label>
				<select id="wallet-filter" bind:value={filters.walletId}>
					<option value="all">All Wallets</option>
					{#each $wallets as wallet}
						<option value={wallet.id}>{wallet.name}</option>
					{/each}
				</select>
			</div>

			<div class="filter-group">
				<label for="start-date">Start Date</label>
				<input type="date" id="start-date" bind:value={filters.startDate} />
			</div>

			<div class="filter-group">
				<label for="end-date">End Date</label>
				<input type="date" id="end-date" bind:value={filters.endDate} />
			</div>
		</div>

		<div class="category-filters">
			<label>Categories:</label>
			<div class="category-chips">
				{#each $categories as category}
					<button
						class="category-chip"
						class:active={filters.categoryIds.includes(category.id)}
						onclick={() => toggleCategoryFilter(category.id)}
						style="--category-color: {category.color};"
					>
						{category.icon}
						{category.name}
					</button>
				{/each}
			</div>
		</div>

		<button class="reset-btn" onclick={resetFilters}>Reset Filters</button>
	</div>

	<!-- Expenses List -->
	<div class="expenses-list">
		{#if sortedExpenses.length > 0}
			{#each sortedExpenses as expense (expense.id)}
				{@const category = getCategoryById(expense.categoryId)}
				{@const wallet = getWalletById(expense.walletId)}
				<div class="expense-item" style="--category-color: {category?.color || '#808080'};">
					<div class="expense-icon">{category?.icon || '📦'}</div>
					<div class="expense-details">
						<div class="expense-category">
							{category?.name || 'Unknown'}
							{#if expense.subcategory}
								<span class="subcategory">• {expense.subcategory}</span>
							{/if}
						</div>
						{#if expense.note}
							<div class="expense-note">{expense.note}</div>
						{/if}
						<div class="expense-meta">
							<span class="wallet-badge">{wallet?.name || 'Unknown'}</span>
							<span class="expense-date">{formatDate(expense.date)}</span>
						</div>
					</div>
					<div class="expense-actions">
						<div class="expense-amount">{formatCurrency(expense.amount)}</div>
						<button class="delete-btn" onclick={() => handleDelete(expense)} title="Delete">
							🗑️
						</button>
					</div>
				</div>
			{/each}
		{:else}
			<div class="empty-state">
				<div class="empty-icon">📭</div>
				<h3>No expenses found</h3>
				<p>
					{#if filters.search || filters.categoryIds.length > 0 || filters.walletId !== 'all' || filters.startDate || filters.endDate}
						Try adjusting your filters
					{:else}
						Add your first expense above
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.expenses-page {
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

	/* Page Header */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.toggle-form-btn {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		color: var(--accent-primary);
		padding: 0.75rem 1.5rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
	}

	.toggle-form-btn:hover {
		background: var(--bg-hover);
		border-color: var(--accent-primary);
	}

	/* Form Card */
	.form-card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: var(--shadow-md);
	}

	.form-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	input,
	select {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.75rem;
		border-radius: var(--border-radius);
		font-size: 1rem;
		transition: all 0.2s;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px rgba(192, 192, 192, 0.1);
	}

	input.error,
	select.error {
		border-color: var(--danger);
	}

	input:disabled,
	select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-message {
		font-size: 0.75rem;
		color: var(--danger);
	}

	.warning-message {
		font-size: 0.75rem;
		color: var(--warning);
	}

	.char-count {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-align: right;
	}

	.submit-btn {
		width: 100%;
		background: var(--accent-primary);
		color: var(--bg-primary);
		border: none;
		padding: 1rem;
		border-radius: var(--border-radius);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Stats Card */
	.stats-card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		box-shadow: var(--shadow-md);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-align: center;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--accent-primary);
	}

	/* Filters Card */
	.filters-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.category-filters {
		margin-bottom: 1rem;
	}

	.category-filters label {
		display: block;
		margin-bottom: 0.75rem;
	}

	.category-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.category-chip {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.5rem 1rem;
		border-radius: 20px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.category-chip:hover {
		background: var(--bg-hover);
		border-color: var(--category-color);
	}

	.category-chip.active {
		background: var(--category-color);
		color: white;
		border-color: var(--category-color);
	}

	.reset-btn {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.75rem 1.5rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.reset-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	/* Expenses List */
	.expenses-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.expense-item {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-left: 4px solid var(--category-color);
		border-radius: var(--border-radius);
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.2s;
	}

	.expense-item:hover {
		background: var(--bg-hover);
		box-shadow: var(--shadow-md);
	}

	.expense-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
	}

	.expense-details {
		flex: 1;
	}

	.expense-category {
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
		font-size: 1.125rem;
	}

	.subcategory {
		color: var(--text-secondary);
		font-weight: 400;
		font-size: 1rem;
	}

	.expense-note {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
		margin-bottom: 0.5rem;
	}

	.expense-meta {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.wallet-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		color: var(--text-secondary);
	}

	.expense-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.expense-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.expense-amount {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent-primary);
	}

	.delete-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.25rem;
		opacity: 0.5;
		transition: all 0.2s;
		padding: 0.25rem;
	}

	.delete-btn:hover {
		opacity: 1;
		transform: scale(1.2);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--text-secondary);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.stats-card {
			grid-template-columns: repeat(2, 1fr);
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}

		.expense-item {
			flex-direction: column;
			align-items: flex-start;
		}

		.expense-actions {
			width: 100%;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
	}
</style>
