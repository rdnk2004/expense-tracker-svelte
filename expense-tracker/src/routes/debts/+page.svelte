<script lang="ts">
	import type { Debt } from '$lib/types';
	import {
		debts,
		wallets,
		addDebt,
		settleDebt,
		formatCurrency,
		formatDate,
		formatDateInput
	} from '$lib/stores';

	// Form state
	let formData = $state({
		person: '',
		amount: '',
		direction: 'give' as 'give' | 'receive',
		date: formatDateInput(new Date().toISOString()),
		note: ''
	});
	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);

	// Modal state
	let settlementModal = $state<{
		open: boolean;
		debt: Debt | null;
		step: 'options' | 'confirm';
		walletId: string | null;
	}>({
		open: false,
		debt: null,
		step: 'options',
		walletId: null
	});

	// UI state
	let showSettled = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');

	// Computed values
	let unsettledDebts = $derived($debts.filter((d) => !d.isSettled));
	let settledDebts = $derived($debts.filter((d) => d.isSettled));

	let debtsYouOwe = $derived(unsettledDebts.filter((d) => d.direction === 'give'));
	let debtsOwedToYou = $derived(unsettledDebts.filter((d) => d.direction === 'receive'));

	let totalYouOwe = $derived(debtsYouOwe.reduce((sum, d) => sum + d.amount, 0));
	let totalOwedToYou = $derived(debtsOwedToYou.reduce((sum, d) => sum + d.amount, 0));
	let netPosition = $derived(totalOwedToYou - totalYouOwe);

	let selectedWallet = $derived(
		settlementModal.walletId ? $wallets.find((w) => w.id === settlementModal.walletId) : null
	);
	let balanceAfterSettlement = $derived(
		selectedWallet && settlementModal.debt
			? selectedWallet.balance - settlementModal.debt.amount
			: 0
	);

	function validateForm(): boolean {
		errors = {};

		if (!formData.person.trim()) {
			errors.person = 'Person name is required';
		}

		if (!formData.amount || parseFloat(formData.amount) <= 0) {
			errors.amount = 'Amount must be greater than 0';
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
			await addDebt({
				person: formData.person.trim(),
				amount: Math.round(parseFloat(formData.amount) * 100),
				direction: formData.direction,
				date: new Date(formData.date).toISOString(),
				note: formData.note || null
			});

			// Reset form
			formData = {
				person: '',
				amount: '',
				direction: 'give',
				date: formatDateInput(new Date().toISOString()),
				note: ''
			};

			showSuccessToast('Debt added successfully! 🎉');
		} catch (error) {
			console.error('Failed to add debt:', error);
			showSuccessToast('Failed to add debt ❌');
		} finally {
			isSubmitting = false;
		}
	}

	function openSettlementModal(debt: Debt) {
		settlementModal = {
			open: true,
			debt,
			step: 'options',
			walletId: null
		};
	}

	function closeSettlementModal() {
		settlementModal = {
			open: false,
			debt: null,
			step: 'options',
			walletId: null
		};
	}

	function selectWalletOption(walletId: string | null) {
		settlementModal.walletId = walletId;
		settlementModal.step = 'confirm';
	}

	async function confirmSettlement() {
		if (!settlementModal.debt) return;

		try {
			await settleDebt(settlementModal.debt.id, settlementModal.walletId || undefined);
			showSuccessToast('Debt settled successfully! ✅');
			closeSettlementModal();
		} catch (error) {
			console.error('Failed to settle debt:', error);
			showSuccessToast('Failed to settle debt ❌');
		}
	}

	function showSuccessToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}
</script>

<div class="debts-page">
	<!-- Toast Notification -->
	{#if showToast}
		<div class="toast">{toastMessage}</div>
	{/if}

	<h1 class="page-title">🤝 Debts</h1>

	<!-- Debts Overview -->
	<div class="overview-card">
		<div class="overview-totals">
			<div class="overview-stat danger">
				<span class="overview-label">You Owe</span>
				<span class="overview-amount">{formatCurrency(totalYouOwe)}</span>
			</div>
			<div class="overview-stat success">
				<span class="overview-label">Owed to You</span>
				<span class="overview-amount">{formatCurrency(totalOwedToYou)}</span>
			</div>
		</div>
		<div class="net-position" class:positive={netPosition >= 0} class:negative={netPosition < 0}>
			<span class="net-label">Net Position:</span>
			<span class="net-amount">
				{netPosition >= 0 ? '+' : ''}{formatCurrency(Math.abs(netPosition))}
				{netPosition >= 0 ? '(in your favor)' : '(you owe)'}
			</span>
		</div>
	</div>

	<!-- Add Debt Form -->
	<div class="form-card">
		<h2 class="form-title">Add New Debt</h2>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
		>
			<div class="form-grid">
				<div class="form-group">
					<label for="person">Person Name *</label>
					<input
						type="text"
						id="person"
						bind:value={formData.person}
						placeholder="e.g., John Doe"
						class:error={errors.person}
					/>
					{#if errors.person}
						<span class="error-message">{errors.person}</span>
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
					<label>Direction *</label>
					<div class="radio-group">
						<label class="radio-label">
							<input type="radio" bind:group={formData.direction} value="give" />
							<span class="radio-text">💸 I owe them</span>
						</label>
						<label class="radio-label">
							<input type="radio" bind:group={formData.direction} value="receive" />
							<span class="radio-text">💰 They owe me</span>
						</label>
					</div>
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
						placeholder="e.g., Dinner bill split"
						maxlength="200"
					/>
				</div>
			</div>

			<button type="submit" class="submit-btn" disabled={isSubmitting}>
				{isSubmitting ? '⏳ Adding...' : '+ Add Debt'}
			</button>
		</form>
	</div>

	<!-- Unsettled Debts - Two Columns -->
	<div class="debts-grid">
		<!-- You Owe Column -->
		<div class="debts-column">
			<h2 class="column-title danger">💸 You Owe ({debtsYouOwe.length})</h2>
			{#if debtsYouOwe.length > 0}
				<div class="debts-list">
					{#each debtsYouOwe as debt (debt.id)}
						<div class="debt-item danger">
							<div class="debt-header">
								<div class="debt-person">{debt.person}</div>
								<div class="debt-amount">{formatCurrency(debt.amount)}</div>
							</div>
							{#if debt.note}
								<div class="debt-note">{debt.note}</div>
							{/if}
							<div class="debt-footer">
								<span class="debt-date">{formatDate(debt.date)}</span>
								<button class="settle-btn" onclick={() => openSettlementModal(debt)}>
									✓ Settle
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state-small">
					<p>No debts you owe</p>
				</div>
			{/if}
		</div>

		<!-- Owed to You Column -->
		<div class="debts-column">
			<h2 class="column-title success">💰 Owed to You ({debtsOwedToYou.length})</h2>
			{#if debtsOwedToYou.length > 0}
				<div class="debts-list">
					{#each debtsOwedToYou as debt (debt.id)}
						<div class="debt-item success">
							<div class="debt-header">
								<div class="debt-person">{debt.person}</div>
								<div class="debt-amount">{formatCurrency(debt.amount)}</div>
							</div>
							{#if debt.note}
								<div class="debt-note">{debt.note}</div>
							{/if}
							<div class="debt-footer">
								<span class="debt-date">{formatDate(debt.date)}</span>
								<button class="settle-btn" onclick={() => openSettlementModal(debt)}>
									✓ Settle
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state-small">
					<p>No debts owed to you</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Settled Debts Section -->
	{#if settledDebts.length > 0}
		<div class="settled-section">
			<button class="toggle-settled-btn" onclick={() => (showSettled = !showSettled)}>
				{showSettled ? '▼' : '▶'} Settled Debts ({settledDebts.length})
			</button>

			{#if showSettled}
				<div class="settled-list">
					{#each settledDebts as debt (debt.id)}
						<div class="settled-item">
							<div class="settled-header">
								<span class="settled-person">{debt.person}</span>
								<span class="settled-amount">{formatCurrency(debt.amount)}</span>
							</div>
							<div class="settled-meta">
								<span class="settled-direction"
									>{debt.direction === 'give' ? '💸 You owed' : '💰 They owed you'}</span
								>
								<span class="settled-date">Settled: {formatDate(debt.settledDate || '')}</span>
								{#if debt.linkedTransactionId}
									<span class="settled-link">🔗 Linked to transaction</span>
								{/if}
							</div>
							{#if debt.note}
								<div class="settled-note">{debt.note}</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Settlement Modal -->
	{#if settlementModal.open && settlementModal.debt}
		<div class="modal-overlay" onclick={closeSettlementModal}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				{#if settlementModal.step === 'options'}
					<h2 class="modal-title">Settle Debt</h2>
					<div class="modal-debt-info">
						<div class="modal-debt-person">{settlementModal.debt.person}</div>
						<div class="modal-debt-amount">{formatCurrency(settlementModal.debt.amount)}</div>
						<div class="modal-debt-direction">
							{settlementModal.debt.direction === 'give' ? '💸 You owe them' : '💰 They owe you'}
						</div>
					</div>

					<div class="modal-question">
						Did you {settlementModal.debt.direction === 'give' ? 'pay' : 'receive'} this from a tracked
						wallet?
					</div>

					<div class="modal-options">
						{#each $wallets as wallet}
							<button class="modal-option-btn" onclick={() => selectWalletOption(wallet.id)}>
								<span class="option-icon">{wallet.name === 'UPI' ? '📱' : '💵'}</span>
								<span class="option-text">
									Yes - {wallet.name} wallet
									<span class="option-balance">({formatCurrency(wallet.balance)})</span>
								</span>
							</button>
						{/each}

						<button class="modal-option-btn" onclick={() => selectWalletOption(null)}>
							<span class="option-icon">🚫</span>
							<span class="option-text">No - Settled outside app</span>
						</button>
					</div>

					<button class="modal-cancel-btn" onclick={closeSettlementModal}>Cancel</button>
				{:else if settlementModal.step === 'confirm'}
					<h2 class="modal-title">Confirm Settlement</h2>
					<div class="modal-confirm-info">
						<p>
							{#if settlementModal.walletId}
								This will create an expense of <strong
									>{formatCurrency(settlementModal.debt.amount)}</strong
								>
								from your <strong>{selectedWallet?.name}</strong> wallet.
							{:else}
								This will mark the debt as settled without affecting your wallet balances.
							{/if}
						</p>

						{#if settlementModal.walletId && selectedWallet}
							<div class="balance-preview">
								<div class="balance-row">
									<span>{selectedWallet.name} Balance:</span>
									<span>
										{formatCurrency(selectedWallet.balance)} →
										{formatCurrency(balanceAfterSettlement)}
										<span class="change negative"
											>(-{formatCurrency(settlementModal.debt.amount)})</span
										>
									</span>
								</div>
							</div>
						{/if}
					</div>

					<div class="modal-actions">
						<button class="modal-confirm-btn" onclick={confirmSettlement}>
							✓ Confirm Settlement
						</button>
						<button class="modal-back-btn" onclick={() => (settlementModal.step = 'options')}>
							← Back
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.debts-page {
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

	/* Overview Card */
	.overview-card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: var(--shadow-md);
	}

	.overview-totals {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.overview-stat {
		text-align: center;
		padding: 1.25rem;
		border-radius: var(--border-radius);
		background: var(--bg-secondary);
		border: 2px solid transparent;
	}

	.overview-stat.danger {
		border-color: var(--danger);
	}

	.overview-stat.success {
		border-color: var(--success);
	}

	.overview-label {
		display: block;
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.overview-amount {
		display: block;
		font-size: 2rem;
		font-weight: 700;
	}

	.overview-stat.danger .overview-amount {
		color: var(--danger);
	}

	.overview-stat.success .overview-amount {
		color: var(--success);
	}

	.net-position {
		text-align: center;
		padding: 1rem;
		border-radius: var(--border-radius);
		border: 2px solid var(--border-color);
		font-size: 1.125rem;
	}

	.net-position.positive {
		background: rgba(74, 222, 128, 0.1);
		border-color: var(--success);
	}

	.net-position.negative {
		background: rgba(248, 113, 113, 0.1);
		border-color: var(--danger);
	}

	.net-label {
		color: var(--text-secondary);
		margin-right: 0.5rem;
	}

	.net-amount {
		font-weight: 700;
	}

	.net-position.positive .net-amount {
		color: var(--success);
	}

	.net-position.negative .net-amount {
		color: var(--danger);
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

	input.error {
		border-color: var(--danger);
	}

	.error-message {
		font-size: 0.75rem;
		color: var(--danger);
	}

	.radio-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.radio-label:hover {
		background: var(--bg-hover);
		border-color: var(--accent-secondary);
	}

	.radio-label input[type='radio'] {
		cursor: pointer;
		width: auto;
		padding: 0;
	}

	.radio-text {
		font-size: 1rem;
		color: var(--text-primary);
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

	/* Debts Grid */
	.debts-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.debts-column {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
	}

	.column-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.column-title.danger {
		color: var(--danger);
	}

	.column-title.success {
		color: var(--success);
	}

	.debts-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.debt-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-left: 4px solid;
		border-radius: var(--border-radius);
		padding: 1rem;
		transition: all 0.2s;
	}

	.debt-item.danger {
		border-left-color: var(--danger);
	}

	.debt-item.success {
		border-left-color: var(--success);
	}

	.debt-item:hover {
		background: var(--bg-hover);
		box-shadow: var(--shadow-sm);
	}

	.debt-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.debt-person {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1.125rem;
	}

	.debt-amount {
		font-weight: 700;
		font-size: 1.25rem;
	}

	.debt-item.danger .debt-amount {
		color: var(--danger);
	}

	.debt-item.success .debt-amount {
		color: var(--success);
	}

	.debt-note {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
		margin-bottom: 0.5rem;
	}

	.debt-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.debt-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.settle-btn {
		background: var(--success);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: var(--border-radius);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.settle-btn:hover {
		background: #10b981;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);
	}

	.empty-state-small {
		text-align: center;
		padding: 2rem 1rem;
		color: var(--text-secondary);
	}

	/* Settled Section */
	.settled-section {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		margin-top: 2rem;
	}

	.toggle-settled-btn {
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 1rem;
		border-radius: var(--border-radius);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.toggle-settled-btn:hover {
		background: var(--bg-hover);
		border-color: var(--accent-secondary);
	}

	.settled-list {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.settled-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1rem;
		opacity: 0.7;
	}

	.settled-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.settled-person {
		font-weight: 600;
		color: var(--text-secondary);
	}

	.settled-amount {
		font-weight: 600;
		color: var(--text-secondary);
	}

	.settled-meta {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.settled-link {
		color: var(--accent-primary);
	}

	.settled-note {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
		margin-top: 0.5rem;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.modal {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		box-shadow: var(--shadow-lg);
	}

	.modal-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.modal-debt-info {
		text-align: center;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border-radius: var(--border-radius);
		margin-bottom: 1.5rem;
	}

	.modal-debt-person {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.modal-debt-amount {
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent-primary);
		margin-bottom: 0.5rem;
	}

	.modal-debt-direction {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.modal-question {
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 1rem;
		text-align: center;
	}

	.modal-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.modal-option-btn {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 1rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.2s;
		text-align: left;
	}

	.modal-option-btn:hover {
		background: var(--bg-hover);
		border-color: var(--accent-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

	.option-icon {
		font-size: 1.5rem;
	}

	.option-text {
		flex: 1;
		font-weight: 500;
	}

	.option-balance {
		color: var(--text-secondary);
		font-weight: 400;
	}

	.modal-cancel-btn {
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.75rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.modal-cancel-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.modal-confirm-info {
		padding: 1.5rem;
		background: var(--bg-secondary);
		border-radius: var(--border-radius);
		margin-bottom: 1.5rem;
	}

	.modal-confirm-info p {
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.balance-preview {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.balance-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.change {
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.change.negative {
		color: var(--danger);
	}

	.modal-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-confirm-btn {
		background: var(--success);
		color: white;
		border: none;
		padding: 1rem;
		border-radius: var(--border-radius);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.modal-confirm-btn:hover {
		background: #10b981;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
	}

	.modal-back-btn {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.75rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.modal-back-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.overview-totals {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.debts-grid {
			grid-template-columns: 1fr;
		}

		.modal {
			padding: 1.5rem;
		}
	}
</style>
