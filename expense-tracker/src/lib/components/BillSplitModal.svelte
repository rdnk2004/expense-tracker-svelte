<script lang="ts">
	import { wallets, categories, addExpense, addDebt, formatCurrency } from '$lib/stores';
	import * as db from '$lib/db';
	import {
		Users,
		Plus,
		Trash2,
		X,
		Check,
		Receipt,
		CreditCard,
		Sparkles
	} from 'lucide-svelte';

	let { open = $bindable(false), onSuccess = () => {} } = $props<{
		open: boolean;
		onSuccess?: () => void;
	}>();

	let title = $state('Campus Outing / Feast');
	let totalAmountStr = $state('');
	let selectedWalletId = $state($wallets[0]?.id || '');
	let splitMethod = $state<'equal' | 'custom'>('equal');
	let youIncluded = $state(true);

	let friends = $state<Array<{ name: string; amountStr: string; upiId: string }>>([
		{ name: 'Rohan', amountStr: '', upiId: '' },
		{ name: 'Aarav', amountStr: '', upiId: '' }
	]);

	let totalAmountPaise = $derived(
		totalAmountStr ? Math.round(parseFloat(totalAmountStr) * 100) : 0
	);

	let totalPeopleCount = $derived((youIncluded ? 1 : 0) + friends.filter((f) => f.name.trim()).length);

	let equalSharePaise = $derived(
		totalPeopleCount > 0 && totalAmountPaise > 0
			? Math.round(totalAmountPaise / totalPeopleCount)
			: 0
	);

	function addFriendRow() {
		friends = [...friends, { name: '', amountStr: '', upiId: '' }];
	}

	function removeFriendRow(index: number) {
		friends = friends.filter((_, i) => i !== index);
	}

	async function handleSaveSplit() {
		if (totalAmountPaise <= 0) {
			alert('Please enter a valid bill amount');
			return;
		}

		const validFriends = friends.filter((f) => f.name.trim());
		if (validFriends.length === 0) {
			alert('Please add at least one friend to split with');
			return;
		}

		try {
			const participants = validFriends.map((f) => {
				const share =
					splitMethod === 'equal'
						? equalSharePaise
						: Math.round((parseFloat(f.amountStr) || 0) * 100);
				return {
					name: f.name.trim(),
					shareAmount: share,
					upiId: f.upiId.trim() || undefined,
					isPaid: false
				};
			});

			const yourSharePaise = youIncluded
				? totalAmountPaise - participants.reduce((sum, p) => sum + p.shareAmount, 0)
				: 0;

			const foodCategory = (await db.getCategories()).find((c) =>
				c.name.toLowerCase().includes('food')
			);

			if (youIncluded && yourSharePaise > 0) {
				await addExpense({
					walletId: selectedWalletId || $wallets[0]?.id,
					categoryId: foodCategory?.id || 'cat-food',
					subcategory: 'Group Split',
					amount: yourSharePaise,
					date: new Date().toISOString(),
					note: `${title} (My Share)`,
					valueTag: 'want'
				});
			}

			for (const p of participants) {
				await addDebt({
					person: p.name,
					amount: p.shareAmount,
					direction: 'receive',
					date: new Date().toISOString(),
					note: `${title} split share`,
					upiId: p.upiId
				});
			}

			await db.addBillSplit({
				title,
				totalAmount: totalAmountPaise,
				payerWalletId: selectedWalletId,
				payerName: 'You',
				date: new Date().toISOString(),
				participants
			});

			open = false;
			onSuccess();
		} catch (err) {
			console.error('Failed to save bill split:', err);
		}
	}
</script>

{#if open}
	<div
		class="modal-backdrop"
		onclick={() => (open = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (open = false)}
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
				<div class="title-wrap">
					<Users size={20} color="var(--accent-primary)" />
					<h3 class="modal-title">Campus Bill Splitter</h3>
				</div>
				<button class="close-btn" onclick={() => (open = false)}>✕</button>
			</div>

			<div class="modal-body-scroll">
				<!-- Title & Total Amount -->
				<div class="form-grid-two">
					<div class="field-col">
						<label for="s-title">Event / Bill Note</label>
						<input id="s-title" type="text" bind:value={title} placeholder="e.g. Canteen Feast, Swiggy" />
					</div>
					<div class="field-col">
						<label for="s-amount">Total Bill (₹)</label>
						<input id="s-amount" type="number" bind:value={totalAmountStr} placeholder="900" step="1" min="0" class="tabular" />
					</div>
				</div>

				<!-- Wallet Selection -->
				<div class="form-field-row">
					<label for="s-wallet">Paid From Wallet:</label>
					<select id="s-wallet" bind:value={selectedWalletId}>
						{#each $wallets as w}
							<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
						{/each}
					</select>
				</div>

				<!-- Split Controls -->
				<div class="method-toggle-container">
					<div class="toggle-pills">
						<button
							type="button"
							class="pill-btn"
							class:active={splitMethod === 'equal'}
							onclick={() => (splitMethod = 'equal')}
						>
							Split Equally
						</button>
						<button
							type="button"
							class="pill-btn"
							class:active={splitMethod === 'custom'}
							onclick={() => (splitMethod = 'custom')}
						>
							Custom Amounts
						</button>
					</div>

					<label class="include-me-toggle">
						<input type="checkbox" bind:checked={youIncluded} />
						<span>Include Me ({youIncluded ? 'Yes' : 'No'})</span>
					</label>
				</div>

				{#if splitMethod === 'equal' && totalAmountPaise > 0}
					<div class="equal-preview-pill">
						<span>Each share: <strong class="tabular">{formatCurrency(equalSharePaise)}</strong> ({totalPeopleCount} people)</span>
					</div>
				{/if}

				<!-- Friends List -->
				<div class="friends-box">
					<div class="friends-box-header">
						<span>Friends in this Tab</span>
						<button type="button" class="mini-add-friend" onclick={addFriendRow}>
							<Plus size={13} /> Add Person
						</button>
					</div>

					<div class="friends-list-cards">
						{#each friends as friend, index}
							<div class="friend-card-row">
								<input
									type="text"
									placeholder="Friend's Name"
									bind:value={friend.name}
									class="friend-name-input"
								/>
								{#if splitMethod === 'custom'}
									<input
										type="number"
										placeholder="₹ Amount"
										bind:value={friend.amountStr}
										class="friend-amount-input tabular"
										step="1"
									/>
								{:else}
									<div class="equal-chip tabular">{formatCurrency(equalSharePaise)}</div>
								{/if}
								<input
									type="text"
									placeholder="UPI ID (optional)"
									bind:value={friend.upiId}
									class="friend-upi-input"
								/>
								<button
									type="button"
									class="delete-friend-btn"
									onclick={() => removeFriendRow(index)}
									disabled={friends.length <= 1}
									aria-label="Remove Friend"
								>
									<Trash2 size={15} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="sheet-action-footer">
				<button class="primary-btn-full" onclick={handleSaveSplit}>
					Split & Auto-Create Tabs
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.sheet-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.title-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.modal-title {
		font-size: 1.15rem;
		font-weight: 800;
		margin: 0;
	}

	.modal-body-scroll {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		max-height: 60vh;
		max-height: 60dvh;
		overflow-y: auto;
		padding-right: 2px;
	}

	.form-grid-two {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 8px;
	}

	.field-col {
		display: flex;
		flex-direction: column;
	}

	.form-field-row {
		display: flex;
		flex-direction: column;
	}

	.method-toggle-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		background: var(--surface-2);
		padding: 6px 10px;
		border-radius: var(--border-radius);
		border: 1px solid var(--border-subtle);
	}

	.toggle-pills {
		display: flex;
		background: var(--bg-card);
		border-radius: var(--border-radius-pill);
		padding: 2px;
		border: 1px solid var(--border-subtle);
	}

	.pill-btn {
		padding: 0.35rem 0.65rem;
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-secondary);
		border-radius: var(--border-radius-pill);
	}

	.pill-btn.active {
		background: var(--accent-primary);
		color: #080C14;
	}

	.include-me-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.76rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
		margin: 0;
		text-transform: none;
		letter-spacing: normal;
	}

	.include-me-toggle input {
		width: 16px;
		height: 16px;
		min-height: auto;
	}

	.equal-preview-pill {
		background: var(--success-bg);
		border: 1px solid var(--success-border);
		color: var(--success);
		padding: 0.45rem 0.85rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.78rem;
		text-align: center;
	}

	.friends-box {
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius);
		padding: 0.85rem;
	}

	.friends-box-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.76rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
		margin-bottom: 0.65rem;
	}

	.mini-add-friend {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--accent-primary);
	}

	.friends-list-cards {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.friend-card-row {
		display: grid;
		grid-template-columns: 1fr 90px 1fr 32px;
		gap: 6px;
		align-items: center;
	}

	.friend-card-row input {
		min-height: 36px;
		padding: 0.4rem 0.65rem;
		font-size: 0.8rem;
	}

	.equal-chip {
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius-pill);
		padding: 0.4rem 0.5rem;
		font-size: 0.78rem;
		font-weight: 800;
		text-align: center;
		color: var(--text-primary);
	}

	.delete-friend-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--danger);
		background: var(--danger-bg);
	}

	.sheet-action-footer {
		margin-top: 1.15rem;
	}

	.primary-btn-full {
		width: 100%;
		background: var(--accent-primary);
		color: #080C14;
		font-weight: 800;
		font-size: 0.95rem;
		padding: 0.85rem;
		border-radius: var(--border-radius-pill);
		box-shadow: 0 4px 14px var(--accent-glow);
	}

	@media (max-width: 520px) {
		.friend-card-row {
			grid-template-columns: 1fr 1fr 32px;
		}

		.friend-upi-input {
			grid-column: span 3;
		}
	}
</style>
