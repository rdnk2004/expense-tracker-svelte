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
	import {
		ArrowLeftRight,
		ArrowRight,
		CreditCard,
		Banknote,
		Calendar,
		Search,
		TrendingUp,
		Zap
	} from 'lucide-svelte';

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

	let filters = $state({
		search: '',
		monthFilter: ''
	});

	$effect(() => {
		if ($wallets.length > 0 && !formData.fromWalletId) {
			formData.fromWalletId = $wallets[0].id;
		}
		if ($wallets.length > 1 && !formData.toWalletId) {
			const other = $wallets.find((w) => w.id !== formData.fromWalletId);
			if (other) formData.toWalletId = other.id;
		}
	});

	let fromWallet = $derived($wallets.find((w) => w.id === formData.fromWalletId));
	let toWallet = $derived($wallets.find((w) => w.id === formData.toWalletId));
	let amountInPaise = $derived(formData.amount ? Math.round(parseFloat(formData.amount) * 100) : 0);
	let hasInsufficientBalance = $derived(fromWallet ? amountInPaise > fromWallet.balance : false);

	let balancePreview = $derived(
		fromWallet && toWallet && amountInPaise > 0
			? {
					fromBefore: fromWallet.balance,
					fromAfter: fromWallet.balance - amountInPaise,
					toBefore: toWallet.balance,
					toAfter: toWallet.balance + amountInPaise
				}
			: null
	);

	let currentMonthTransfers = $derived($transfers.filter((t) => t.date.startsWith($currentMonth)));
	let totalTransferred = $derived(currentMonthTransfers.reduce((sum, t) => sum + t.amount, 0));

	let filteredTransfers = $derived(
		$transfers.filter((transfer) => {
			if (filters.search && !transfer.note?.toLowerCase().includes(filters.search.toLowerCase())) {
				return false;
			}
			if (filters.monthFilter && !transfer.date.startsWith(filters.monthFilter)) {
				return false;
			}
			return true;
		})
	);

	let sortedTransfers = $derived(
		[...filteredTransfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	);

	function setQuickAmount(amt: number) {
		formData.amount = amt.toString();
	}

	function validateForm(): boolean {
		errors = {};
		if (!formData.amount || parseFloat(formData.amount) <= 0) {
			errors.amount = 'Enter a valid amount';
		}
		if (!formData.fromWalletId) {
			errors.fromWallet = 'Select source wallet';
		}
		if (!formData.toWalletId) {
			errors.toWallet = 'Select destination wallet';
		}
		if (formData.fromWalletId === formData.toWalletId) {
			errors.toWallet = 'Source and destination must differ';
		}
		if (hasInsufficientBalance) {
			errors.amount = 'Insufficient balance in source wallet';
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
				formData.note.trim() || undefined
			);

			formData.amount = '';
			formData.note = '';
			showToastMessage('Transfer completed! ⚡');
		} catch (err) {
			console.error(err);
			showToastMessage('Transfer failed.');
		} finally {
			isSubmitting = false;
		}
	}

	function showToastMessage(msg: string) {
		toastMessage = msg;
		showToast = true;
		setTimeout(() => (showToast = false), 3000);
	}

	function getWalletName(id: string) {
		return $wallets.find((w) => w.id === id)?.name || 'Wallet';
	}
</script>

<div class="transfers-page">
	{#if showToast}
		<div class="toast-pill">{toastMessage}</div>
	{/if}

	<div class="page-header">
		<div>
			<span class="campus-sub">Liquidity Rebalance</span>
			<h1 class="page-title">Wallet Transfers & ATM</h1>
		</div>
	</div>

	<!-- Monthly Volume Summary Card -->
	<div class="card volume-summary-card">
		<div class="summary-stat-col">
			<span class="v-label">Monthly Velocity</span>
			<div class="v-amount tabular">{formatCurrency(totalTransferred)}</div>
		</div>
		<div class="summary-pill">
			<Zap size={14} color="var(--accent-primary)" />
			<span>{currentMonthTransfers.length} Transfers</span>
		</div>
	</div>

	<!-- Transfer Execution Card -->
	<div class="card transfer-form-card">
		<h3 class="card-section-title">New Transfer</h3>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<!-- Source & Destination Visual Row -->
			<div class="flow-picker-grid">
				<div class="flow-col">
					<label for="from-w-select">Debit Source</label>
					<select id="from-w-select" bind:value={formData.fromWalletId} class="flow-select">
						{#each $wallets as w}
							<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
						{/each}
					</select>
				</div>

				<div class="flow-arrow-icon">
					<ArrowRight size={18} color="var(--accent-primary)" />
				</div>

				<div class="flow-col">
					<label for="to-w-select">Credit Destination</label>
					<select id="to-w-select" bind:value={formData.toWalletId} class="flow-select">
						{#each $wallets.filter(w => w.id !== formData.fromWalletId) as w}
							<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Amount Input & Quick Chips -->
			<div class="amount-entry-section">
				<label for="transfer-amt">Transfer Amount (₹)</label>
				<div class="amount-input-wrap">
					<span class="currency-glyph">₹</span>
					<input
						id="transfer-amt"
						type="number"
						step="0.01"
						placeholder="0.00"
						bind:value={formData.amount}
						class="giant-amount-input tabular"
					/>
				</div>
				{#if errors.amount}
					<span class="error-msg">{errors.amount}</span>
				{/if}

				<!-- Quick Chips -->
				<div class="quick-preset-chips">
					<button type="button" class="preset-chip" onclick={() => setQuickAmount(200)}>₹200</button>
					<button type="button" class="preset-chip" onclick={() => setQuickAmount(500)}>₹500</button>
					<button type="button" class="preset-chip" onclick={() => setQuickAmount(1000)}>₹1,000</button>
					<button type="button" class="preset-chip" onclick={() => setQuickAmount(2000)}>₹2,000 (ATM)</button>
				</div>
			</div>

			<!-- Live Balance Preview -->
			{#if balancePreview}
				<div class="balance-preview-box">
					<div class="preview-item">
						<span class="preview-name">{fromWallet?.name}</span>
						<span class="preview-calc tabular">{formatCurrency(balancePreview.fromBefore)} ➔ <strong>{formatCurrency(balancePreview.fromAfter)}</strong></span>
					</div>
					<div class="preview-item">
						<span class="preview-name">{toWallet?.name}</span>
						<span class="preview-calc tabular">{formatCurrency(balancePreview.toBefore)} ➔ <strong>{formatCurrency(balancePreview.toAfter)}</strong></span>
					</div>
				</div>
			{/if}

			<!-- Note & Date -->
			<div class="meta-inputs-grid">
				<div class="meta-input-wrap">
					<label for="t-note">Note / Purpose</label>
					<input id="t-note" type="text" placeholder="e.g. ATM Cash pull, GPay reload..." bind:value={formData.note} />
				</div>
				<div class="meta-input-wrap">
					<label for="t-date">Date</label>
					<input id="t-date" type="date" bind:value={formData.date} />
				</div>
			</div>

			<button type="submit" class="submit-transfer-btn" disabled={isSubmitting}>
				{isSubmitting ? 'Transferring...' : 'Execute Transfer'}
			</button>
		</form>
	</div>

	<!-- Transfer History -->
	<div class="card history-section-card">
		<div class="history-header">
			<h3 class="card-section-title">Transfer History</h3>
		</div>

		<div class="history-list">
			{#each sortedTransfers as t}
				<div class="history-row">
					<div class="history-icon-box">
						<ArrowLeftRight size={18} color="var(--accent-primary)" />
					</div>
					<div class="history-details">
						<div class="history-route">
							<strong>{getWalletName(t.fromWalletId)}</strong>
							<span class="route-arrow">➔</span>
							<strong>{getWalletName(t.toWalletId)}</strong>
						</div>
						<div class="history-meta">
							<span>{t.note || 'Internal Transfer'}</span>
							<span>•</span>
							<span>{formatDate(t.date)}</span>
						</div>
					</div>
					<div class="history-amount tabular">
						{formatCurrency(t.amount)}
					</div>
				</div>
			{:else}
				<div class="empty-history">
					<p>No transfers recorded yet.</p>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.transfers-page {
		max-width: 680px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
	}

	.toast-pill {
		position: fixed;
		top: 1.25rem;
		left: 50%;
		transform: translateX(-50%);
		background: #10B981;
		color: #080C14;
		font-weight: 800;
		font-size: 0.85rem;
		padding: 0.55rem 1.25rem;
		border-radius: var(--border-radius-pill);
		box-shadow: var(--shadow-lg);
		z-index: 10000;
	}

	.page-header {
		margin-bottom: 1.15rem;
	}

	.campus-sub {
		display: block;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent-primary);
		margin-bottom: 2px;
	}

	.page-title {
		font-size: 1.45rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		margin: 0;
		line-height: 1.2;
	}

	@media (min-width: 768px) {
		.page-title {
			font-size: 1.65rem;
		}
	}

	/* Volume Summary Card */
	.volume-summary-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.15rem;
		background: linear-gradient(135deg, var(--bg-card) 0%, var(--surface-2) 100%);
	}

	.v-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.v-amount {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.summary-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		padding: 0.35rem 0.75rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-secondary);
	}

	/* Transfer Form Card */
	.transfer-form-card {
		padding: 1.15rem;
	}

	.card-section-title {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1.15rem;
	}

	.flow-picker-grid {
		display: grid;
		grid-template-columns: 1fr 30px 1fr;
		gap: 8px;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.flow-col {
		display: flex;
		flex-direction: column;
	}

	.flow-select {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 0.75rem 1rem;
		font-size: 16px;
		color: var(--text-primary);
		min-height: 48px;
	}

	.flow-arrow-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 18px;
	}

	/* Amount entry */
	.amount-entry-section {
		margin-bottom: 1.15rem;
	}

	.amount-input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.currency-glyph {
		position: absolute;
		left: 14px;
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--accent-primary);
	}

	.giant-amount-input {
		padding-left: 36px;
		font-size: 1.85rem;
		font-weight: 800;
		height: 60px;
	}

	.error-msg {
		font-size: 0.74rem;
		color: var(--danger);
		font-weight: 600;
		margin-top: 3px;
		display: block;
	}

	.quick-preset-chips {
		display: flex;
		gap: 6px;
		margin-top: 8px;
		flex-wrap: wrap;
	}

	.preset-chip {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 6px 12px;
		border-radius: var(--border-radius-pill);
		font-size: 0.78rem;
		font-weight: 700;
		transition: all 0.2s ease;
	}

	.preset-chip:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
		border-color: var(--accent-primary);
	}

	/* Balance Preview */
	.balance-preview-box {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 0.85rem 1rem;
		margin-bottom: 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.preview-item {
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
		color: var(--text-secondary);
	}

	.preview-item strong {
		color: var(--text-primary);
	}

	.meta-inputs-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-bottom: 1.25rem;
	}

	.submit-transfer-btn {
		width: 100%;
		background: var(--accent-primary);
		color: #FFFFFF;
		font-weight: 800;
		font-size: 0.95rem;
		padding: 0.85rem;
		border-radius: var(--border-radius-pill);
		box-shadow: 0 4px 14px var(--accent-glow);
		transition: all 0.2s ease;
		min-height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.submit-transfer-btn:hover {
		filter: brightness(1.1);
	}

	/* History */
	.history-section-card {
		padding: 1.15rem;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.history-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.85rem 1rem;
		border-radius: var(--border-radius);
		background: var(--surface-2);
		border: 1px solid var(--border-color);
	}

	.history-icon-box {
		width: 42px;
		height: 42px;
		border-radius: var(--border-radius-xs);
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.history-details {
		flex: 1;
		min-width: 0;
	}

	.history-route {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.route-arrow {
		color: var(--accent-primary);
	}

	.history-meta {
		font-size: 0.75rem;
		color: var(--text-muted);
		display: flex;
		gap: 5px;
		margin-top: 2px;
	}

	.history-amount {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.empty-history {
		text-align: center;
		padding: 2rem;
		color: var(--text-muted);
		font-size: 0.84rem;
	}

	@media (max-width: 480px) {
		.flow-picker-grid {
			grid-template-columns: 1fr;
		}

		.flow-arrow-icon {
			margin: 0 auto;
			transform: rotate(90deg);
		}

		.meta-inputs-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
