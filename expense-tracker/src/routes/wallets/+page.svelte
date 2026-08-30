<script lang="ts">
	import {
		wallets,
		expenses,
		transfers,
		categories,
		formatCurrency,
		formatDate,
		formatDateInput,
		createTransfer,
		addExpense,
		createWallet,
		loadWallets
	} from '$lib/stores';
	import type { Expense, Transfer, Category, Wallet } from '$lib/types';
	import * as db from '$lib/db';
	import {
		Wallet as WalletIcon,
		Banknote,
		Smartphone,
		Settings,
		Plus,
		ArrowLeftRight,
		ArrowUpRight,
		ArrowDownLeft,
		Check,
		Edit3,
		Trash2,
		X
	} from 'lucide-svelte';

	let showTransferModal = $state(false);
	let showManualAdjustment = $state<string | null>(null);
	let showNewWalletModal = $state(false);

	let newWalletName = $state('');
	let newWalletBalance = $state('');

	let transferForm = $state({
		fromWalletId: '',
		toWalletId: '',
		amount: '',
		date: formatDateInput(new Date().toISOString()),
		note: ''
	});
	let transferErrors = $state<Record<string, string>>({});

	let manualAdjustmentForm = $state({
		newBalance: ''
	});

	let showToast = $state(false);
	let toastMessage = $state('');

	let fromWallet = $derived($wallets.find((w) => w.id === transferForm.fromWalletId));
	let toWallet = $derived($wallets.find((w) => w.id === transferForm.toWalletId));
	let transferAmountInPaise = $derived(
		transferForm.amount ? Math.round(parseFloat(transferForm.amount) * 100) : 0
	);
	let hasInsufficientTransferBalance = $derived(
		fromWallet ? transferAmountInPaise > fromWallet.balance : false
	);

	function getWalletStats(walletId: string) {
		const totalExpenses = $expenses
			.filter((e) => e.walletId === walletId)
			.reduce((sum, e) => sum + e.amount, 0);

		const transfersOut = $transfers
			.filter((t) => t.fromWalletId === walletId)
			.reduce((sum, t) => sum + t.amount, 0);

		const transfersIn = $transfers
			.filter((t) => t.toWalletId === walletId)
			.reduce((sum, t) => sum + t.amount, 0);

		const transactionCount =
			$expenses.filter((e) => e.walletId === walletId).length +
			$transfers.filter((t) => t.fromWalletId === walletId || t.toWalletId === walletId).length;

		return {
			totalExpenses,
			transfersOut,
			transfersIn,
			transactionCount
		};
	}

	function openTransferModalWithSource(walletId: string) {
		const destination = $wallets.find((w) => w.id !== walletId);
		transferForm = {
			fromWalletId: walletId,
			toWalletId: destination ? destination.id : '',
			amount: '',
			date: formatDateInput(new Date().toISOString()),
			note: ''
		};
		transferErrors = {};
		showTransferModal = true;
	}

	function openManualAdjustment(wallet: Wallet) {
		showManualAdjustment = wallet.id;
		manualAdjustmentForm.newBalance = (wallet.balance / 100).toString();
	}

	async function handleSaveAdjustment(walletId: string) {
		const newBalFloat = parseFloat(manualAdjustmentForm.newBalance);
		if (isNaN(newBalFloat) || newBalFloat < 0) {
			alert('Please enter a valid non-negative balance.');
			return;
		}

		const balanceInPaise = Math.round(newBalFloat * 100);
		await db.updateWalletBalance(walletId, balanceInPaise);
		await loadWallets();
		showManualAdjustment = null;
		showSuccessToast('Wallet balance calibrated! 🎯');
	}

	async function handleCreateWallet() {
		if (!newWalletName.trim()) {
			alert('Please enter a wallet name.');
			return;
		}
		const initialBalFloat = parseFloat(newWalletBalance) || 0;
		const balanceInPaise = Math.round(initialBalFloat * 100);

		await createWallet(newWalletName.trim(), balanceInPaise);
		newWalletName = '';
		newWalletBalance = '';
		showNewWalletModal = false;
		showSuccessToast('New wallet created! 💳');
	}

	async function handleTransferSubmit() {
		transferErrors = {};
		if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) {
			transferErrors.amount = 'Enter a valid amount';
			return;
		}
		if (!transferForm.fromWalletId || !transferForm.toWalletId) {
			transferErrors.toWalletId = 'Select source and destination';
			return;
		}
		if (hasInsufficientTransferBalance) {
			transferErrors.amount = 'Insufficient balance';
			return;
		}

		await createTransfer(
			transferForm.fromWalletId,
			transferForm.toWalletId,
			transferAmountInPaise,
			new Date(transferForm.date).toISOString(),
			transferForm.note.trim() || undefined
		);

		showTransferModal = false;
		showSuccessToast('Funds transferred! ⚡');
	}

	function showSuccessToast(msg: string) {
		toastMessage = msg;
		showToast = true;
		setTimeout(() => (showToast = false), 3000);
	}
</script>

<div class="wallets-page">
	{#if showToast}
		<div class="toast-pill">{toastMessage}</div>
	{/if}

	<div class="page-header">
		<div>
			<span class="campus-sub">Capital Management</span>
			<h1 class="page-title">Wallets & Virtual Cards</h1>
		</div>
		<button class="add-wallet-btn" onclick={() => (showNewWalletModal = true)}>
			<Plus size={16} />
			<span>Add Card</span>
		</button>
	</div>

	<!-- Virtual Cards Deck -->
	<div class="virtual-cards-deck">
		{#each $wallets as wallet, i}
			{@const stats = getWalletStats(wallet.id)}
			{@const isUPI = wallet.name.toLowerCase().includes('upi')}
			{@const isCash = wallet.name.toLowerCase().includes('cash')}

			<div class="virtual-card" class:card-upi={isUPI} class:card-cash={isCash} class:card-bank={!isUPI && !isCash}>
				<div class="card-glow-bg"></div>

				<div class="card-top-line">
					<div class="card-chip-wrap">
						<div class="card-chip"></div>
						<span class="card-brand-name">{wallet.name}</span>
					</div>
					<div class="card-top-actions">
						<button
							class="card-action-icon"
							title="Calibrate Balance"
							onclick={() => openManualAdjustment(wallet)}
							aria-label="Calibrate Balance"
						>
							<Edit3 size={15} />
						</button>
					</div>
				</div>

				<div class="card-body-balance">
					<span class="balance-sub">Liquid Balance</span>
					<div class="card-balance-val tabular">{formatCurrency(wallet.balance)}</div>
				</div>

				<div class="card-footer-stats">
					<div class="card-stat-col">
						<span class="c-stat-lbl">Outflow</span>
						<span class="c-stat-val tabular">{formatCurrency(stats.totalExpenses)}</span>
					</div>
					<div class="card-stat-col">
						<span class="c-stat-lbl">Transfers In</span>
						<span class="c-stat-val tabular">+{formatCurrency(stats.transfersIn)}</span>
					</div>
					<div class="card-footer-cta">
						<button
							class="card-transfer-pill"
							onclick={() => openTransferModalWithSource(wallet.id)}
						>
							<ArrowLeftRight size={13} />
							<span>Transfer</span>
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Manual Adjustment Calibration Sheet -->
{#if showManualAdjustment}
	<div
		class="modal-backdrop"
		onclick={() => (showManualAdjustment = null)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showManualAdjustment = null)}
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
				<h3>Calibrate Balance</h3>
				<button class="close-btn" onclick={() => (showManualAdjustment = null)}>✕</button>
			</div>

			<p class="sheet-desc">Sync this wallet to your real bank account or pocket cash count.</p>

			<div class="form-group-custom">
				<label for="calib-amt">Current Actual Balance (₹)</label>
				<input
					id="calib-amt"
					type="number"
					step="0.01"
					placeholder="0.00"
					bind:value={manualAdjustmentForm.newBalance}
					class="modal-input"
				/>
			</div>

			<div class="sheet-btn-row">
				<button class="primary-btn-full" onclick={() => handleSaveAdjustment(showManualAdjustment!)}>
					Save Calibration
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add New Wallet Sheet -->
{#if showNewWalletModal}
	<div
		class="modal-backdrop"
		onclick={() => (showNewWalletModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showNewWalletModal = false)}
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
				<h3>Add New Wallet / Card</h3>
				<button class="close-btn" onclick={() => (showNewWalletModal = false)}>✕</button>
			</div>

			<div class="form-group-custom">
				<label for="w-name">Wallet Name (e.g. Student Forex, ICICI Campus)</label>
				<input id="w-name" type="text" placeholder="Wallet name..." bind:value={newWalletName} class="modal-input" />
			</div>

			<div class="form-group-custom">
				<label for="w-bal">Initial Balance (₹)</label>
				<input id="w-bal" type="number" step="0.01" placeholder="0.00" bind:value={newWalletBalance} class="modal-input" />
			</div>

			<div class="sheet-btn-row">
				<button class="primary-btn-full" onclick={handleCreateWallet}>
					Create Wallet
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Quick Transfer Sheet -->
{#if showTransferModal}
	<div
		class="modal-backdrop"
		onclick={() => (showTransferModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showTransferModal = false)}
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
				<h3>Transfer Funds</h3>
				<button class="close-btn" onclick={() => (showTransferModal = false)}>✕</button>
			</div>

			<div class="form-group-custom">
				<label for="from-w">Source Wallet</label>
				<select id="from-w" bind:value={transferForm.fromWalletId} class="modal-input">
					{#each $wallets as w}
						<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
					{/each}
				</select>
			</div>

			<div class="form-group-custom">
				<label for="to-w">Destination Wallet</label>
				<select id="to-w" bind:value={transferForm.toWalletId} class="modal-input">
					{#each $wallets.filter(w => w.id !== transferForm.fromWalletId) as w}
						<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
					{/each}
				</select>
			</div>

			<div class="form-group-custom">
				<label for="t-amt">Transfer Amount (₹)</label>
				<input id="t-amt" type="number" step="0.01" placeholder="0.00" bind:value={transferForm.amount} class="modal-input" />
				{#if transferErrors.amount}
					<span class="err-txt">{transferErrors.amount}</span>
				{/if}
			</div>

			<div class="sheet-btn-row">
				<button class="primary-btn-full" onclick={handleTransferSubmit}>
					Execute Transfer
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.wallets-page {
		max-width: 680px;
		margin: 0 auto;
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
		margin-bottom: 0.95rem;
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
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		margin: 0;
		line-height: 1.2;
	}

	@media (min-width: 768px) {
		.page-title {
			font-size: 1.5rem;
		}
	}

	.add-wallet-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.45rem 0.85rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.78rem;
		font-weight: 700;
		transition: all 0.2s ease;
	}

	.add-wallet-btn:hover {
		background: var(--bg-hover);
		border-color: var(--accent-primary);
	}

	/* Virtual Cards Deck */
	.virtual-cards-deck {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.virtual-card {
		border-radius: var(--border-radius);
		padding: 0.95rem 1rem;
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #FFFFFF;
		transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.virtual-card:hover {
		transform: translateY(-2px);
	}

	.card-upi {
		background: linear-gradient(135deg, #0A1128 0%, #101F42 60%, #1C3166 100%);
	}

	.card-cash {
		background: linear-gradient(135deg, #06281E 0%, #0D4736 60%, #12634C 100%);
	}

	.card-bank {
		background: linear-gradient(135deg, #1E1035 0%, #311A56 60%, #46257C 100%);
	}

	.card-glow-bg {
		position: absolute;
		top: -30%;
		right: -10%;
		width: 180px;
		height: 180px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}

	.card-top-line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.85rem;
		position: relative;
		z-index: 2;
	}

	.card-chip-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.card-chip {
		width: 30px;
		height: 22px;
		border-radius: 4px;
		background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%);
		border: 1px solid rgba(0, 0, 0, 0.2);
	}

	.card-brand-name {
		font-size: 0.88rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.card-action-icon {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.12);
		color: #FFFFFF;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.card-action-icon:hover {
		background: rgba(255, 255, 255, 0.24);
	}

	.card-body-balance {
		margin-bottom: 0.95rem;
		position: relative;
		z-index: 2;
	}

	.balance-sub {
		display: block;
		font-size: 0.68rem;
		opacity: 0.75;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 2px;
	}

	.card-balance-val {
		font-size: 1.65rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		line-height: 1.1;
	}

	@media (min-width: 768px) {
		.card-balance-val {
			font-size: 1.95rem;
		}
	}

	.card-footer-stats {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 1px solid rgba(255, 255, 255, 0.16);
		padding-top: 0.65rem;
		position: relative;
		z-index: 2;
	}

	.card-stat-col {
		display: flex;
		flex-direction: column;
	}

	.c-stat-lbl {
		font-size: 0.72rem;
		opacity: 0.8;
		text-transform: uppercase;
		font-weight: 700;
	}

	.c-stat-val {
		font-size: 0.95rem;
		font-weight: 800;
	}

	.card-transfer-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: rgba(255, 255, 255, 0.18);
		color: #FFFFFF;
		padding: 0.4rem 0.85rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.76rem;
		font-weight: 800;
		border: 1px solid rgba(255, 255, 255, 0.25);
		transition: all 0.2s ease;
	}

	.card-transfer-pill:hover {
		background: rgba(255, 255, 255, 0.32);
	}

	/* Modal Sheets */
	.sheet-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.sheet-top-row h3 {
		font-size: 1.15rem;
		font-weight: 800;
		margin: 0;
	}

	.sheet-desc {
		font-size: 0.86rem;
		color: var(--text-secondary);
		margin-bottom: 1.15rem;
	}

	.form-group-custom {
		margin-bottom: 1rem;
	}

	.form-group-custom label {
		display: block;
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 0.35rem;
	}

	.modal-input {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 0.75rem 1rem;
		font-size: 16px;
		color: var(--text-primary);
		min-height: 48px;
	}

	.sheet-btn-row {
		margin-top: 1.25rem;
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
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.err-txt {
		font-size: 0.74rem;
		color: var(--danger);
		font-weight: 600;
		margin-top: 3px;
		display: block;
	}
</style>
