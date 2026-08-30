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
		Check,
		X,
		Plus,
		Users,
		Share2,
		QrCode,
		Send
	} from 'lucide-svelte';
	import BillSplitModal from '$lib/components/BillSplitModal.svelte';

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

	let showSettled = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');

	let unsettledDebts = $derived($debts.filter((d) => !d.isSettled));
	let settledDebts = $derived($debts.filter((d) => d.isSettled));

	let debtsYouOwe = $derived(unsettledDebts.filter((d) => d.direction === 'give'));
	let debtsOwedToYou = $derived(unsettledDebts.filter((d) => d.direction === 'receive'));

	let totalYouOwe = $derived(debtsYouOwe.reduce((sum, d) => sum + d.amount, 0));
	let totalOwedToYou = $derived(debtsOwedToYou.reduce((sum, d) => sum + d.amount, 0));
	let netPosition = $derived(totalOwedToYou - totalYouOwe);

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

			showSuccessToast('Campus tab logged! 🤝');
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
			walletId: $wallets[0]?.id || null,
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
			showSuccessToast('Tab settled & wallet updated! ⚡');
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
			showSuccessToast('Marked as settled! 🎯');
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
		const text = `Hey ${debt.person}, friendly reminder for ₹${debt.amount / 100}${debt.note ? ` (${debt.note})` : ''}. Settle via UPI whenever free!`;

		if (typeof navigator !== 'undefined' && navigator.share) {
			navigator.share({ title: 'Campus Split Reminder', text }).catch(() => {});
		} else if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(text);
			showSuccessToast('Reminder copied to clipboard! 📋');
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
		<div class="toast-pill">{toastMessage}</div>
	{/if}

	<!-- Header -->
	<div class="page-header">
		<div>
			<span class="campus-sub">Social Ledgers</span>
			<h1 class="page-title">Campus Debts & Splits</h1>
		</div>
		<button class="split-bill-hero-btn" onclick={() => (showSplitModal = true)}>
			<Users size={16} />
			<span>Split Group Bill</span>
		</button>
	</div>

	<!-- Net Squad Balance Hero Card -->
	<div class="net-position-card" class:positive={netPosition >= 0} class:negative={netPosition < 0}>
		<div class="net-top-line">
			<span class="net-title-eyebrow">Net Friend Balance</span>
			<span class="net-status-pill">
				{netPosition >= 0 ? 'Net Receivable' : 'Net Owed'}
			</span>
		</div>

		<div class="net-amount-hero tabular">
			{formatCurrency(Math.abs(netPosition))}
		</div>

		<div class="position-stats-grid">
			<div class="pos-stat-box">
				<div class="pos-lbl">
					<ArrowDownLeft size={13} color="#10B981" />
					<span>Friends Owe You</span>
				</div>
				<div class="pos-val text-success tabular">{formatCurrency(totalOwedToYou)}</div>
			</div>
			<div class="pos-stat-box">
				<div class="pos-lbl">
					<ArrowUpRight size={13} color="#F43F5E" />
					<span>You Owe Friends</span>
				</div>
				<div class="pos-val text-danger tabular">{formatCurrency(totalYouOwe)}</div>
			</div>
		</div>
	</div>

	<!-- Quick Record Single Tab Form -->
	<div class="card quick-tab-card">
		<h3 class="card-heading">Quick Record Single Tab / IOU</h3>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="direction-toggle-row">
				<button
					type="button"
					class="dir-toggle-btn"
					class:active={formData.direction === 'receive'}
					onclick={() => (formData.direction = 'receive')}
				>
					<ArrowDownLeft size={14} />
					<span>They Owe Me</span>
				</button>
				<button
					type="button"
					class="dir-toggle-btn"
					class:active={formData.direction === 'give'}
					onclick={() => (formData.direction = 'give')}
				>
					<ArrowUpRight size={14} />
					<span>I Owe Them</span>
				</button>
			</div>

			<div class="form-inputs-grid">
				<div class="form-field-col">
					<label for="debt-person">Friend's Name *</label>
					<input id="debt-person" type="text" placeholder="e.g. Aryan, Sneha..." bind:value={formData.person} />
					{#if errors.person}
						<span class="err-txt">{errors.person}</span>
					{/if}
				</div>

				<div class="form-field-col">
					<label for="debt-amt">Amount (₹) *</label>
					<input id="debt-amt" type="number" step="0.01" placeholder="0.00" bind:value={formData.amount} class="tabular" />
					{#if errors.amount}
						<span class="err-txt">{errors.amount}</span>
					{/if}
				</div>
			</div>

			<div class="form-inputs-grid">
				<div class="form-field-col">
					<label for="debt-upi">Friend's UPI ID (optional)</label>
					<input id="debt-upi" type="text" placeholder="username@okhdfcbank" bind:value={formData.upiId} />
				</div>

				<div class="form-field-col">
					<label for="debt-note">Note / Event</label>
					<input id="debt-note" type="text" placeholder="Chai, Canteen, Movie..." bind:value={formData.note} />
				</div>
			</div>

			<button type="submit" class="primary-btn-full" disabled={isSubmitting}>
				{isSubmitting ? 'Recording...' : 'Log Campus Tab'}
			</button>
		</form>
	</div>

	<!-- Unsettled Debts Ledger -->
	<div class="card debts-ledger-card">
		<div class="ledger-header">
			<h3 class="card-heading">Active Tabs ({unsettledDebts.length})</h3>
			<button class="toggle-settled-link" onclick={() => (showSettled = !showSettled)}>
				{showSettled ? 'Hide Settled' : `Show Settled (${settledDebts.length})`}
			</button>
		</div>

		<div class="debts-list">
			{#each unsettledDebts as debt (debt.id)}
				<div class="debt-row-card" class:receive-border={debt.direction === 'receive'} class:give-border={debt.direction === 'give'}>
					<div class="debt-info-left">
						<div class="friend-avatar" class:receive-av={debt.direction === 'receive'} class:give-av={debt.direction === 'give'}>
							{debt.person.slice(0, 2).toUpperCase()}
						</div>
						<div class="debt-text-col">
							<div class="debt-person-line">
								<strong class="person-name">{debt.person}</strong>
								<span class="direction-tag" class:tag-receive={debt.direction === 'receive'} class:tag-give={debt.direction === 'give'}>
									{debt.direction === 'receive' ? 'Owes you' : 'You owe'}
								</span>
							</div>
							<div class="debt-meta-line">
								<span>{debt.note || 'Campus Tab'}</span>
								<span>•</span>
								<span>{formatDate(debt.date)}</span>
								{#if debt.upiId}
									<span>•</span>
									<span class="upi-chip">{debt.upiId}</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="debt-action-right">
						<div class="debt-amount-figure tabular" class:text-success={debt.direction === 'receive'} class:text-danger={debt.direction === 'give'}>
							{debt.direction === 'receive' ? '+' : '-'}{formatCurrency(debt.amount)}
						</div>

						<div class="debt-btns-row">
							{#if debt.direction === 'receive'}
								<button class="icon-action-btn" title="Send WhatsApp/Share Reminder" onclick={() => shareReminder(debt)} aria-label="Share Reminder">
									<Send size={13} />
								</button>
							{/if}
							{#if debt.direction === 'give' && debt.upiId}
								<a href={generateUPILink(debt)} class="icon-action-btn upi-pay-btn" title="Pay with UPI App" aria-label="Pay with UPI">
									<QrCode size={13} />
								</a>
							{/if}
							<button class="settle-pill-btn" onclick={() => openSettlementModal(debt)}>
								<Check size={12} />
								<span>Settle</span>
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="empty-debts-box">
					<Handshake size={32} color="var(--text-muted)" />
					<p>All clean! Zero unsettled tabs with campus friends.</p>
				</div>
			{/each}

			{#if showSettled && settledDebts.length > 0}
				<div class="settled-archive-divider">
					<span>Settled Archive</span>
				</div>
				{#each settledDebts as debt (debt.id)}
					<div class="debt-row-card settled-card">
						<div class="debt-info-left">
							<div class="friend-avatar settled-av">✓</div>
							<div class="debt-text-col">
								<strong class="person-name settled-txt">{debt.person}</strong>
								<span class="debt-meta-line settled-txt">Settled on {debt.settledDate ? formatDate(debt.settledDate) : 'Completed'}</span>
							</div>
						</div>
						<div class="debt-amount-figure tabular settled-txt">
							{formatCurrency(debt.amount)}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<!-- Settlement Modal Sheet -->
{#if settlementModal.open && settlementModal.debt}
	<div
		class="modal-backdrop"
		onclick={() => (settlementModal.open = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (settlementModal.open = false)}
	>
		<div
			class="modal-sheet"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="sheet-top-row">
				<h3>Settle Tab with {settlementModal.debt.person}</h3>
				<button class="close-btn" onclick={() => (settlementModal.open = false)}>✕</button>
			</div>

			<p class="sheet-sub">
				Total Tab Amount: <strong class="tabular">{formatCurrency(settlementModal.debt.amount)}</strong>
			</p>

			<div class="settlement-options-stack">
				<div class="settle-choice-card">
					<h4>Option 1: Settle & Sync Wallet Balance</h4>
					<p class="choice-desc">Automatically update your real UPI or Cash balance with this settlement.</p>
					<div class="choice-input-row">
						<select bind:value={settlementModal.walletId} class="wallet-select">
							{#each $wallets as w}
								<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
							{/each}
						</select>
						<button class="primary-btn-mini" onclick={handleSettleWithWallet}>
							Sync & Settle
						</button>
					</div>
				</div>

				<div class="settle-choice-card">
					<h4>Option 2: Mark Settled Directly</h4>
					<p class="choice-desc">Record tab as settled without changing wallet balances.</p>
					<button class="secondary-btn-full" onclick={handleSettleWithoutWallet}>
						Mark Settled Directly
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<BillSplitModal
	bind:open={showSplitModal}
	onSuccess={() => showSuccessToast('Group bill split & tabs created! 🎉')}
/>

<style>
	.debts-page {
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
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
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
		font-size: 1.65rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.04em;
		margin: 0;
	}

	.split-bill-hero-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--accent-primary);
		color: #080C14;
		padding: 0.55rem 1rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.82rem;
		font-weight: 700;
		box-shadow: 0 4px 14px var(--accent-glow);
		transition: all 0.2s ease;
	}

	.split-bill-hero-btn:hover {
		filter: brightness(1.1);
	}

	/* Net Position Card */
	.net-position-card {
		border-radius: 24px;
		padding: 1.35rem;
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--border-color);
		background: var(--bg-card);
	}

	.net-position-card.positive {
		border-top: 3px solid #10B981;
	}

	.net-position-card.negative {
		border-top: 3px solid #F43F5E;
	}

	.net-top-line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.35rem;
	}

	.net-title-eyebrow {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.net-status-pill {
		font-size: 0.68rem;
		font-weight: 800;
		padding: 0.2rem 0.55rem;
		border-radius: var(--border-radius-pill);
		text-transform: uppercase;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
	}

	.net-amount-hero {
		font-size: 2.15rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		line-height: 1.1;
	}

	.position-stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		border-top: 1px solid var(--border-subtle);
		padding-top: 0.85rem;
	}

	.pos-stat-box {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.pos-lbl {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.pos-val {
		font-size: 1.15rem;
		font-weight: 800;
	}

	.text-success { color: #10B981; }
	.text-danger { color: #F43F5E; }

	/* Quick Tab Card */
	.quick-tab-card {
		padding: 1.35rem;
	}

	.card-heading {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.direction-toggle-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		margin-bottom: 1rem;
	}

	.dir-toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 0.65rem;
		border-radius: var(--border-radius);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: 0.82rem;
		font-weight: 700;
		transition: all 0.2s ease;
	}

	.dir-toggle-btn.active {
		background: var(--bg-card);
		border-color: var(--accent-primary);
		color: var(--text-primary);
		box-shadow: var(--shadow-xs);
	}

	.form-inputs-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 0.85rem;
	}

	.form-field-col {
		display: flex;
		flex-direction: column;
	}

	.err-txt {
		font-size: 0.72rem;
		color: var(--danger);
		font-weight: 600;
		margin-top: 2px;
	}

	.primary-btn-full {
		width: 100%;
		background: var(--accent-primary);
		color: #FFFFFF;
		font-weight: 800;
		font-size: 0.95rem;
		padding: 0.85rem;
		border-radius: var(--border-radius-pill);
		box-shadow: 0 4px 14px var(--accent-glow);
		min-height: 48px;
	}

	/* Active Tabs Ledger */
	.debts-ledger-card {
		padding: 1.15rem;
	}

	.ledger-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.toggle-settled-link {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--accent-primary);
	}

	.debts-list {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.debt-row-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.85rem 1rem;
		border-radius: var(--border-radius);
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		gap: 8px;
		flex-wrap: wrap;
	}

	.receive-border { border-left: 4px solid #10B981; }
	.give-border { border-left: 4px solid #F43F5E; }

	.debt-info-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.friend-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.82rem;
		font-weight: 800;
		flex-shrink: 0;
	}

	.receive-av { background: rgba(16, 185, 129, 0.18); color: #10B981; }
	.give-av { background: rgba(244, 63, 94, 0.18); color: #F43F5E; }
	.settled-av { background: var(--surface-3); color: var(--text-muted); }

	.debt-text-col {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.debt-person-line {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.person-name {
		font-size: 0.92rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.direction-tag {
		font-size: 0.68rem;
		font-weight: 800;
		padding: 1px 6px;
		border-radius: var(--border-radius-pill);
	}

	.tag-receive { background: rgba(16, 185, 129, 0.18); color: #10B981; }
	.tag-give { background: rgba(244, 63, 94, 0.18); color: #F43F5E; }

	.debt-meta-line {
		font-size: 0.76rem;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 2px;
		flex-wrap: wrap;
	}

	.upi-chip {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		padding: 1px 6px;
		border-radius: var(--border-radius-xs);
		font-size: 0.68rem;
		color: var(--text-secondary);
		font-weight: 600;
	}

	.debt-action-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.debt-amount-figure {
		font-size: 1.1rem;
		font-weight: 800;
	}

	.debt-btns-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.icon-action-btn {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
	}

	.icon-action-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.upi-pay-btn {
		color: var(--accent-primary);
		text-decoration: none;
	}

	.settle-pill-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: var(--accent-primary);
		color: #FFFFFF;
		font-size: 0.78rem;
		font-weight: 800;
		padding: 0.4rem 0.8rem;
		border-radius: var(--border-radius-pill);
		min-height: 34px;
	}

	.settled-card {
		opacity: 0.65;
		border-left: 3px solid var(--border-strong);
	}

	.settled-txt {
		color: var(--text-muted) !important;
	}

	.settled-archive-divider {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		text-align: center;
		margin: 0.5rem 0;
	}

	.empty-debts-box {
		text-align: center;
		padding: 2.5rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-muted);
		font-size: 0.88rem;
	}

	/* Settlement Modal */
	.sheet-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.sheet-top-row h3 {
		font-size: 1.15rem;
		font-weight: 800;
	}

	.sheet-sub {
		font-size: 0.88rem;
		color: var(--text-secondary);
		margin-bottom: 1.25rem;
	}

	.settlement-options-stack {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.settle-choice-card {
		background: var(--surface-2);
		border-radius: var(--border-radius);
		padding: 1rem;
		border: 1px solid var(--border-color);
	}

	.settle-choice-card h4 {
		font-size: 0.92rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 3px;
	}

	.choice-desc {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}

	.choice-input-row {
		display: flex;
		gap: 6px;
	}

	.wallet-select {
		flex: 1;
		min-height: 44px;
		padding: 0.4rem 0.75rem;
		font-size: 16px;
	}

	.primary-btn-mini {
		background: var(--accent-primary);
		color: #FFFFFF;
		font-weight: 800;
		padding: 0.4rem 0.95rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.82rem;
		white-space: nowrap;
	}

	.secondary-btn-full {
		width: 100%;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		font-size: 0.85rem;
		font-weight: 700;
		padding: 0.75rem;
		border-radius: var(--border-radius-pill);
		min-height: 44px;
	}

	@media (max-width: 520px) {
		.form-inputs-grid {
			grid-template-columns: 1fr;
		}

		.debt-row-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.debt-action-right {
			width: 100%;
			justify-content: space-between;
			border-top: 1px solid var(--border-subtle);
			padding-top: 0.5rem;
			margin-top: 0.25rem;
		}
	}
</style>
