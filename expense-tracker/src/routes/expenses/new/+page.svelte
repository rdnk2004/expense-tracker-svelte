<script lang="ts">
	import { goto } from '$app/navigation';
	import { wallets, categories, addExpense, addIncome, createTransfer, formatCurrency } from '$lib/stores';
	import Keypad from '$lib/components/Keypad.svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import { ArrowLeft, Calendar, CreditCard, ChevronDown, Check, X } from 'lucide-svelte';

	let amountStr = $state('0');
	let type = $state<'expense' | 'income' | 'transfer'>('expense');
	let selectedWalletId = $state('');
	let selectedToWalletId = $state('');
	let selectedCategoryId = $state('');
	let selectedSubcategory = $state('');
	let date = $state(new Date().toISOString().split('T')[0]);
	let description = $state('');

	// Modal states
	let showWalletModal = $state(false);
	let showToWalletModal = $state(false);
	let showCategoryModal = $state(false);
	let showSubcategoryModal = $state(false);

	// Automatically select defaults when stores load
	$effect(() => {
		if ($wallets.length > 0 && !selectedWalletId) {
			selectedWalletId = $wallets[0].id;
		}
	});

	$effect(() => {
		if ($wallets.length > 0 && selectedWalletId && (!selectedToWalletId || selectedToWalletId === selectedWalletId)) {
			const other = $wallets.find(w => w.id !== selectedWalletId);
			if (other) {
				selectedToWalletId = other.id;
			}
		}
	});

	$effect(() => {
		if ($categories.length > 0 && !selectedCategoryId) {
			selectedCategoryId = $categories[0].id;
		}
	});

	$effect(() => {
		if (selectedCategoryId) {
			selectedSubcategory = '';
		}
	});

	// Derived values
	let displayAmount = $derived(amountStr === '' ? '0' : amountStr);
	let selectedWallet = $derived($wallets.find((w) => w.id === selectedWalletId));
	let selectedToWallet = $derived($wallets.find((w) => w.id === selectedToWalletId));
	let selectedCategory = $derived($categories.find((c) => c.id === selectedCategoryId));

	function handleKeyPress(e: CustomEvent<string>) {
		const key = e.detail;
		if (key === 'backspace') {
			if (amountStr.length > 1) {
				amountStr = amountStr.slice(0, -1);
			} else {
				amountStr = '0';
			}
		} else if (key === '.') {
			if (!amountStr.includes('.')) {
				amountStr += '.';
			}
		} else {
			if (amountStr === '0') {
				amountStr = key;
			} else {
				// Prevent too many decimals
				if (amountStr.includes('.') && amountStr.split('.')[1].length >= 2) return;
				amountStr += key;
			}
		}
	}

	async function handleSubmit() {
		const amount = parseFloat(amountStr);
		if (amount <= 0) return;
		
		// Fix currency increment: convert rupee input to paise
		const amountInPaise = Math.round(amount * 100);

		try {
			if (type === 'expense') {
				await addExpense({
					walletId: selectedWalletId,
					categoryId: selectedCategoryId,
					subcategory: selectedSubcategory || null,
					amount: amountInPaise,
					date: new Date(date).toISOString(),
					note: description.trim() || null
				});
			} else if (type === 'income') {
				await addIncome({
					walletId: selectedWalletId,
					amount: amountInPaise,
					date: new Date(date).toISOString(),
					source: description.trim() || 'Income',
					note: description.trim() || null
				});
			} else if (type === 'transfer') {
				if (selectedWalletId === selectedToWalletId) {
					alert('Source and destination wallets must be different');
					return;
				}
				await createTransfer(
					selectedWalletId,
					selectedToWalletId,
					amountInPaise,
					new Date(date).toISOString(),
					description.trim() || undefined
				);
			}
			goto('/');
		} catch (err) {
			console.error(err);
		}
	}
</script>

<div class="page-container">
	<!-- Header -->
	<div class="header">
		<button class="icon-btn" onclick={() => goto('/')} aria-label="Go back">
			<ArrowLeft size={24} />
		</button>
		<div class="tabs">
			<button class="tab" class:active={type === 'income'} onclick={() => (type = 'income')}
				>Income</button
			>
			<button class="tab" class:active={type === 'expense'} onclick={() => (type = 'expense')}
				>Expense</button
			>
			<button class="tab" class:active={type === 'transfer'} onclick={() => (type = 'transfer')}
				>Transfer</button
			>
		</div>
		<div style="width: 40px;"></div>
		<!-- Spacer -->
	</div>

	<!-- Amount Display -->
	<div class="amount-display">
		<span class="currency">₹</span>
		<span class="value">{displayAmount}</span>
	</div>

	<!-- Controls / Inputs -->
	{#if type === 'transfer'}
		<div class="input-row">
			<button class="input-pill" onclick={() => (showWalletModal = true)}>
				<CreditCard size={16} />
				<span>From: {selectedWallet?.name || 'Select'}</span>
				<ChevronDown size={14} />
			</button>
			<button class="input-pill" onclick={() => (showToWalletModal = true)}>
				<CreditCard size={16} />
				<span>To: {selectedToWallet?.name || 'Select'}</span>
				<ChevronDown size={14} />
			</button>
		</div>
		<div class="input-row">
			<button class="input-pill full" style="position: relative;">
				<Calendar size={16} />
				<span>Date: {new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
				<ChevronDown size={14} />
				<input
					type="date"
					bind:value={date}
					style="position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;"
				/>
			</button>
		</div>
	{:else}
		<div class="input-row">
			<button class="input-pill" onclick={() => (showWalletModal = true)}>
				<CreditCard size={16} />
				<span>{selectedWallet?.name || 'Wallet'}</span>
				<ChevronDown size={14} />
			</button>
			<button class="input-pill" style="position: relative;">
				<Calendar size={16} />
				<span>{new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
				<ChevronDown size={14} />
				<input
					type="date"
					bind:value={date}
					style="position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;"
				/>
			</button>
		</div>

		{#if type === 'expense'}
			<div class="input-row">
				{#if selectedCategory && selectedCategory.subcategories.length > 0}
					<button class="input-pill" onclick={() => (showCategoryModal = true)}>
						<span>Category: {selectedCategory.name}</span>
						<ChevronDown size={14} />
					</button>
					<button class="input-pill" onclick={() => (showSubcategoryModal = true)}>
						<span>Sub: {selectedSubcategory || 'None'}</span>
						<ChevronDown size={14} />
					</button>
				{:else}
					<button class="input-pill full" onclick={() => (showCategoryModal = true)}>
						<span>Category: {selectedCategory?.name || 'Select Category'}</span>
						<ChevronDown size={14} />
					</button>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- Description / Note Input -->
	<div class="input-row note-row">
		<input
			type="text"
			placeholder={type === 'income' ? "Income source / description..." : "Add note or description..."}
			bind:value={description}
			class="note-input"
		/>
	</div>

	<!-- Spacer to push keypad down -->
	<div class="spacer"></div>

	<!-- Keypad -->
	<div class="keypad-section">
		<Keypad on:press={handleKeyPress} />
		<button class="submit-btn" onclick={handleSubmit}> Add Transaction </button>
	</div>
</div>

<!-- Wallet Selection Modal -->
{#if showWalletModal}
	<div class="modal-overlay" onclick={() => (showWalletModal = false)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && (showWalletModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<div class="modal-header">
				<h3>Select Wallet</h3>
				<button class="close-btn" onclick={() => (showWalletModal = false)} aria-label="Close"><X size={20} /></button>
			</div>
			<div class="modal-list">
				{#each $wallets as wallet}
					<button
						class="modal-item"
						class:selected={selectedWalletId === wallet.id}
						onclick={() => {
							selectedWalletId = wallet.id;
							showWalletModal = false;
						}}
					>
						<span class="item-name">{wallet.name}</span>
						<span class="item-balance">{formatCurrency(wallet.balance)}</span>
						{#if selectedWalletId === wallet.id}
							<Check size={18} class="check-icon" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Target Wallet Selection Modal -->
{#if showToWalletModal}
	<div class="modal-overlay" onclick={() => (showToWalletModal = false)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && (showToWalletModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<div class="modal-header">
				<h3>Select Destination Wallet</h3>
				<button class="close-btn" onclick={() => (showToWalletModal = false)} aria-label="Close"><X size={20} /></button>
			</div>
			<div class="modal-list">
				{#each $wallets.filter(w => w.id !== selectedWalletId) as wallet}
					<button
						class="modal-item"
						class:selected={selectedToWalletId === wallet.id}
						onclick={() => {
							selectedToWalletId = wallet.id;
							showToWalletModal = false;
						}}
					>
						<span class="item-name">{wallet.name}</span>
						<span class="item-balance">{formatCurrency(wallet.balance)}</span>
						{#if selectedToWalletId === wallet.id}
							<Check size={18} class="check-icon" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Category Selection Modal -->
{#if showCategoryModal}
	<div class="modal-overlay" onclick={() => (showCategoryModal = false)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && (showCategoryModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<div class="modal-header">
				<h3>Select Category</h3>
				<button class="close-btn" onclick={() => (showCategoryModal = false)} aria-label="Close"><X size={20} /></button>
			</div>
			<div class="modal-grid">
				{#each $categories as category}
					<button
						class="category-grid-item"
						class:selected={selectedCategoryId === category.id}
						onclick={() => {
							selectedCategoryId = category.id;
							showCategoryModal = false;
						}}
					>
						<div class="category-icon-wrapper" style="background: {category.color}15; color: {category.color};">
							<CategoryIcon icon={category.icon} size={24} />
						</div>
						<span class="category-name">{category.name}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Subcategory Selection Modal -->
{#if showSubcategoryModal && selectedCategory}
	<div class="modal-overlay" onclick={() => (showSubcategoryModal = false)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && (showSubcategoryModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<div class="modal-header">
				<h3>Select Subcategory</h3>
				<button class="close-btn" onclick={() => (showSubcategoryModal = false)} aria-label="Close"><X size={20} /></button>
			</div>
			<div class="modal-list">
				<button
					class="modal-item"
					class:selected={selectedSubcategory === ''}
					onclick={() => {
						selectedSubcategory = '';
						showSubcategoryModal = false;
					}}
				>
					<span class="item-name">None (Main Category)</span>
					{#if selectedSubcategory === ''}
						<Check size={18} class="check-icon" />
					{/if}
				</button>
				{#each selectedCategory.subcategories as sub}
					<button
						class="modal-item"
						class:selected={selectedSubcategory === sub}
						onclick={() => {
							selectedSubcategory = sub;
							showSubcategoryModal = false;
						}}
					>
						<span class="item-name">{sub}</span>
						{#if selectedSubcategory === sub}
							<Check size={18} class="check-icon" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.page-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--bg-primary);
		padding: 16px;
		position: fixed;
		inset: 0;
		z-index: 2000;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.icon-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--bg-card);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		cursor: pointer;
	}

	.tabs {
		display: flex;
		background: var(--bg-card);
		padding: 4px;
		border-radius: 999px;
		border: 1px solid var(--border-color);
	}

	.tab {
		padding: 8px 16px;
		border-radius: 999px;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		transition: all 0.2s;
		cursor: pointer;
		border: none;
	}

	.tab.active {
		background: var(--accent-gradient);
		color: white;
		box-shadow: var(--shadow-sm);
	}

	.amount-display {
		text-align: center;
		margin-bottom: 32px;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		gap: 4px;
	}

	.currency {
		font-size: 2rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-top: 8px;
	}

	.value {
		font-size: 4rem;
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1;
	}

	.input-row {
		display: flex;
		justify-content: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.input-pill {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg-card);
		padding: 10px 16px;
		border-radius: 12px;
		font-size: 0.95rem;
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		cursor: pointer;
		flex: 1;
		justify-content: center;
	}

	.input-pill.full {
		width: 100%;
		justify-content: space-between;
		flex: none;
	}

	.spacer {
		flex: 1;
	}

	.keypad-section {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding-bottom: 20px;
	}

	.submit-btn {
		background: var(--accent-primary);
		color: white;
		width: 100%;
		padding: 18px;
		border-radius: 20px;
		font-size: 1.1rem;
		font-weight: 700;
		box-shadow: var(--shadow-glow);
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	.submit-btn:active {
		transform: scale(0.98);
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 3000;
		cursor: default;
	}

	.modal {
		background: var(--bg-card);
		width: 100%;
		max-width: 500px;
		border-radius: 32px 32px 0 0;
		padding: 24px 24px 34px 24px;
		box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
		border: 1px solid var(--border-color);
		border-bottom: none;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.modal-header h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.close-btn {
		background: transparent;
		color: var(--text-secondary);
		border: none;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 0.2s;
	}

	.close-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.modal-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow-y: auto;
	}

	.modal-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 16px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.2s;
		color: var(--text-primary);
	}

	.modal-item:hover {
		border-color: var(--accent-primary);
		background: var(--bg-hover);
	}

	.modal-item.selected {
		border-color: var(--accent-primary);
		background: rgba(79, 70, 229, 0.05);
	}

	.item-name {
		font-weight: 600;
		font-size: 1rem;
	}

	.item-balance {
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--accent-primary);
		margin-right: auto;
		margin-left: 12px;
	}

	.check-icon {
		color: var(--accent-primary);
	}

	/* Category Grid */
	.modal-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		overflow-y: auto;
		padding: 4px 0;
	}

	.category-grid-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 16px 8px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.2s;
		gap: 10px;
		color: var(--text-primary);
	}

	.category-grid-item:hover {
		border-color: var(--accent-primary);
		background: var(--bg-hover);
		transform: translateY(-2px);
	}

	.category-grid-item.selected {
		border-color: var(--accent-primary);
		background: rgba(79, 70, 229, 0.05);
		box-shadow: 0 4px 12px rgba(79, 70, 229, 0.05);
	}

	.category-icon-wrapper {
		width: 48px;
		height: 48px;
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s;
	}

	.category-grid-item:hover .category-icon-wrapper {
		transform: scale(1.1);
	}

	.category-name {
		font-size: 0.85rem;
		font-weight: 600;
		text-align: center;
	}

	/* Note input field */
	.note-row {
		margin-top: 8px;
		padding: 0 8px;
		justify-content: stretch;
	}

	.note-input {
		width: 100%;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		padding: 16px 20px;
		border-radius: 20px;
		font-size: 1rem;
		color: var(--text-primary);
		transition: all 0.2s;
		box-shadow: var(--shadow-sm);
	}

	.note-input:focus {
		outline: none;
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
	}
</style>
