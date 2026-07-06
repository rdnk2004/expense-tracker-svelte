<script lang="ts">
	import {
		wallets,
		transfers,
		currentMonth,
		createTransfer,
		formatCurrency,
		formatDate,
		formatDateInput
	} from '$lib/stores';
	import { ArrowLeftRight, ArrowRight, Loader2 } from 'lucide-svelte';

	// Form state
	let formData = $state({
		fromWalletId: '',
		toWalletId: '',
		amount: '',
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
		monthFilter: ''
	});

	// Computed values
	let fromWallet = $derived($wallets.find((w) => w.id === formData.fromWalletId));
	let toWallet = $derived($wallets.find((w) => w.id === formData.toWalletId));
	let amountInPaise = $derived(formData.amount ? Math.round(parseFloat(formData.amount) * 100) : 0);
	let hasInsufficientBalance = $derived(fromWallet ? amountInPaise > fromWallet.balance : false);

	// Balance preview
	let balancePreview = $derived(
		fromWallet && toWallet && amountInPaise > 0
			? {
					fromBefore: fromWallet.balance,
					fromAfter: fromWallet.balance - amountInPaise,
					fromChange: -amountInPaise,
					toBefore: toWallet.balance,
					toAfter: toWallet.balance + amountInPaise,
					toChange: amountInPaise
				}
			: null
	);

	// Filtered transfers
	let filteredTransfers = $derived(
		$transfers.filter((transfer) => {
			// Search filter
			if (filters.search && !transfer.note?.toLowerCase().includes(filters.search.toLowerCase())) {
				return false;
			}

			// Month filter
			if (filters.monthFilter && !transfer.date.startsWith(filters.monthFilter)) {
				return false;
			}

			return true;
		})
	);

	// Sort by date (newest first)
	let sortedTransfers = $derived(
		[...filteredTransfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	);

	// Current month transfers for stats
	let currentMonthTransfers = $derived($transfers.filter((t) => t.date.startsWith($currentMonth)));

	// Summary stats
	let totalTransferred = $derived(currentMonthTransfers.reduce((sum, t) => sum + t.amount, 0));
	let upiToCash = $derived(
		currentMonthTransfers.filter(
			(t) =>
				$wallets.find((w) => w.id === t.fromWalletId)?.name === 'UPI' &&
				$wallets.find((w) => w.id === t.toWalletId)?.name === 'Cash'
		)
	);
	let cashToUpi = $derived(
		currentMonthTransfers.filter(
			(t) =>
				$wallets.find((w) => w.id === t.fromWalletId)?.name === 'Cash' &&
				$wallets.find((w) => w.id === t.toWalletId)?.name === 'UPI'
		)
	);

	function validateForm(): boolean {
		errors = {};

		if (!formData.amount || parseFloat(formData.amount) <= 0) {
			errors.amount = 'Amount must be greater than 0';
		}

		if (!formData.fromWalletId) {
			errors.fromWallet = 'Please select source wallet';
		}

		if (!formData.toWalletId) {
			errors.toWallet = 'Please select destination wallet';
		}

		if (
			formData.fromWalletId &&
			formData.toWalletId &&
			formData.fromWalletId === formData.toWalletId
		) {
			errors.toWallet = 'Source and destination must be different';
		}

		if (hasInsufficientBalance) {
			errors.amount = 'Insufficient balance in source wallet';
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
			await createTransfer(
				formData.fromWalletId,
				formData.toWalletId,
				amountInPaise,
				new Date(formData.date).toISOString(),
				formData.note || undefined
			);

			// Reset form
			formData = {
				fromWalletId: '',
				toWalletId: '',
				amount: '',
				date: formatDateInput(new Date().toISOString()),
				note: ''
			};

			showSuccessToast('Transfer completed successfully! 🎉');
		} catch (error) {
			console.error('Failed to create transfer:', error);
			showSuccessToast('Failed to create transfer ❌');
		} finally {
			isSubmitting = false;
		}
	}

	function showSuccessToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	function getWalletById(id: string) {
		return $wallets.find((w) => w.id === id);
	}

	function resetFilters() {
		filters = {
			search: '',
			monthFilter: ''
		};
	}
</script>

<div class="transfers-page">
	<!-- Toast Notification -->
	{#if showToast}
		<div class="toast">{toastMessage}</div>
	{/if}

	<h1 class="page-title">
		<ArrowLeftRight class="inline-icon" size={32} /> Transfers
	</h1>

	<!-- Summary Stats -->
	<div class="stats-card">
		<div class="stat">
			<span class="stat-label">Total This Month</span>
			<span class="stat-value">{formatCurrency(totalTransferred)}</span>
		</div>
		<div class="stat">
			<span class="stat-label">UPI <ArrowRight size={12} class="inline" /> Cash</span>
			<span class="stat-value"
				>{upiToCash.length} ({formatCurrency(
					upiToCash.reduce((sum, t) => sum + t.amount, 0)
				)})</span
			>
		</div>
		<div class="stat">
			<span class="stat-label">Cash <ArrowRight size={12} class="inline" /> UPI</span>
			<span class="stat-value"
				>{cashToUpi.length} ({formatCurrency(
					cashToUpi.reduce((sum, t) => sum + t.amount, 0)
				)})</span
			>
		</div>
	</div>

	<!-- Create Transfer Form -->
	<div class="form-card">
		<h2 class="form-title">Create Transfer</h2>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
		>
			<div class="form-grid">
				<div class="form-group">
					<label for="from-wallet">From Wallet *</label>
					<select
						id="from-wallet"
						bind:value={formData.fromWalletId}
						class:error={errors.fromWallet}
					>
						<option value="">Select wallet</option>
						{#each $wallets as wallet}
							<option value={wallet.id}>{wallet.name} ({formatCurrency(wallet.balance)})</option>
						{/each}
					</select>
					{#if errors.fromWallet}
						<span class="error-message">{errors.fromWallet}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="to-wallet">To Wallet *</label>
					<select id="to-wallet" bind:value={formData.toWalletId} class:error={errors.toWallet}>
						<option value="">Select wallet</option>
						{#each $wallets as wallet}
							<option value={wallet.id}>{wallet.name} ({formatCurrency(wallet.balance)})</option>
						{/each}
					</select>
					{#if errors.toWallet}
						<span class="error-message">{errors.toWallet}</span>
					{/if}
				</div>

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
				</div>

				<div class="form-group">
					<label for="date">Date *</label>
					<input type="date" id="date" bind:value={formData.date} class:error={errors.date} />
					{#if errors.date}
						<span class="error-message">{errors.date}</span>
					{/if}
				</div>

				<div class="form-group full-width">
					<label for="note">Note (optional)</label>
					<input
						type="text"
						id="note"
						bind:value={formData.note}
						placeholder="e.g., Withdraw cash for groceries"
						maxlength="200"
					/>
				</div>
			</div>

			<!-- Transfer Preview -->
			{#if fromWallet && toWallet && amountInPaise > 0 && formData.fromWalletId !== formData.toWalletId}
				<div class="transfer-preview">
					<div class="preview-title">Preview</div>
					<div class="preview-summary">
						Transfer <strong>{formatCurrency(amountInPaise)}</strong> from
						<strong>{fromWallet.name}</strong> to <strong>{toWallet.name}</strong>
					</div>

					{#if balancePreview}
						<div class="balance-preview">
							<div class="balance-row">
								<span class="wallet-name">📱 {fromWallet.name}:</span>
								<span class="balance-change">
									{formatCurrency(balancePreview.fromBefore)} →
									{formatCurrency(balancePreview.fromAfter)}
									<span class="change negative">({formatCurrency(balancePreview.fromChange)})</span>
								</span>
							</div>
							<div class="balance-row">
								<span class="wallet-name">💵 {toWallet.name}:</span>
								<span class="balance-change">
									{formatCurrency(balancePreview.toBefore)} →
									{formatCurrency(balancePreview.toAfter)}
									<span class="change positive">(+{formatCurrency(balancePreview.toChange)})</span>
								</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<button type="submit" class="submit-btn" disabled={isSubmitting || hasInsufficientBalance}>
				{isSubmitting ? 'Processing...' : 'Create Transfer'}
				{#if isSubmitting}
					<Loader2 size={16} class="animate-spin ml-2" />
				{:else}
					<ArrowLeftRight size={16} class="ml-2" />
				{/if}
			</button>
		</form>
	</div>

	<!-- Filters -->
	<div class="filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="search">Search</label>
				<input type="text" id="search" bind:value={filters.search} placeholder="Search notes..." />
			</div>

			<div class="filter-group">
				<label for="month-filter">Month</label>
				<input type="month" id="month-filter" bind:value={filters.monthFilter} />
			</div>
		</div>

		<button class="reset-btn" onclick={resetFilters}>Reset Filters</button>
	</div>

	<!-- Transfers History -->
	<div class="transfers-list">
		<h2 class="section-title">Transfer History</h2>

		{#if sortedTransfers.length > 0}
			{#each sortedTransfers as transfer (transfer.id)}
				{@const fromWallet = getWalletById(transfer.fromWalletId)}
				{@const toWallet = getWalletById(transfer.toWalletId)}
				<div class="transfer-item">
					<div class="transfer-icon">
						<ArrowLeftRight size={24} />
					</div>
					<div class="transfer-details">
						<div class="transfer-flow">
							<span class="wallet-badge from">{fromWallet?.name || 'Unknown'}</span>
							<span class="arrow"><ArrowRight size={16} /></span>
							<span class="wallet-badge to">{toWallet?.name || 'Unknown'}</span>
						</div>
						{#if transfer.note}
							<div class="transfer-note">{transfer.note}</div>
						{/if}
						<div class="transfer-date">{formatDate(transfer.date)}</div>
					</div>
					<div class="transfer-amount">{formatCurrency(transfer.amount)}</div>
				</div>
			{/each}
		{:else}
			<div class="empty-state">
				<div class="empty-icon">
					<ArrowLeftRight size={48} />
				</div>
				<h3>No transfers found</h3>
				<p>
					{#if filters.search || filters.monthFilter}
						Try adjusting your filters
					{:else}
						Create your first transfer above
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.transfers-page {
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

	/* Stats Card */
	.stats-card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
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

	.error-message {
		font-size: 0.75rem;
		color: var(--danger);
	}

	/* Transfer Preview */
	.transfer-preview {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.preview-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.75rem;
	}

	.preview-summary {
		font-size: 1rem;
		color: var(--text-primary);
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.preview-summary strong {
		color: var(--accent-primary);
	}

	.balance-preview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.balance-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.wallet-name {
		font-weight: 500;
		color: var(--text-primary);
	}

	.balance-change {
		color: var(--text-secondary);
	}

	.change {
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.change.positive {
		color: var(--success);
	}

	.change.negative {
		color: var(--danger);
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
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	/* Transfers List */
	.transfers-list {
		margin-top: 2rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	.transfer-item {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1.25rem;
		margin-bottom: 0.75rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.2s;
	}

	.transfer-item:hover {
		background: var(--bg-hover);
		box-shadow: var(--shadow-md);
	}

	.transfer-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
	}

	.transfer-details {
		flex: 1;
	}

	.transfer-flow {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		font-size: 1rem;
	}

	.wallet-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.wallet-badge.from {
		background: linear-gradient(135deg, #4ecdc4 0%, #44a3a0 100%);
		color: white;
	}

	.wallet-badge.to {
		background: linear-gradient(135deg, #ff6b6b 0%, #e85a5a 100%);
		color: white;
	}

	.arrow {
		color: var(--accent-primary);
		font-size: 1.25rem;
		font-weight: 700;
	}

	.transfer-note {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
		margin-bottom: 0.5rem;
	}

	.transfer-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.transfer-amount {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent-primary);
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
		.stats-card {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}

		.transfer-item {
			flex-direction: column;
			align-items: flex-start;
		}

		.transfer-amount {
			align-self: flex-end;
		}

		.transfer-flow {
			flex-wrap: wrap;
		}
	}
</style>
