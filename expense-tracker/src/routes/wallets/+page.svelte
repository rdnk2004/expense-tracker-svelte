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
		addExpense
	} from '$lib/stores';
	import type { Expense, Transfer, Category, Wallet } from '$lib/types';
	import * as db from '$lib/db';

	// Modal states
	let showTransferModal = $state(false);
	let showExpenseModal = $state(false);
	let showManualAdjustment = $state<string | null>(null); // walletId or null

	// Filter states per wallet
	let filterUPI = $state<'all' | 'expenses' | 'transfers'>('all');
	let filterCash = $state<'all' | 'expenses' | 'transfers'>('all');

	// Transfer modal form
	let transferForm = $state({
		fromWalletId: '',
		toWalletId: '',
		amount: '',
		date: formatDateInput(new Date().toISOString()),
		note: ''
	});
	let transferErrors = $state<Record<string, string>>({});
	let isSubmittingTransfer = $state(false);

	// Expense modal form
	let expenseForm = $state({
		amount: '',
		walletId: '',
		categoryId: '',
		subcategory: '',
		date: formatDateInput(new Date().toISOString()),
		note: ''
	});
	let expenseErrors = $state<Record<string, string>>({});
	let isSubmittingExpense = $state(false);

	// Manual adjustment form
	let manualAdjustmentForm = $state({
		newBalance: ''
	});

	// Toast notification
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error'>('success');

	// Computed values
	let selectedCategory = $derived($categories.find((c) => c.id === expenseForm.categoryId));
	let upiWallet = $derived($wallets.find((w) => w.name === 'UPI'));
	let cashWallet = $derived($wallets.find((w) => w.name === 'Cash'));

	let fromWallet = $derived($wallets.find((w) => w.id === transferForm.fromWalletId));
	let toWallet = $derived($wallets.find((w) => w.id === transferForm.toWalletId));
	let transferAmountInPaise = $derived(
		transferForm.amount ? Math.round(parseFloat(transferForm.amount) * 100) : 0
	);
	let hasInsufficientTransferBalance = $derived(
		fromWallet ? transferAmountInPaise > fromWallet.balance : false
	);

	let expenseAmountInPaise = $derived(
		expenseForm.amount ? Math.round(parseFloat(expenseForm.amount) * 100) : 0
	);
	let selectedWallet = $derived($wallets.find((w) => w.id === expenseForm.walletId));
	let hasInsufficientExpenseBalance = $derived(
		selectedWallet ? expenseAmountInPaise > selectedWallet.balance : false
	);

	// Get transactions for a wallet
	function getWalletTransactions(walletId: string, filter: 'all' | 'expenses' | 'transfers') {
		type Transaction = {
			id: string;
			type: 'expense' | 'transfer-in' | 'transfer-out';
			amount: number;
			date: string;
			category?: Category;
			subcategory?: string | null;
			note?: string | null;
			fromWallet?: string;
			toWallet?: string;
		};

		const transactions: Transaction[] = [];

		// Add expenses
		if (filter === 'all' || filter === 'expenses') {
			$expenses
				.filter((e) => e.walletId === walletId)
				.forEach((e) => {
					transactions.push({
						id: e.id,
						type: 'expense',
						amount: -e.amount,
						date: e.date,
						category: $categories.find((c) => c.id === e.categoryId),
						subcategory: e.subcategory,
						note: e.note
					});
				});
		}

		// Add transfers
		if (filter === 'all' || filter === 'transfers') {
			$transfers.forEach((t) => {
				if (t.fromWalletId === walletId) {
					transactions.push({
						id: t.id,
						type: 'transfer-out',
						amount: -t.amount,
						date: t.date,
						note: t.note,
						toWallet: $wallets.find((w) => w.id === t.toWalletId)?.name
					});
				} else if (t.toWalletId === walletId) {
					transactions.push({
						id: t.id,
						type: 'transfer-in',
						amount: t.amount,
						date: t.date,
						note: t.note,
						fromWallet: $wallets.find((w) => w.id === t.fromWalletId)?.name
					});
				}
			});
		}

		// Sort by date (newest first) and take last 10
		return transactions
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 10);
	}

	// Get wallet stats
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

	// Format relative time
	function formatRelativeTime(isoDate: string): string {
		const date = new Date(isoDate);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
		return formatDate(isoDate);
	}

	// Transfer modal functions
	function openTransferModal() {
		transferForm = {
			fromWalletId: '',
			toWalletId: '',
			amount: '',
			date: formatDateInput(new Date().toISOString()),
			note: ''
		};
		transferErrors = {};
		showTransferModal = true;
	}

	function closeTransferModal() {
		showTransferModal = false;
	}

	function validateTransferForm(): boolean {
		transferErrors = {};

		if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) {
			transferErrors.amount = 'Amount must be greater than 0';
		}

		if (!transferForm.fromWalletId) {
			transferErrors.fromWalletId = 'Please select source wallet';
		}

		if (!transferForm.toWalletId) {
			transferErrors.toWalletId = 'Please select destination wallet';
		}

		if (
			transferForm.fromWalletId &&
			transferForm.toWalletId &&
			transferForm.fromWalletId === transferForm.toWalletId
		) {
			transferErrors.toWalletId = 'Source and destination must be different';
		}

		if (hasInsufficientTransferBalance) {
			transferErrors.amount = 'Insufficient balance in source wallet';
		}

		if (!transferForm.date) {
			transferErrors.date = 'Please select a date';
		}

		return Object.keys(transferErrors).length === 0;
	}

	async function handleTransferSubmit() {
		if (!validateTransferForm()) return;

		isSubmittingTransfer = true;

		try {
			await createTransfer(
				transferForm.fromWalletId,
				transferForm.toWalletId,
				transferAmountInPaise,
				new Date(transferForm.date).toISOString(),
				transferForm.note || undefined
			);

			showSuccessToast('Transfer completed successfully! 💸');
			closeTransferModal();
		} catch (error) {
			console.error('Failed to create transfer:', error);
			showErrorToast('Failed to create transfer ❌');
		} finally {
			isSubmittingTransfer = false;
		}
	}

	// Expense modal functions
	function openExpenseModal() {
		expenseForm = {
			amount: '',
			walletId: '',
			categoryId: '',
			subcategory: '',
			date: formatDateInput(new Date().toISOString()),
			note: ''
		};
		expenseErrors = {};
		showExpenseModal = true;
	}

	function closeExpenseModal() {
		showExpenseModal = false;
	}

	function validateExpenseForm(): boolean {
		expenseErrors = {};

		if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
			expenseErrors.amount = 'Amount must be greater than 0';
		}

		if (!expenseForm.walletId) {
			expenseErrors.walletId = 'Please select a wallet';
		}

		if (!expenseForm.categoryId) {
			expenseErrors.categoryId = 'Please select a category';
		}

		if (!expenseForm.date) {
			expenseErrors.date = 'Please select a date';
		}

		return Object.keys(expenseErrors).length === 0;
	}

	async function handleExpenseSubmit() {
		if (!validateExpenseForm()) return;

		isSubmittingExpense = true;

		try {
			await addExpense({
				amount: expenseAmountInPaise,
				walletId: expenseForm.walletId,
				categoryId: expenseForm.categoryId,
				subcategory: expenseForm.subcategory || null,
				date: new Date(expenseForm.date).toISOString(),
				note: expenseForm.note || null
			});

			showSuccessToast('Expense added successfully! 🎉');
			closeExpenseModal();
		} catch (error) {
			console.error('Failed to add expense:', error);
			showErrorToast('Failed to add expense ❌');
		} finally {
			isSubmittingExpense = false;
		}
	}

	// Manual adjustment functions
	function openManualAdjustment(walletId: string) {
		const wallet = $wallets.find((w) => w.id === walletId);
		if (wallet) {
			manualAdjustmentForm.newBalance = (wallet.balance / 100).toFixed(2);
			showManualAdjustment = walletId;
		}
	}

	function closeManualAdjustment() {
		showManualAdjustment = null;
	}

	async function handleManualAdjustment(walletId: string) {
		const wallet = $wallets.find((w) => w.id === walletId);
		if (!wallet) return;

		const newBalanceInPaise = Math.round(parseFloat(manualAdjustmentForm.newBalance) * 100);
		const difference = newBalanceInPaise - wallet.balance;

		const confirmed = confirm(
			`Manual Balance Adjustment\n\n` +
				`Wallet: ${wallet.name}\n` +
				`Current Balance: ${formatCurrency(wallet.balance)}\n` +
				`New Balance: ${formatCurrency(newBalanceInPaise)}\n` +
				`Difference: ${difference >= 0 ? '+' : ''}${formatCurrency(Math.abs(difference))}\n\n` +
				`⚠️ Warning: This will directly modify the wallet balance without creating a transaction record.\n` +
				`Are you sure you want to proceed?`
		);

		if (!confirmed) return;

		try {
			await db.updateWalletBalance(walletId, newBalanceInPaise);

			// Update the wallet's updated timestamp
			const updatedWallet = {
				...wallet,
				balance: newBalanceInPaise,
				updated: new Date().toISOString()
			};
			await db.saveWallet(updatedWallet);

			// Reload wallets to reflect changes
			const updatedWallets = await db.getWallets();
			wallets.set(updatedWallets);

			showSuccessToast('Wallet balance updated! 💰');
			closeManualAdjustment();
		} catch (error) {
			console.error('Failed to update wallet balance:', error);
			showErrorToast('Failed to update balance ❌');
		}
	}

	// Toast functions
	function showSuccessToast(message: string) {
		toastMessage = message;
		toastType = 'success';
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	function showErrorToast(message: string) {
		toastMessage = message;
		toastType = 'error';
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}
</script>

<div class="wallets-page">
	<!-- Toast Notification -->
	{#if showToast}
		<div class="toast {toastType}">{toastMessage}</div>
	{/if}

	<!-- Page Header -->
	<div class="page-header">
		<h1 class="page-title">💰 Wallets</h1>
		<div class="header-actions">
			<button class="action-btn primary" onclick={openExpenseModal}>+ Add Expense</button>
			<button class="action-btn secondary" onclick={openTransferModal}>🔄 Transfer Money</button>
		</div>
	</div>

	<!-- Wallet Cards -->
	<div class="wallet-cards">
		<!-- UPI Wallet -->
		{#if upiWallet}
			{@const stats = getWalletStats(upiWallet.id)}
			{@const transactions = getWalletTransactions(upiWallet.id, filterUPI)}
			<div class="wallet-card">
				<div class="wallet-header">
					<div class="wallet-info">
						<h2 class="wallet-name">📱 UPI</h2>
						<span class="wallet-updated">Updated {formatRelativeTime(upiWallet.updated)}</span>
					</div>
					<button
						class="manual-adjust-btn"
						onclick={() => openManualAdjustment(upiWallet.id)}
						title="Manual adjustment"
					>
						⚙️
					</button>
				</div>

				<div class="wallet-balance">{formatCurrency(upiWallet.balance)}</div>

				<div class="wallet-stats">
					<div class="stat-item">
						<span class="stat-label">Expenses</span>
						<span class="stat-value">{formatCurrency(stats.totalExpenses)}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Transfers</span>
						<span class="stat-value"
							>↓{formatCurrency(stats.transfersIn)} / ↑{formatCurrency(stats.transfersOut)}</span
						>
					</div>
					<div class="stat-item">
						<span class="stat-label">Transactions</span>
						<span class="stat-value">{stats.transactionCount}</span>
					</div>
				</div>

				<!-- Manual Adjustment Form -->
				{#if showManualAdjustment === upiWallet.id}
					<div class="manual-adjustment">
						<h4>Manual Balance Adjustment</h4>
						<p class="warning">
							⚠️ This will directly modify the balance without creating a transaction record.
						</p>
						<div class="adjust-form">
							<label for="upi-balance">New Balance (₹)</label>
							<input
								type="number"
								id="upi-balance"
								bind:value={manualAdjustmentForm.newBalance}
								step="0.01"
								min="0"
							/>
							<div class="adjust-actions">
								<button class="btn-confirm" onclick={() => handleManualAdjustment(upiWallet.id)}>
									Confirm
								</button>
								<button class="btn-cancel" onclick={closeManualAdjustment}>Cancel</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Transaction History -->
				<div class="transaction-section">
					<div class="transaction-header">
						<h3>Recent Transactions</h3>
						<div class="filter-buttons">
							<button
								class="filter-btn"
								class:active={filterUPI === 'all'}
								onclick={() => (filterUPI = 'all')}
							>
								All
							</button>
							<button
								class="filter-btn"
								class:active={filterUPI === 'expenses'}
								onclick={() => (filterUPI = 'expenses')}
							>
								Expenses
							</button>
							<button
								class="filter-btn"
								class:active={filterUPI === 'transfers'}
								onclick={() => (filterUPI = 'transfers')}
							>
								Transfers
							</button>
						</div>
					</div>

					<div class="transactions-list">
						{#if transactions.length > 0}
							{#each transactions as transaction (transaction.id)}
								<div class="transaction-item" class:negative={transaction.amount < 0}>
									<div class="transaction-icon">
										{#if transaction.type === 'expense'}
											{transaction.category?.icon || '📦'}
										{:else if transaction.type === 'transfer-in'}
											⬇️
										{:else}
											⬆️
										{/if}
									</div>
									<div class="transaction-details">
										<div class="transaction-name">
											{#if transaction.type === 'expense'}
												{transaction.category?.name || 'Unknown'}
												{#if transaction.subcategory}
													<span class="subcategory">• {transaction.subcategory}</span>
												{/if}
											{:else if transaction.type === 'transfer-in'}
												Transfer from {transaction.fromWallet || 'Unknown'}
											{:else}
												Transfer to {transaction.toWallet || 'Unknown'}
											{/if}
										</div>
										{#if transaction.note}
											<div class="transaction-note">{transaction.note}</div>
										{/if}
										<div class="transaction-date">{formatDate(transaction.date)}</div>
									</div>
									<div class="transaction-amount" class:positive={transaction.amount > 0}>
										{transaction.amount >= 0 ? '+' : ''}{formatCurrency(
											Math.abs(transaction.amount)
										)}
									</div>
								</div>
							{/each}
						{:else}
							<div class="empty-state">
								<div class="empty-icon">📭</div>
								<p>No transactions found</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Cash Wallet -->
		{#if cashWallet}
			{@const stats = getWalletStats(cashWallet.id)}
			{@const transactions = getWalletTransactions(cashWallet.id, filterCash)}
			<div class="wallet-card">
				<div class="wallet-header">
					<div class="wallet-info">
						<h2 class="wallet-name">💵 Cash</h2>
						<span class="wallet-updated">Updated {formatRelativeTime(cashWallet.updated)}</span>
					</div>
					<button
						class="manual-adjust-btn"
						onclick={() => openManualAdjustment(cashWallet.id)}
						title="Manual adjustment"
					>
						⚙️
					</button>
				</div>

				<div class="wallet-balance">{formatCurrency(cashWallet.balance)}</div>

				<div class="wallet-stats">
					<div class="stat-item">
						<span class="stat-label">Expenses</span>
						<span class="stat-value">{formatCurrency(stats.totalExpenses)}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Transfers</span>
						<span class="stat-value"
							>↓{formatCurrency(stats.transfersIn)} / ↑{formatCurrency(stats.transfersOut)}</span
						>
					</div>
					<div class="stat-item">
						<span class="stat-label">Transactions</span>
						<span class="stat-value">{stats.transactionCount}</span>
					</div>
				</div>

				<!-- Manual Adjustment Form -->
				{#if showManualAdjustment === cashWallet.id}
					<div class="manual-adjustment">
						<h4>Manual Balance Adjustment</h4>
						<p class="warning">
							⚠️ This will directly modify the balance without creating a transaction record.
						</p>
						<div class="adjust-form">
							<label for="cash-balance">New Balance (₹)</label>
							<input
								type="number"
								id="cash-balance"
								bind:value={manualAdjustmentForm.newBalance}
								step="0.01"
								min="0"
							/>
							<div class="adjust-actions">
								<button class="btn-confirm" onclick={() => handleManualAdjustment(cashWallet.id)}>
									Confirm
								</button>
								<button class="btn-cancel" onclick={closeManualAdjustment}>Cancel</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Transaction History -->
				<div class="transaction-section">
					<div class="transaction-header">
						<h3>Recent Transactions</h3>
						<div class="filter-buttons">
							<button
								class="filter-btn"
								class:active={filterCash === 'all'}
								onclick={() => (filterCash = 'all')}
							>
								All
							</button>
							<button
								class="filter-btn"
								class:active={filterCash === 'expenses'}
								onclick={() => (filterCash = 'expenses')}
							>
								Expenses
							</button>
							<button
								class="filter-btn"
								class:active={filterCash === 'transfers'}
								onclick={() => (filterCash = 'transfers')}
							>
								Transfers
							</button>
						</div>
					</div>

					<div class="transactions-list">
						{#if transactions.length > 0}
							{#each transactions as transaction (transaction.id)}
								<div class="transaction-item" class:negative={transaction.amount < 0}>
									<div class="transaction-icon">
										{#if transaction.type === 'expense'}
											{transaction.category?.icon || '📦'}
										{:else if transaction.type === 'transfer-in'}
											⬇️
										{:else}
											⬆️
										{/if}
									</div>
									<div class="transaction-details">
										<div class="transaction-name">
											{#if transaction.type === 'expense'}
												{transaction.category?.name || 'Unknown'}
												{#if transaction.subcategory}
													<span class="subcategory">• {transaction.subcategory}</span>
												{/if}
											{:else if transaction.type === 'transfer-in'}
												Transfer from {transaction.fromWallet || 'Unknown'}
											{:else}
												Transfer to {transaction.toWallet || 'Unknown'}
											{/if}
										</div>
										{#if transaction.note}
											<div class="transaction-note">{transaction.note}</div>
										{/if}
										<div class="transaction-date">{formatDate(transaction.date)}</div>
									</div>
									<div class="transaction-amount" class:positive={transaction.amount > 0}>
										{transaction.amount >= 0 ? '+' : ''}{formatCurrency(
											Math.abs(transaction.amount)
										)}
									</div>
								</div>
							{/each}
						{:else}
							<div class="empty-state">
								<div class="empty-icon">📭</div>
								<p>No transactions found</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Transfer Modal -->
	{#if showTransferModal}
		<div
			class="modal-overlay"
			onclick={closeTransferModal}
			onkeydown={(e) => e.key === 'Escape' && closeTransferModal()}
			role="button"
			tabindex="-1"
			aria-label="Close modal"
		></div>
		<div class="modal">
			<div class="modal-header">
				<h2>🔄 Transfer Money</h2>
				<button class="modal-close" onclick={closeTransferModal}>✕</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleTransferSubmit();
				}}
			>
				<div class="form-grid">
					<div class="form-group">
						<label for="from-wallet">From Wallet *</label>
						<select
							id="from-wallet"
							bind:value={transferForm.fromWalletId}
							class:error={transferErrors.fromWalletId}
						>
							<option value="">Select source wallet</option>
							{#each $wallets as wallet}
								<option value={wallet.id} disabled={wallet.id === transferForm.toWalletId}>
									{wallet.name} ({formatCurrency(wallet.balance)})
								</option>
							{/each}
						</select>
						{#if transferErrors.fromWalletId}
							<span class="error-message">{transferErrors.fromWalletId}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="to-wallet">To Wallet *</label>
						<select
							id="to-wallet"
							bind:value={transferForm.toWalletId}
							class:error={transferErrors.toWalletId}
						>
							<option value="">Select destination wallet</option>
							{#each $wallets as wallet}
								<option value={wallet.id} disabled={wallet.id === transferForm.fromWalletId}>
									{wallet.name}
								</option>
							{/each}
						</select>
						{#if transferErrors.toWalletId}
							<span class="error-message">{transferErrors.toWalletId}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="transfer-amount">Amount (₹) *</label>
						<input
							type="number"
							id="transfer-amount"
							bind:value={transferForm.amount}
							placeholder="0.00"
							step="0.01"
							min="0"
							class:error={transferErrors.amount}
						/>
						{#if transferErrors.amount}
							<span class="error-message">{transferErrors.amount}</span>
						{:else if hasInsufficientTransferBalance}
							<span class="warning-message">⚠️ Insufficient balance</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="transfer-date">Date *</label>
						<input
							type="date"
							id="transfer-date"
							bind:value={transferForm.date}
							class:error={transferErrors.date}
						/>
						{#if transferErrors.date}
							<span class="error-message">{transferErrors.date}</span>
						{/if}
					</div>

					<div class="form-group full-width">
						<label for="transfer-note">Note (optional)</label>
						<input
							type="text"
							id="transfer-note"
							bind:value={transferForm.note}
							placeholder="e.g., Monthly budget distribution"
							maxlength="200"
						/>
					</div>
				</div>

				<!-- Preview -->
				{#if transferForm.fromWalletId && transferForm.toWalletId && transferForm.amount && parseFloat(transferForm.amount) > 0}
					<div class="transfer-preview">
						<strong>Preview:</strong> This will move{' '}
						<span class="highlight">{formatCurrency(transferAmountInPaise)}</span> from{' '}
						<span class="highlight">{fromWallet?.name}</span> to{' '}
						<span class="highlight">{toWallet?.name}</span>
					</div>
				{/if}

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={closeTransferModal}>Cancel</button>
					<button
						type="submit"
						class="btn-submit"
						disabled={isSubmittingTransfer || hasInsufficientTransferBalance}
					>
						{isSubmittingTransfer ? '⏳ Processing...' : '✓ Transfer'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Expense Modal -->
	{#if showExpenseModal}
		<div
			class="modal-overlay"
			onclick={closeExpenseModal}
			onkeydown={(e) => e.key === 'Escape' && closeExpenseModal()}
			role="button"
			tabindex="-1"
			aria-label="Close modal"
		></div>
		<div class="modal">
			<div class="modal-header">
				<h2>🧾 Add Expense</h2>
				<button class="modal-close" onclick={closeExpenseModal}>✕</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleExpenseSubmit();
				}}
			>
				<div class="form-grid">
					<div class="form-group">
						<label for="expense-amount">Amount (₹) *</label>
						<input
							type="number"
							id="expense-amount"
							bind:value={expenseForm.amount}
							placeholder="0.00"
							step="0.01"
							min="0"
							class:error={expenseErrors.amount}
						/>
						{#if expenseErrors.amount}
							<span class="error-message">{expenseErrors.amount}</span>
						{/if}
						{#if hasInsufficientExpenseBalance}
							<span class="warning-message">⚠️ Insufficient balance in selected wallet</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="expense-wallet">Wallet *</label>
						<select
							id="expense-wallet"
							bind:value={expenseForm.walletId}
							class:error={expenseErrors.walletId}
						>
							<option value="">Select wallet</option>
							{#each $wallets as wallet}
								<option value={wallet.id}>{wallet.name} ({formatCurrency(wallet.balance)})</option>
							{/each}
						</select>
						{#if expenseErrors.walletId}
							<span class="error-message">{expenseErrors.walletId}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="expense-category">Category *</label>
						<select
							id="expense-category"
							bind:value={expenseForm.categoryId}
							onchange={() => (expenseForm.subcategory = '')}
							class:error={expenseErrors.categoryId}
						>
							<option value="">Select category</option>
							{#each $categories as category}
								<option value={category.id}>{category.icon} {category.name}</option>
							{/each}
						</select>
						{#if expenseErrors.categoryId}
							<span class="error-message">{expenseErrors.categoryId}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="expense-subcategory">Subcategory</label>
						<select
							id="expense-subcategory"
							bind:value={expenseForm.subcategory}
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
						<label for="expense-date">Date *</label>
						<input
							type="date"
							id="expense-date"
							bind:value={expenseForm.date}
							class:error={expenseErrors.date}
						/>
						{#if expenseErrors.date}
							<span class="error-message">{expenseErrors.date}</span>
						{/if}
					</div>

					<div class="form-group full-width">
						<label for="expense-note">Note (optional, max 200 chars)</label>
						<input
							type="text"
							id="expense-note"
							bind:value={expenseForm.note}
							placeholder="e.g., Coffee with friends"
							maxlength="200"
						/>
						<span class="char-count">{expenseForm.note.length}/200</span>
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={closeExpenseModal}>Cancel</button>
					<button type="submit" class="btn-submit" disabled={isSubmittingExpense}>
						{isSubmittingExpense ? '⏳ Adding...' : '+ Add Expense'}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>

<style>
	.wallets-page {
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
		color: white;
		padding: 1rem 1.5rem;
		border-radius: var(--border-radius);
		box-shadow: var(--shadow-lg);
		z-index: 1000;
		animation: slideIn 0.3s ease-out;
	}

	.toast.success {
		background: var(--success);
	}

	.toast.error {
		background: var(--danger);
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
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
	}

	.action-btn {
		padding: 0.75rem 1.5rem;
		border-radius: var(--border-radius);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.action-btn.primary {
		background: var(--accent-primary);
		color: var(--bg-primary);
	}

	.action-btn.primary:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
	}

	.action-btn.secondary {
		background: var(--bg-card);
		color: var(--accent-primary);
		border: 1px solid var(--border-color);
	}

	.action-btn.secondary:hover {
		background: var(--bg-hover);
		border-color: var(--accent-primary);
	}

	/* Wallet Cards */
	.wallet-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.wallet-card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 2rem;
		box-shadow: var(--shadow-md);
	}

	.wallet-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
	}

	.wallet-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.wallet-name {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.wallet-updated {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.manual-adjust-btn {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.5rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1.25rem;
	}

	.manual-adjust-btn:hover {
		background: var(--bg-hover);
		color: var(--accent-primary);
	}

	.wallet-balance {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--accent-primary);
		margin-bottom: 1.5rem;
	}

	.wallet-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: var(--border-radius);
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.stat-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	/* Manual Adjustment */
	.manual-adjustment {
		background: var(--bg-secondary);
		border: 1px solid var(--warning);
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.manual-adjustment h4 {
		margin: 0 0 0.5rem 0;
		color: var(--text-primary);
		font-size: 1rem;
	}

	.manual-adjustment .warning {
		font-size: 0.875rem;
		color: var(--warning);
		margin: 0 0 1rem 0;
	}

	.adjust-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.adjust-form label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.adjust-form input {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.75rem;
		border-radius: var(--border-radius);
		font-size: 1rem;
	}

	.adjust-actions {
		display: flex;
		gap: 0.75rem;
	}

	.btn-confirm {
		flex: 1;
		background: var(--success);
		color: white;
		border: none;
		padding: 0.75rem;
		border-radius: var(--border-radius);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-confirm:hover {
		background: #27ae60;
		transform: translateY(-1px);
	}

	.btn-cancel {
		flex: 1;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		padding: 0.75rem;
		border-radius: var(--border-radius);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-cancel:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	/* Transaction Section */
	.transaction-section {
		border-top: 1px solid var(--border-color);
		padding-top: 1.5rem;
	}

	.transaction-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.transaction-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.filter-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.filter-btn {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.5rem 1rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.filter-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.filter-btn.active {
		background: var(--accent-primary);
		color: var(--bg-primary);
		border-color: var(--accent-primary);
	}

	/* Transactions List */
	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.transaction-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.2s;
	}

	.transaction-item:hover {
		background: var(--bg-hover);
		box-shadow: var(--shadow-sm);
	}

	.transaction-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.transaction-details {
		flex: 1;
	}

	.transaction-name {
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.subcategory {
		color: var(--text-secondary);
		font-weight: 400;
	}

	.transaction-note {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
		margin-bottom: 0.25rem;
	}

	.transaction-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.transaction-amount {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--danger);
		flex-shrink: 0;
	}

	.transaction-amount.positive {
		color: var(--success);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state p {
		color: var(--text-muted);
		margin: 0;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 999;
		animation: fadeIn 0.2s ease-out;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 2rem;
		max-width: 600px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		z-index: 1000;
		box-shadow: var(--shadow-lg);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translate(-50%, -40%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.modal-close {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.modal-close:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	/* Form Styles */
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

	/* Transfer Preview */
	.transfer-preview {
		background: var(--bg-secondary);
		border: 1px solid var(--accent-primary);
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.transfer-preview .highlight {
		color: var(--accent-primary);
		font-weight: 600;
	}

	/* Modal Actions */
	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.btn-submit {
		background: var(--accent-primary);
		color: var(--bg-primary);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: var(--border-radius);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-submit:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
	}

	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.wallet-cards {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.header-actions {
			width: 100%;
		}

		.action-btn {
			flex: 1;
		}

		.wallet-stats {
			grid-template-columns: 1fr;
		}

		.transaction-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.filter-buttons {
			width: 100%;
		}

		.filter-btn {
			flex: 1;
		}
	}
</style>
