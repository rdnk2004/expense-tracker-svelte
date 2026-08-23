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
	import * as db from '$lib/db';
	import {
		Handshake,
		ArrowUpRight,
		ArrowDownLeft,
		TrendingUp,
		TrendingDown,
		Check,
		X,
		Banknote,
		Smartphone,
		Loader2,
		Ban,
		Plus,
		ChevronDown,
		ChevronRight,
		Users,
		Share2,
		QrCode,
		Send
	} from 'lucide-svelte';
	import BillSplitModal from '$lib/components/BillSplitModal.svelte';

	// Form state
	let formData = $state({
		person: '',
		amount: '',
		direction: 'receive' as 'give' | 'receive',
		upiId: '',
		date: formatDateInput(new Date().toISOString()),
		note: ''
	});
	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);
	let showSplitModal = $state(false);

	// Modal state
	let settlementModal = $state<{
		open: boolean;
		debt: Debt | null;
		step: 'options' | 'confirm';
		walletId: string | null;
		settleAmount: string;
	}>({
		open: false,
		debt: null,
		step: 'options',
		walletId: null,
		settleAmount: ''
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

	let settleAmountValue = $derived(
		settlementModal.settleAmount ? Math.round(parseFloat(settlementModal.settleAmount) * 100) : 0
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
				note: formData.note || null,
				upiId: formData.upiId.trim() || undefined
			});

			formData = {
				person: '',
				amount: '',
				direction: 'receive',
				upiId: '',
				date: formatDateInput(new Date().toISOString()),
				note: ''
			};

			showSuccessToast('Debt recorded successfully!');
		} catch (error) {
			console.error('Failed to add debt:', error);
			showSuccessToast('Failed to record debt');
		} finally {
			isSubmitting = false;
		}
	}

	function openSettlementModal(debt: Debt) {
		settlementModal = {
			open: true,
			debt,
			step: 'options',
			walletId: null,
			settleAmount: (debt.amount / 100).toFixed(2)
		};
	}

	async function handleSettleWithWallet() {
		if (!settlementModal.debt || !settlementModal.walletId) return;

		try {
			await settleDebt(
				settlementModal.debt.id,
				settleAmountValue,
				settlementModal.walletId
			);
			settlementModal.open = false;
			showSuccessToast('Debt settled & wallet adjusted!');
		} catch (error) {
			console.error('Failed to settle debt:', error);
			showSuccessToast('Failed to settle debt');
		}
	}

	async function handleSettleWithoutWallet() {
		if (!settlementModal.debt) return;

		try {
			await settleDebt(settlementModal.debt.id, settlementModal.debt.amount);
			settlementModal.open = false;
			showSuccessToast('Marked as settled!');
		} catch (error) {
			console.error('Failed to settle debt:', error);
			showSuccessToast('Failed to settle debt');
		}
	}

	function generateUPILink(debt: Debt): string {
		const pa = debt.upiId || '';
		const pn = encodeURIComponent(debt.person);
		const am = (debt.amount / 100).toFixed(2);
		const tn = encodeURIComponent(debt.note || 'Campus Tab Settlement');
		return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
	}

	function shareReminder(debt: Debt) {
		const amount = formatCurrency(debt.amount);
		const note = debt.note ? ` for "${debt.note}"` : '';
		const text = `Hey ${debt.person}, friendly reminder for ₹${debt.amount / 100}${note}. You can GPay/PhonePe to settle!`;

		if (navigator.share) {
			navigator.share({ title: 'Campus Split Reminder', text }).catch(() => {});
		} else {
			navigator.clipboard.writeText(text);
			showSuccessToast('Reminder copied to clipboard!');
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
	{#if showToast}
		<div class="toast">{toastMessage}</div>
	{/if}

	<div class="page-header">
		<div>
			<span class="eyebrow">Social Ledgers</span>
			<h1 class="page-title">Campus Debts & Splits</h1>
		</div>
		<button class="split-bill-hero-btn" onclick={() => (showSplitModal = true)}>
			<Users size={17} />
			<span>Split Bill</span>
		</button>
	</div>

	<!-- Net Squad Balance Hero Card -->
	<div class="net-position-card" class:positive={netPosition > 0} class:negative={netPosition < 0}>
		<div class="net-header">
			<span class="net-title">Net Friend Position</span>
			<span class="net-badge">
				{netPosition >= 0 ? 'Net Receivable' : 'Net Owed'}
			</span>
		</div>
		<div class="net-amount">
			{formatCurrency(Math.abs(netPosition))}
		</div>

		<div class="position-split-row">
			<div class="pos-item">
				<div class="pos-label">
					<ArrowDownLeft size={14} class="text-success" /> Friends Owe You
				</div>
				<div class="pos-val text-success">{formatCurrency(totalOwedToYou)}</div>
			</div>
			<div class="pos-item">
				<div class="pos-label">
					<ArrowUpRight size={14} class="text-danger" /> You Owe Friends
				</div>
				<div class="pos-val text-danger">{formatCurrency(totalYouOwe)}</div>
			</div>
		</div>
	</div>

	<!-- Quick Record Single Debt Form -->
	<div class="card add-debt-card">
		<h2 class="card-title">
			<Plus size={18} class="text-accent" /> Quick Record Tab / IOU
		</h2>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-row">
				<div class="input-group flex-2">
					<label for="debt-person">Friend's Name *</label>
					<input id="debt-person" type="text" placeholder="e.g. Rohan, Priya" bind:value={formData.person} />
					{#if errors.person}<span class="error-msg">{errors.person}</span>{/if}
				</div>
				<div class="input-group flex-1">
					<label for="debt-amount">Amount (₹) *</label>
					<input id="debt-amount" type="number" placeholder="250" bind:value={formData.amount} step="1" min="0" />
					{#if errors.amount}<span class="error-msg">{errors.amount}</span>{/if}
				</div>
			</div>

			<div class="direction-toggle-row">
				<button
					type="button"
					class="dir-btn receive"
					class:selected={formData.direction === 'receive'}
					onclick={() => (formData.direction = 'receive')}
				>
					<ArrowDownLeft size={15} />
					<span>They Owe Me (+₹)</span>
				</button>
				<button
					type="button"
					class="dir-btn give"
					class:selected={formData.direction === 'give'}
					onclick={() => (formData.direction = 'give')}
				>
					<ArrowUpRight size={15} />
					<span>I Owe Them (-₹)</span>
				</button>
			</div>

			<div class="form-row">
				<div class="input-group flex-1">
					<label for="debt-upi">UPI ID (Optional for 1-click Pay)</label>
					<input id="debt-upi" type="text" placeholder="e.g. rahul@okaxis" bind:value={formData.upiId} />
				</div>
				<div class="input-group flex-1">
					<label for="debt-note">Description / Context</label>
					<input id="debt-note" type="text" placeholder="e.g. Canteen lunch split" bind:value={formData.note} />
				</div>
			</div>

			<button type="submit" class="submit-btn" disabled={isSubmitting}>
				{isSubmitting ? 'Recording...' : 'Record Debt'}
			</button>
		</form>
	</div>

	<!-- Active Debts Ledger List -->
	<div class="debts-list-section">
		<div class="section-title-row">
			<h2 class="section-title">Active Tabs ({unsettledDebts.length})</h2>
			<button class="toggle-settled-btn" onclick={() => (showSettled = !showSettled)}>
				{showSettled ? 'Hide Settled' : `View Settled (${settledDebts.length})`}
			</button>
		</div>

		<div class="debt-cards-stack">
			{#each unsettledDebts as debt (debt.id)}
				<div class="debt-card-item" class:is-receivable={debt.direction === 'receive'}>
					<div class="debt-card-top">
						<div class="debt-person-info">
							<div class="debt-avatar" class:recv={debt.direction === 'receive'}>
								{debt.person.charAt(0).toUpperCase()}
							</div>
							<div>
								<div class="debt-person-name">{debt.person}</div>
								<div class="debt-meta-date">
									{debt.direction === 'receive' ? 'Owes you' : 'You owe'} • {formatDate(debt.date)}
								</div>
								{#if debt.note}
									<div class="debt-note-text">"{debt.note}"</div>
								{/if}
							</div>
						</div>

						<div class="debt-amount-col">
							<div class="debt-amount-val" class:text-success={debt.direction === 'receive'} class:text-danger={debt.direction === 'give'}>
								{debt.direction === 'receive' ? '+' : '-'}{formatCurrency(debt.amount)}
							</div>
						</div>
					</div>

					<div class="debt-actions-row">
						{#if debt.direction === 'receive'}
							<button class="action-btn remind" onclick={() => shareReminder(debt)}>
								<Share2 size={13} />
								<span>Remind</span>
							</button>
						{:else if debt.upiId}
							<a href={generateUPILink(debt)} class="action-btn upi-pay">
								<Send size={13} />
								<span>Pay via UPI</span>
							</a>
						{/if}

						<button class="action-btn settle" onclick={() => openSettlementModal(debt)}>
							<Check size={13} />
							<span>Settle Tab</span>
						</button>
					</div>
				</div>
			{:else}
				<div class="empty-debts-card">
					<Handshake size={32} class="empty-icon" />
					<p>All clean! Zero unsettled tabs with friends.</p>
				</div>
			{/each}

			{#if showSettled && settledDebts.length > 0}
				<div class="settled-divider">
					<span>Settled History</span>
				</div>
				{#each settledDebts as debt (debt.id)}
					<div class="debt-card-item settled">
						<div class="debt-card-top">
							<div class="debt-person-info">
								<div class="debt-avatar settled-av">✓</div>
								<div>
									<div class="debt-person-name settled-txt">{debt.person}</div>
									<div class="debt-meta-date">Settled on {debt.settledDate ? formatDate(debt.settledDate) : 'Done'}</div>
								</div>
							</div>
							<div class="debt-amount-val settled-txt">{formatCurrency(debt.amount)}</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<!-- Settlement Modal -->
{#if settlementModal.open && settlementModal.debt}
	<div class="modal-backdrop" onclick={() => (settlementModal.open = false)} role="button" tabindex="0">
		<div class="modal-sheet" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			<div class="modal-header">
				<h3 class="modal-title">Settle Tab with {settlementModal.debt.person}</h3>
				<button class="close-btn" onclick={() => (settlementModal.open = false)}>✕</button>
			</div>

			<p class="modal-sub">
				Total Tab Amount: <strong>{formatCurrency(settlementModal.debt.amount)}</strong>
			</p>

			<div class="settle-options-stack">
				<div class="option-card">
					<h4>Option 1: Settle & Adjust Wallet Balance</h4>
					<p class="opt-desc">Automatically update your UPI or Cash balance with this settlement.</p>
					
					<div class="wallet-picker-row">
						<select bind:value={settlementModal.walletId}>
							<option value={null}>Select Wallet...</option>
							{#each $wallets as w}
								<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
							{/each}
						</select>
						<button
							class="primary-btn mini"
							disabled={!settlementModal.walletId}
							onclick={handleSettleWithWallet}
						>
							Confirm & Sync
						</button>
					</div>
				</div>

				<div class="option-card">
					<h4>Option 2: Mark as Settled Only</h4>
					<p class="opt-desc">Record debt as paid without changing your wallet balances.</p>
					<button class="secondary-btn" onclick={handleSettleWithoutWallet}>
						Mark Settled Directly
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Bill Split Modal -->
<BillSplitModal
	bind:open={showSplitModal}
	onSuccess={() => showSuccessToast('Group bill split & receivables recorded!')}
/>

<style>
	.debts-page {
		max-width: 620px;
		margin: 0 auto;
		padding: 0 16px 120px 16px;
		animation: fadeIn 0.4s ease-out;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 20px;
		padding-top: 8px;
	}

	.eyebrow {
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--accent-primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		display: block;
		margin-bottom: 2px;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.5px;
	}

	.split-bill-hero-btn {
		background: var(--accent-gradient);
		color: white;
		border: none;
		padding: 9px 16px;
		border-radius: 9999px;
		font-weight: 700;
		font-size: 0.82rem;
		display: flex;
		align-items: center;
		gap: 6px;
		box-shadow: 0 4px 15px var(--accent-glow);
		cursor: pointer;
	}

	/* Net Position Hero */
	.net-position-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 26px;
		padding: 22px;
		margin-bottom: 20px;
		box-shadow: var(--shadow-sm);
	}

	.net-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.net-title {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.net-badge {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 3px 10px;
		border-radius: 9999px;
		background: rgba(124, 58, 237, 0.1);
		color: var(--accent-primary);
	}

	.net-amount {
		font-size: 2.2rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.5px;
		margin-bottom: 16px;
	}

	.position-split-row {
		display: flex;
		gap: 16px;
		border-top: 1px solid var(--border-color);
		padding-top: 14px;
	}

	.pos-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.pos-label {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.76rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.pos-val {
		font-size: 1.05rem;
		font-weight: 800;
	}

	/* Form */
	.add-debt-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 24px;
		padding: 20px;
		margin-bottom: 24px;
		box-shadow: var(--shadow-sm);
	}

	.card-title {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 16px;
	}

	.form-row {
		display: flex;
		gap: 10px;
		margin-bottom: 12px;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.flex-2 { flex: 2; }
	.flex-1 { flex: 1; }

	label {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	input, select {
		padding: 10px 14px;
		border-radius: 14px;
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.88rem;
		font-weight: 600;
	}

	input:focus, select:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.direction-toggle-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 14px;
	}

	.dir-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px;
		border-radius: 14px;
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
		color: var(--text-muted);
		transition: all 0.2s;
	}

	.dir-btn.receive.selected {
		background: rgba(16, 185, 129, 0.12);
		border-color: #10B981;
		color: #059669;
	}

	.dir-btn.give.selected {
		background: rgba(255, 51, 102, 0.12);
		border-color: #FF3366;
		color: #FF3366;
	}

	.submit-btn {
		width: 100%;
		background: var(--accent-gradient);
		color: white;
		border: none;
		padding: 12px;
		border-radius: 16px;
		font-weight: 800;
		font-size: 0.92rem;
		cursor: pointer;
		margin-top: 6px;
	}

	.error-msg {
		color: var(--danger);
		font-size: 0.7rem;
	}

	/* Ledger List */
	.section-title-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.section-title {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.toggle-settled-btn {
		background: transparent;
		border: none;
		color: var(--accent-primary);
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
	}

	.debt-cards-stack {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.debt-card-item {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 20px;
		padding: 16px;
		box-shadow: var(--shadow-sm);
	}

	.debt-card-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}

	.debt-person-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.debt-avatar {
		width: 40px;
		height: 40px;
		border-radius: 14px;
		background: rgba(255, 51, 102, 0.12);
		color: #FF3366;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: 1.05rem;
	}

	.debt-avatar.recv {
		background: rgba(16, 185, 129, 0.12);
		color: #059669;
	}

	.debt-avatar.settled-av {
		background: var(--bg-primary);
		color: var(--text-muted);
	}

	.debt-person-name {
		font-weight: 800;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.debt-meta-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.debt-note-text {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-style: italic;
		margin-top: 2px;
	}

	.debt-amount-val {
		font-weight: 800;
		font-size: 1.05rem;
	}

	.debt-actions-row {
		display: flex;
		gap: 8px;
		border-top: 1px solid var(--border-color);
		padding-top: 10px;
		justify-content: flex-end;
	}

	.action-btn {
		padding: 6px 12px;
		border-radius: 10px;
		font-size: 0.74rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
		color: var(--text-primary);
		text-decoration: none;
	}

	.action-btn.settle {
		background: var(--accent-primary);
		color: white;
		border-color: var(--accent-primary);
	}

	.action-btn.upi-pay {
		background: #2563EB;
		color: white;
		border-color: #2563EB;
	}

	.empty-debts-card {
		text-align: center;
		padding: 40px 20px;
		background: var(--bg-card);
		border-radius: 20px;
		border: 1px dashed var(--border-color);
		color: var(--text-muted);
	}

	.settled-divider {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		margin: 10px 0;
	}

	.debt-card-item.settled {
		opacity: 0.6;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(5px);
		z-index: 1000;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.modal-sheet {
		background: var(--bg-card);
		border-radius: 28px 28px 0 0;
		padding: 24px;
		width: 100%;
		max-width: 600px;
		border: 1px solid var(--border-color);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.modal-title {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
	}

	.modal-sub {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-bottom: 18px;
	}

	.settle-options-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.option-card {
		background: var(--bg-primary);
		padding: 16px;
		border-radius: 18px;
		border: 1px solid var(--border-color);
	}

	.option-card h4 {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.opt-desc {
		font-size: 0.76rem;
		color: var(--text-muted);
		margin-bottom: 12px;
	}

	.wallet-picker-row {
		display: flex;
		gap: 8px;
	}

	.wallet-picker-row select {
		flex: 1;
	}

	.primary-btn.mini {
		padding: 8px 14px;
		font-size: 0.8rem;
		background: var(--accent-gradient);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 700;
		cursor: pointer;
	}

	.secondary-btn {
		width: 100%;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 10px;
		border-radius: 12px;
		font-weight: 700;
		cursor: pointer;
	}

	.toast {
		position: fixed;
		top: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--accent-primary);
		color: white;
		padding: 10px 20px;
		border-radius: 9999px;
		font-size: 0.85rem;
		font-weight: 700;
		box-shadow: var(--shadow-md);
		z-index: 1001;
	}
</style>
