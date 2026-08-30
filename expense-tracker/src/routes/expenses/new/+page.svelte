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
		ArrowRightLeft
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

	let displayAmount = $derived(amountStr === '' ? '0' : amountStr);
	let amountNumber = $derived(parseFloat(amountStr) || 0);
	let amountInPaise = $derived(Math.round(amountNumber * 100));
	let selectedWallet = $derived($wallets.find((w) => w.id === selectedWalletId));
	let selectedToWallet = $derived($wallets.find((w) => w.id === selectedToWalletId));
	let selectedCategory = $derived($categories.find((c) => c.id === selectedCategoryId));

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

<div class="transaction-creator-page">
	<!-- Top Navigation Bar -->
	<header class="top-nav-bar">
		<button class="back-btn" onclick={() => goto('/')} aria-label="Go back to Dashboard">
			<ArrowLeft size={20} />
		</button>

		<div class="type-segment-tabs">
			<button class="segment-tab" class:active={type === 'expense'} onclick={() => (type = 'expense')}>
				Expense
			</button>
			<button class="segment-tab" class:active={type === 'income'} onclick={() => (type = 'income')}>
				Income
			</button>
			<button class="segment-tab" class:active={type === 'transfer'} onclick={() => (type = 'transfer')}>
				Transfer
			</button>
		</div>

		<div class="header-placeholder"></div>
	</header>

	<div class="creator-content">
		<!-- Hero Numeric Display -->
		<div class="hero-amount-display">
			<span class="currency-symbol">₹</span>
			<span class="amount-digits tabular">{displayAmount}</span>
		</div>

		<!-- Real-time Student Labor-Cost Badge -->
		{#if type === 'expense' && amountNumber > 0}
			<div class="labor-cost-banner">
				<Clock size={13} color="var(--accent-primary)" />
				<span>Cost in Labor: <strong class="tabular">{workTimeEquiv}</strong> of student work</span>
			</div>
		{/if}

		<!-- Mindful Value Tagging Selector (Expense only) -->
		{#if type === 'expense'}
			<div class="value-tag-selector">
				<button
					type="button"
					class="tag-btn tag-need"
					class:selected={selectedValueTag === 'need'}
					onclick={() => (selectedValueTag = 'need')}
				>
					<Zap size={14} />
					<span>Need (Essential)</span>
				</button>
				<button
					type="button"
					class="tag-btn tag-want"
					class:selected={selectedValueTag === 'want'}
					onclick={() => (selectedValueTag = 'want')}
				>
					<Sparkles size={14} />
					<span>Want (Fun)</span>
				</button>
				<button
					type="button"
					class="tag-btn tag-growth"
					class:selected={selectedValueTag === 'growth'}
					onclick={() => (selectedValueTag = 'growth')}
				>
					<GraduationCap size={14} />
					<span>Growth</span>
				</button>
			</div>
		{/if}

		<!-- Selector Pills Row -->
		{#if type === 'transfer'}
			<div class="pill-selectors-row">
				<button class="selector-pill" onclick={() => (showWalletModal = true)}>
					<CreditCard size={15} color="var(--accent-primary)" />
					<span class="pill-text">From: <strong>{selectedWallet?.name || 'Wallet'}</strong></span>
					<ChevronDown size={13} />
				</button>
				<button class="selector-pill" onclick={() => (showToWalletModal = true)}>
					<ArrowRightLeft size={15} color="var(--accent-primary)" />
					<span class="pill-text">To: <strong>{selectedToWallet?.name || 'Wallet'}</strong></span>
					<ChevronDown size={13} />
				</button>
			</div>
		{:else}
			<div class="pill-selectors-row">
				<button class="selector-pill" onclick={() => (showWalletModal = true)}>
					<CreditCard size={15} color="var(--accent-primary)" />
					<span class="pill-text">{selectedWallet?.name || 'Select Wallet'}</span>
					<ChevronDown size={13} />
				</button>

				{#if type === 'expense'}
					<button class="selector-pill" onclick={() => (showCategoryModal = true)}>
						<span class="pill-text">
							<strong>{selectedCategory?.name || 'Category'}</strong>
							{#if selectedSubcategory}
								<small>• {selectedSubcategory}</small>
							{/if}
						</span>
						<ChevronDown size={13} />
					</button>
				{/if}

				<button class="selector-pill date-pill" style="position: relative;">
					<Calendar size={15} />
					<span class="pill-text">{new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
					<ChevronDown size={13} />
					<input
						type="date"
						bind:value={date}
						style="position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;"
					/>
				</button>
			</div>
		{/if}

		<!-- Note / Description Input -->
		<div class="note-input-row">
			<input
				type="text"
				placeholder={type === 'income' ? 'Income source (e.g. Allowance, Stipend, Tutoring)...' : 'Note (e.g. Canteen chai, Book photocopy)...'}
				bind:value={description}
				class="note-field"
			/>
		</div>

		<!-- Tactile Numeric Keypad & Submit Action -->
		<div class="keypad-container">
			<Keypad on:press={handleKeyPress} />
			<button class="confirm-submit-btn" onclick={handleSubmit}>
				Confirm {type === 'expense' ? 'Expense' : type === 'income' ? 'Inflow' : 'Transfer'}
			</button>
		</div>
	</div>
</div>

<!-- Wallet Selection Bottom Sheet -->
{#if showWalletModal}
	<div
		class="modal-backdrop"
		onclick={() => (showWalletModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showWalletModal = false)}
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
				<h3>Select Wallet</h3>
				<button class="close-btn" onclick={() => (showWalletModal = false)}>✕</button>
			</div>
			<div class="sheet-options-list">
				{#each $wallets as wallet}
					<button
						class="sheet-option-item"
						class:selected={selectedWalletId === wallet.id}
						onclick={() => {
							selectedWalletId = wallet.id;
							showWalletModal = false;
						}}
					>
						<span class="wallet-name">{wallet.name}</span>
						<span class="wallet-bal tabular">{formatCurrency(wallet.balance)}</span>
						{#if selectedWalletId === wallet.id}
							<Check size={18} color="var(--accent-primary)" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- To Wallet Selection Bottom Sheet -->
{#if showToWalletModal}
	<div
		class="modal-backdrop"
		onclick={() => (showToWalletModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showToWalletModal = false)}
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
				<h3>Select Destination Wallet</h3>
				<button class="close-btn" onclick={() => (showToWalletModal = false)}>✕</button>
			</div>
			<div class="sheet-options-list">
				{#each $wallets.filter((w) => w.id !== selectedWalletId) as wallet}
					<button
						class="sheet-option-item"
						class:selected={selectedToWalletId === wallet.id}
						onclick={() => {
							selectedToWalletId = wallet.id;
							showToWalletModal = false;
						}}
					>
						<span class="wallet-name">{wallet.name}</span>
						<span class="wallet-bal tabular">{formatCurrency(wallet.balance)}</span>
						{#if selectedToWalletId === wallet.id}
							<Check size={18} color="var(--accent-primary)" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Category Selection Bottom Sheet -->
{#if showCategoryModal}
	<div
		class="modal-backdrop"
		onclick={() => (showCategoryModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showCategoryModal = false)}
	>
		<div
			class="modal-sheet category-sheet"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="sheet-top-row">
				<h3>Select Category</h3>
				<button class="close-btn" onclick={() => (showCategoryModal = false)}>✕</button>
			</div>
			<div class="categories-grid">
				{#each $categories as category}
					<button
						class="cat-tile"
						class:selected={selectedCategoryId === category.id}
						onclick={() => {
							selectedCategoryId = category.id;
							showCategoryModal = false;
							if (category.subcategories && category.subcategories.length > 0) {
								showSubcategoryModal = true;
							}
						}}
					>
						<div class="cat-icon-wrap" style="background: {category.color}20; color: {category.color};">
							<CategoryIcon icon={category.icon} size={22} />
						</div>
						<span class="cat-name">{category.name}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Subcategory Selection Bottom Sheet -->
{#if showSubcategoryModal && selectedCategory}
	<div
		class="modal-backdrop"
		onclick={() => (showSubcategoryModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showSubcategoryModal = false)}
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
				<h3>{selectedCategory.name} Subcategories</h3>
				<button class="close-btn" onclick={() => (showSubcategoryModal = false)}>✕</button>
			</div>
			<div class="sheet-options-list">
				<button
					class="sheet-option-item"
					class:selected={selectedSubcategory === ''}
					onclick={() => {
						selectedSubcategory = '';
						showSubcategoryModal = false;
					}}
				>
					<span>None (General)</span>
					{#if selectedSubcategory === ''}
						<Check size={18} color="var(--accent-primary)" />
					{/if}
				</button>
				{#each selectedCategory.subcategories as sub}
					<button
						class="sheet-option-item"
						class:selected={selectedSubcategory === sub}
						onclick={() => {
							selectedSubcategory = sub;
							showSubcategoryModal = false;
						}}
					>
						<span>{sub}</span>
						{#if selectedSubcategory === sub}
							<Check size={18} color="var(--accent-primary)" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.transaction-creator-page {
		max-width: 520px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 100px);
		min-height: calc(100dvh - 100px);
	}

	.top-nav-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.back-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-primary);
		transition: all 0.2s ease;
	}

	.back-btn:hover {
		background: var(--bg-hover);
	}

	.type-segment-tabs {
		display: flex;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		padding: 3px;
		border-radius: var(--border-radius-pill);
	}

	.segment-tab {
		padding: 0.35rem 0.85rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-secondary);
		transition: all 0.2s ease;
	}

	.segment-tab.active {
		background: var(--bg-card);
		color: var(--text-primary);
		box-shadow: var(--shadow-xs);
	}

	.header-placeholder {
		width: 40px;
	}

	.creator-content {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		flex: 1;
	}

	/* Hero Amount */
	.hero-amount-display {
		text-align: center;
		padding: 1.25rem 0 0.5rem;
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 4px;
	}

	.currency-symbol {
		font-size: 2rem;
		font-weight: 800;
		color: var(--accent-primary);
	}

	.amount-digits {
		font-size: 3.25rem;
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1;
		letter-spacing: -0.04em;
	}

	/* Labor Cost Badge */
	.labor-cost-banner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		padding: 0.35rem 0.85rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.76rem;
		color: var(--text-secondary);
		margin: 0 auto;
	}

	.labor-cost-banner strong {
		color: var(--text-primary);
	}

	/* Value Tagging Selector */
	.value-tag-selector {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}

	.tag-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 0.55rem 0.35rem;
		border-radius: var(--border-radius);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: 0.76rem;
		font-weight: 700;
		transition: all 0.2s ease;
	}

	.tag-btn.selected {
		border-width: 2px;
	}

	.tag-need.selected { background: rgba(16, 185, 129, 0.15); color: #10B981; border-color: #10B981; }
	.tag-want.selected { background: rgba(56, 189, 248, 0.15); color: #38BDF8; border-color: #38BDF8; }
	.tag-growth.selected { background: rgba(99, 102, 241, 0.15); color: #818CF8; border-color: #818CF8; }

	/* Selector Pills Row */
	.pill-selectors-row {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.selector-pill {
		flex: 1;
		min-width: 120px;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-pill);
		padding: 0.55rem 0.85rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
		font-size: 0.82rem;
		color: var(--text-primary);
		min-height: 42px;
	}

	.pill-text {
		flex: 1;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Note input */
	.note-input-row {
		width: 100%;
	}

	.note-field {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 0.85rem 1rem;
		font-size: 16px;
		color: var(--text-primary);
		min-height: 48px;
	}

	/* Keypad & Confirm */
	.keypad-container {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-top: 0.5rem;
	}

	.confirm-submit-btn {
		background: var(--accent-primary);
		color: #FFFFFF;
		font-weight: 800;
		font-size: 1rem;
		padding: 0.85rem;
		border-radius: var(--border-radius-pill);
		box-shadow: 0 4px 14px var(--accent-glow);
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		min-height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.confirm-submit-btn:hover {
		filter: brightness(1.1);
	}

	.confirm-submit-btn:active {
		transform: scale(0.97);
	}

	/* Bottom Sheets */
	.sheet-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.sheet-top-row h3 {
		font-size: 1.1rem;
		font-weight: 800;
	}

	.sheet-options-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.sheet-option-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.85rem 1rem;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius);
		font-size: 0.92rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.sheet-option-item.selected {
		border-color: var(--accent-primary);
		background: var(--bg-hover);
	}

	.categories-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.cat-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius);
		padding: 0.85rem 0.5rem;
		text-align: center;
	}

	.cat-tile.selected {
		border-color: var(--accent-primary);
	}

	.cat-icon-wrap {
		width: 42px;
		height: 42px;
		border-radius: var(--border-radius-xs);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cat-name {
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-primary);
	}
</style>
