<script lang="ts">
	import { Delete } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const keys = [
		{ label: '1', value: '1' },
		{ label: '2', value: '2' },
		{ label: '3', value: '3' },
		{ label: '4', value: '4' },
		{ label: '5', value: '5' },
		{ label: '6', value: '6' },
		{ label: '7', value: '7' },
		{ label: '8', value: '8' },
		{ label: '9', value: '9' },
		{ label: '.', value: '.' },
		{ label: '0', value: '0' },
		{ label: 'backspace', value: 'backspace', icon: Delete }
	];

	function handlePress(key: { value: string }) {
		dispatch('press', key.value);
	}
</script>

<div class="keypad-grid">
	{#each keys as key}
		<button class="key-btn" onclick={() => handlePress(key)}>
			{#if key.icon}
				<key.icon size={24} />
			{:else}
				{key.label}
			{/if}
		</button>
	{/each}
</div>

<style>
	.keypad-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		padding: 0 16px;
	}

	.key-btn {
		background: var(--bg-card);
		border: 1px solid var(--border-color); /* Subtle border */
		border-radius: 16px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		transition: all 0.1s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
	}

	.key-btn:active {
		background: var(--bg-hover);
		transform: scale(0.95);
	}

	/* Dark mode tweak */
	:global([data-theme='dark']) .key-btn {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.05);
	}
</style>
