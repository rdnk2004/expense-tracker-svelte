<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		wallets,
		categories,
		studentProfile,
		addExpense,
		addIncome,
		createTransfer,
		formatCurrency
	} from '$lib/stores';
	import type { ValueTag } from '$lib/types';
	import { calculateHoursOfWork } from '$lib/utils';
	import Keypad from '$lib/components/Keypad.svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import {
		ArrowLeft,
		Calendar,
		CreditCard,
		ChevronDown,
		Check,
		X,
		Zap,
		Sparkles,
		GraduationCap,
		Clock,
		Flame
	} from 'lucide-svelte';

	let amountStr = $state('0');
	let type = $state<'expense' | 'income' | 'transfer'>('expense');
	let selectedWalletId = $state('');
	let selectedToWalletId = $state('');
	let selectedCategoryId = $state('');
	let selectedSubcategory = $state('');
	let date = $state(new Date().toISOString().split('T')[0]);
	let description = $state('');
	let selectedValueTag = $state<ValueTag>('need');

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
		if (
			$wallets.length > 0 &&
			selectedWalletId &&
			(!selectedToWalletId || selectedToWalletId === selectedWalletId)
		) {
			const other = $wallets.find((w) => w.id !== selectedWalletId);
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
	let amountNumber = $derived(parseFloat(amountStr) || 0);
	let amountInPaise = $derived(Math.round(amountNumber * 100));
	let selectedWallet = $derived($wallets.find((w) => w.id === selectedWalletId));
	let selectedToWallet = $derived($wallets.find((w) => w.id === selectedToWalletId));
	let selectedCategory = $derived($categories.find((c) => c.id === selectedCategoryId));

	// Work-time equivalence calculation
	let workTimeEquiv = $derived(
		calculateHoursOfWork(amountInPaise, $studentProfile.hourlyWageRate || 20000)
	);

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

		try {
			if (type === 'expense') {
				await addExpense({
					walletId: selectedWalletId,
					categoryId: selectedCategoryId,
					subcategory: selectedSubcategory || null,
					amount: amountInPaise,
					date: new Date(date).toISOString(),
					note: description.trim() || null,
					valueTag: selectedValueTag
				});
			} else if (type === 'income') {
				await addIncome({
					walletId: selectedWalletId,
					amount: amountInPaise,
					date: new Date(date).toISOString(),
					source: description.trim() || 'Income',
					note: description.trim()
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
	</div>

	<!-- Amount Display with Live Student Work-Time Badge -->
	<div class="amount-hero-section">
		<div class="amount-display">
			<span class="currency">₹</span>
			<span class="value">{displayAmount}</span>
		</div>

		{#if type === 'expense' && amountNumber > 0}
			<div class="work-time-badge">
				<Clock size={13} />
				<span>Cost in Labor: <strong>{workTimeEquiv}</strong> of gig work</span>
			</div>
		{/if}
	</div>

	<!-- Mindful Value Tagging Bar (Expense only) -->
	{#if type === 'expense'}
		<div class="value-tag-selector">
			<button
				type="button"
				class="value-tag-btn tag-need"
				class:selected={selectedValueTag === 'need'}
				onclick={() => (selectedValueTag = 'need')}
			>
				<Zap size={14} />
				<span>Need</span>
			</button>
			<button
				type="button"
				class="value-tag-btn tag-want"
				class:selected={selectedValueTag === 'want'}
				onclick={() => (selectedValueTag = 'want')}
			>
				<Sparkles size={14} />
				<span>Want</span>
			</button>
			<button
				type="button"
				class="value-tag-btn tag-growth"
				class:selected={selectedValueTag === 'growth'}
				onclick={() => (selectedValueTag = 'growth')}
			>
				<GraduationCap size={14} />
				<span>Growth</span>
			</button>
		</div>
	{/if}

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
						<span>{selectedCategory.name}</span>
						<ChevronDown size={14} />
					</button>
					<button class="input-pill" onclick={() => (showSubcategoryModal = true)}>
						<span>{selectedSubcategory || 'Subcategory'}</span>
						<ChevronDown size={14} />
					</button>
				{:else}
					<button class="input-pill full" onclick={() => (showCategoryModal = true)}>
						<span>{selectedCategory?.name || 'Select Category'}</span>
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
			placeholder={type === 'income' ? 'Income source (e.g., Allowance, Freelance, Tutoring)...' : 'Add note (e.g. Swiggy treat, Notes printing)...'}
			bind:value={description}
			class="note-input"
		/>
	</div>

	<!-- Spacer -->
	<div class="spacer"></div>

	<!-- Keypad -->
	<div class="keypad-section">
		<Keypad on:press={handleKeyPress} />
		<button class="submit-btn" onclick={handleSubmit}>
			Add {type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Transfer'}
		</button>
	</div>
</div>

<!-- Wallet Selection Modal -->
{#if showWalletModal}
	<div
		class="modal-overlay"
		onclick={() => (showWalletModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showWalletModal = false)}
	>
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				<h3>Select Wallet</h3>
				<button class="close-btn" onclick={() => (showWalletModal = false)} aria-label="Close"
					><X size={20} /></button
				>
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
							<span class="check-icon"><Check size={18} /></span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Target Wallet Selection Modal -->
{#if showToWalletModal}
	<div
		class="modal-overlay"
		onclick={() => (showToWalletModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showToWalletModal = false)}
	>
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				<h3>Select Destination Wallet</h3>
				<button class="close-btn" onclick={() => (showToWalletModal = false)} aria-label="Close"
					><X size={20} /></button
				>
			</div>
			<div class="modal-list">
				{#each $wallets.filter((w) => w.id !== selectedWalletId) as wallet}
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
							<span class="check-icon"><Check size={18} /></span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Category Selection Modal -->
{#if showCategoryModal}
	<div
		class="modal-overlay"
		onclick={() => (showCategoryModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showCategoryModal = false)}
	>
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				<h3>Select Category</h3>
				<button class="close-btn" onclick={() => (showCategoryModal = false)} aria-label="Close"
					><X size={20} /></button
				>
			</div>
			<div class="modal-list category-grid">
				{#each $categories as category}
					<button
						class="modal-category-item"
						class:selected={selectedCategoryId === category.id}
						onclick={() => {
							selectedCategoryId = category.id;
							showCategoryModal = false;
						}}
					>
						<div class="cat-icon-badge" style="background: {category.color}20; color: {category.color};">
							<CategoryIcon icon={category.icon} size={22} />
						</div>
						<span class="cat-label">{category.name}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Subcategory Selection Modal -->
{#if showSubcategoryModal && selectedCategory}
	<div
		class="modal-overlay"
		onclick={() => (showSubcategoryModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showSubcategoryModal = false)}
	>
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				<h3>Select Subcategory</h3>
				<button class="close-btn" onclick={() => (showSubcategoryModal = false)} aria-label="Close"
					><X size={20} /></button
				>
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
					<span class="item-name">None</span>
					{#if selectedSubcategory === ''}
						<span class="check-icon"><Check size={18} /></span>
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
							<span class="check-icon"><Check size={18} /></span>
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
		min-height: 100vh;
		max-width: 500px;
		margin: 0 auto;
		padding: 16px 20px 24px 20px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.icon-btn {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 8px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tabs {
		display: flex;
		background: var(--bg-card);
		padding: 4px;
		border-radius: 9999px;
		border: 1px solid var(--border-color);
	}

	.tab {
		padding: 6px 14px;
		border-radius: 9999px;
		border: none;
		background: transparent;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab.active {
		background: var(--accent-primary);
		color: white;
		box-shadow: 0 4px 12px var(--accent-glow);
	}

	.amount-hero-section {
		text-align: center;
		margin: 12px 0 16px 0;
	}

	.amount-display {
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 4px;
	}

	.currency {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.value {
		font-size: 3.2rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -1px;
	}

	.work-time-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(124, 58, 237, 0.08);
		border: 1px solid rgba(124, 58, 237, 0.2);
		color: var(--accent-primary);
		padding: 4px 12px;
		border-radius: 9999px;
		font-size: 0.76rem;
		font-weight: 600;
		margin-top: 6px;
	}

	/* Value Tag Selector */
	.value-tag-selector {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-bottom: 14px;
	}

	.value-tag-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 9px;
		border-radius: 14px;
		border: 1px solid var(--border-color);
		background: var(--bg-card);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.value-tag-btn.tag-need.selected {
		background: #2563EB;
		color: white;
		border-color: #2563EB;
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
	}

	.value-tag-btn.tag-want.selected {
		background: #DB2777;
		color: white;
		border-color: #DB2777;
		box-shadow: 0 4px 12px rgba(219, 39, 119, 0.3);
	}

	.value-tag-btn.tag-growth.selected {
		background: #059669;
		color: white;
		border-color: #059669;
		box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
	}

	.input-row {
		display: flex;
		gap: 8px;
		margin-bottom: 10px;
	}

	.input-pill {
		flex: 1;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		padding: 10px 14px;
		border-radius: 14px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
	}

	.input-pill.full {
		width: 100%;
	}

	.note-input {
		width: 100%;
		padding: 12px 16px;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 14px;
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.note-input:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.spacer {
		flex: 1;
	}

	.keypad-section {
		margin-top: 10px;
	}

	.submit-btn {
		width: 100%;
		background: var(--accent-gradient);
		color: white;
		border: none;
		padding: 15px;
		border-radius: 18px;
		font-size: 1rem;
		font-weight: 800;
		cursor: pointer;
		margin-top: 12px;
		box-shadow: 0 10px 25px var(--accent-glow);
		transition: transform 0.2s;
	}

	.submit-btn:active {
		transform: scale(0.98);
	}

	/* Modals */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 999;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.modal {
		background: var(--bg-card);
		border-radius: 28px 28px 0 0;
		padding: 24px;
		width: 100%;
		max-width: 500px;
		max-height: 70vh;
		overflow-y: auto;
		border: 1px solid var(--border-color);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.modal-header h3 {
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
	}

	.modal-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.modal-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border-radius: 14px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		cursor: pointer;
		font-weight: 600;
	}

	.modal-item.selected {
		border-color: var(--accent-primary);
		background: rgba(124, 58, 237, 0.08);
	}

	.category-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}

	.modal-category-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 14px 10px;
		border-radius: 16px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		cursor: pointer;
	}

	.modal-category-item.selected {
		border-color: var(--accent-primary);
		background: rgba(124, 58, 237, 0.08);
	}

	.cat-icon-badge {
		width: 44px;
		height: 44px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cat-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-primary);
		text-align: center;
	}
</style>
