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
		if (typeof navigator !== 'undefined' && navigator.vibrate) {
			try {
				navigator.vibrate(10);
			} catch (e) {
				// Ignore non-supported vibration
			}
		}
		dispatch('press', key.value);
	}
</script>

<div class="keypad-grid" role="group" aria-label="Numeric Keypad">
	{#each keys as key}
		<button
			type="button"
			class="key-btn"
			onclick={() => handlePress(key)}
			aria-label={key.label === 'backspace' ? 'Backspace' : key.label}
		>
			{#if key.icon}
				<key.icon size={22} />
			{:else}
				<span class="key-label tabular">{key.label}</span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.keypad-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		width: 100%;
		max-width: 360px;
		margin: 0 auto;
	}

	.key-btn {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.45rem;
		font-weight: 700;
		color: var(--text-primary);
		transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s ease, border-color 0.15s ease;
		user-select: none;
		-webkit-user-select: none;
	}

	.key-btn:hover {
		background: var(--bg-hover);
		border-color: var(--border-medium);
	}

	.key-btn:active {
		transform: scale(0.935);
		background: var(--surface-3);
		border-color: var(--accent-primary);
	}

	.key-label {
		line-height: 1;
	}
</style>
