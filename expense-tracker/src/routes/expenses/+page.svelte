<script lang="ts">
	import {
		expenses,
		transfers,
		categories,
		wallets,
		formatCurrency,
		formatDate
	} from '$lib/stores';
	import {
		Receipt,
		ArrowRightLeft,
		ArrowDownLeft,
		ArrowUpRight,
		Search,
		Filter
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';

	let activeSegment = $state<'all' | 'expense' | 'income' | 'transfer'>('all');
	let searchQuery = $state('');

	// Merge and process transactions
	let allTransactions = $derived.by(() => {
		const expenseItems = $expenses.map((e) => ({
			...e,
			type: e.categoryId === 'income' ? 'income' : 'expense',
			displayName: e.note || (e.categoryId === 'income' ? 'Income' : 'Expense'),
			walletName: $wallets.find((w) => w.id === e.walletId)?.name
		}));

		const transferItems = $transfers.map((t) => ({
			...t,
			type: 'transfer',
			categoryId: 'transfer',
			displayName: t.note || 'Transfer',
			walletName: `${$wallets.find((w) => w.id === t.fromWalletId)?.name} -> ${$wallets.find((w) => w.id === t.toWalletId)?.name}`
		}));

		// @ts-ignore - Merging types loosely for display
		return [...expenseItems, ...transferItems].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);
	});

	let filteredTransactions = $derived(
		allTransactions.filter((t) => {
			const matchesSegment = activeSegment === 'all' || t.type === activeSegment;
			const matchesSearch =
				searchQuery === '' ||
				t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.amount.toString().includes(searchQuery);
			return matchesSegment && matchesSearch;
		})
	);

	function getCategoryById(id: string) {
		return $categories.find((c) => c.id === id);
	}
</script>

<div class="page-container">
	<div class="header-section">
		<h1 class="page-title">Transactions</h1>

		<!-- Search Bar -->
		<div class="search-bar">
			<Search size={18} class="search-icon" />
			<input type="text" placeholder="Search transactions..." bind:value={searchQuery} />
		</div>

		<!-- Segment Control -->
		<div class="segment-control">
			<button
				class="segment-btn"
				class:active={activeSegment === 'all'}
				onclick={() => (activeSegment = 'all')}
			>
				All
			</button>
			<button
				class="segment-btn"
				class:active={activeSegment === 'expense'}
				onclick={() => (activeSegment = 'expense')}
			>
				Expense
			</button>
			<button
				class="segment-btn"
				class:active={activeSegment === 'income'}
				onclick={() => (activeSegment = 'income')}
			>
				Income
			</button>
			<button
				class="segment-btn"
				class:active={activeSegment === 'transfer'}
				onclick={() => (activeSegment = 'transfer')}
			>
				Transfer
			</button>
		</div>
	</div>

	<div class="transactions-list">
		{#each filteredTransactions as transaction (transaction.id)}
			{@const isExpense = transaction.type === 'expense'}
			{@const isIncome = transaction.type === 'income'}
			{@const isTransfer = transaction.type === 'transfer'}
			{@const category = getCategoryById(transaction.categoryId)}

			<div class="transaction-card">
				<div class="icon-wrapper" class:income={isIncome} class:transfer={isTransfer}>
					{#if isTransfer}
						<ArrowRightLeft size={20} />
					{:else if isIncome}
						<ArrowDownLeft size={20} />
					{:else}
						<CategoryIcon icon={category?.icon || ''} size={20} />
					{/if}
				</div>

				<div class="details">
					<div class="title">
						{#if isTransfer}
							Transfer
						{:else}
							{category?.name || (isIncome ? 'Income' : 'Unknown')}
						{/if}
					</div>
					<div class="subtitle">
						{transaction.displayName} • {formatDate(transaction.date)}
					</div>
				</div>

				<div class="amount" class:positive={isIncome} class:neutral={isTransfer}>
					{isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<p>No transactions found</p>
			</div>
		{/each}
	</div>
</div>

<style>
	.page-container {
		padding-bottom: 100px;
		animation: fadeIn 0.4s ease-out;
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

	.header-section {
		margin-bottom: 24px;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 800;
		margin-bottom: 16px;
		padding-left: 4px;
	}

	.search-bar {
		position: relative;
		margin-bottom: 16px;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-secondary);
	}

	.search-bar input {
		width: 100%;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		padding: 12px 12px 12px 40px;
		border-radius: 16px;
		font-size: 0.95rem;
		color: var(--text-primary);
		transition: all 0.2s;
	}

	.search-bar input:focus {
		outline: none;
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
	}

	.segment-control {
		display: flex;
		background: var(--bg-hover);
		padding: 4px;
		border-radius: 16px;
		overflow-x: auto;
	}

	.segment-btn {
		flex: 1;
		padding: 8px;
		text-align: center;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.segment-btn.active {
		background: var(--bg-card);
		color: var(--text-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		font-weight: 600;
	}

	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.transaction-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 20px;
		padding: 16px;
		display: flex;
		align-items: center;
		gap: 16px;
		transition: transform 0.2s;
	}

	.transaction-card:active {
		transform: scale(0.98);
	}

	.icon-wrapper {
		width: 44px;
		height: 44px;
		border-radius: 14px;
		background: var(--bg-hover);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
	}

	.icon-wrapper.income {
		background: rgba(16, 185, 129, 0.1);
		color: var(--success);
	}

	.icon-wrapper.transfer {
		background: rgba(79, 70, 229, 0.1);
		color: var(--accent-primary);
	}

	.details {
		flex: 1;
		overflow: hidden;
	}

	.title {
		font-weight: 600;
		font-size: 0.95rem;
		margin-bottom: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.subtitle {
		font-size: 0.8rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.amount {
		font-weight: 700;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.amount.positive {
		color: var(--success);
	}

	.amount.neutral {
		color: var(--accent-primary);
	}

	.empty-state {
		text-align: center;
		padding: 40px;
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>
