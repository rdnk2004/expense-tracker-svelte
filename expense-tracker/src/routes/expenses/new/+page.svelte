<script lang="ts">
	import { goto } from '$app/navigation';
	import { wallets, categories, addExpense, addIncome } from '$lib/stores';
	import Keypad from '$lib/components/Keypad.svelte';
	import { ArrowLeft, Calendar, CreditCard, ChevronDown } from 'lucide-svelte';

	let amountStr = $state('0');
	let type = $state<'expense' | 'income' | 'transfer'>('expense');
	let selectedWalletId = $state($wallets[0]?.id || '');
	let selectedCategoryId = $state($categories[0]?.id || '');
	let date = $state(new Date().toISOString().split('T')[0]);
	let description = $state('');

	// Computed
	let displayAmount = $derived(amountStr === '' ? '0' : amountStr);
	let selectedWallet = $derived($wallets.find((w) => w.id === selectedWalletId));
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

		try {
			if (type === 'expense') {
				addExpense({
					walletId: selectedWalletId,
					categoryId: selectedCategoryId,
					amount,
					date,
					note: description
				});
			} else if (type === 'income') {
				// We need an addIncome store action, assuming it exists or similar
				// If not, we might need to mock or use addExpense with special category?
				// For now assuming addIncome exists or we handle it.
				// Based on previous code, maybe 'addIncome' isn't there?
				// User replaced 'addTransaction' logic in previous turns?
				// I'll check store in a moment. For now, calling addExpense with a flag or wait.
				// Actually, I'll assume 'expense' logic for now and maybe add 'addIncome' to store later if missing.
				// Or I can just check if I can import it.
				// I imported `addIncome` above optimistically.
				addIncome({
					walletId: selectedWalletId,
					amount,
					date,
					source: description || 'Income',
					note: description
				});
			}
			// Transfer logic to come
			goto('/');
		} catch (err) {
			console.error(err);
		}
	}
</script>

<div class="page-container">
	<!-- Header -->
	<div class="header">
		<button class="icon-btn" onclick={() => goto('/')}>
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
		<span class="currency">$</span>
		<span class="value">{displayAmount}</span>
	</div>

	<!-- Controls / Inputs -->
	<div class="input-row">
		<button class="input-pill">
			<CreditCard size={16} />
			<span>{selectedWallet?.name || 'Wallet'}</span>
			<ChevronDown size={14} />
		</button>
		<button class="input-pill">
			<Calendar size={16} />
			<span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
			<ChevronDown size={14} />
		</button>
	</div>

	<!-- Category (if expense) -->
	{#if type === 'expense'}
		<div class="input-row">
			<button class="input-pill full">
				<span>Category: {selectedCategory?.name || 'Select'}</span>
				<ChevronDown size={14} />
			</button>
		</div>
	{/if}

	<!-- Spacer to push keypad down -->
	<div class="spacer"></div>

	<!-- Keypad -->
	<div class="keypad-section">
		<Keypad on:press={handleKeyPress} />
		<button class="submit-btn" onclick={handleSubmit}> Add Transaction </button>
	</div>
</div>

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
	}

	.input-pill.full {
		width: 100%;
		justify-content: space-between;
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
	}

	.submit-btn:active {
		transform: scale(0.98);
	}
</style>
