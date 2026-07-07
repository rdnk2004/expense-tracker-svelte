<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { ArrowRight, Lock } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let pin = $state('');
	let error = $state(false);
	let isShake = $state(false);
	let mounted = $state(false);

	onMount(() => {
		// Trigger entrance animations
		setTimeout(() => {
			mounted = true;
		}, 100);
	});

	function handleLogin() {
		if (auth.login(pin)) {
			goto('/');
		} else {
			error = true;
			isShake = true;
			setTimeout(() => {
				isShake = false;
				pin = '';
			}, 500);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleLogin();
		}
		if (error) error = false;
	}
</script>

<div class="login-page">
	<div class="login-container" class:shake={isShake}>
		<div class="brand-container" class:visible={mounted}>
			<div class="brand-text">
				<span class="rdnk">RDNK</span>
				<span class="slash">/</span>
				<span class="axiom-wrapper">
					<span class="axiom">Axiom</span>
				</span>
			</div>
			<div class="brand-subtitle">Financial Operating System</div>
		</div>

		<div class="input-container" class:visible={mounted}>
			<div class="input-wrapper" class:error>
				<Lock size={18} class="input-icon" />
				<input
					type="password"
					bind:value={pin}
					onkeydown={handleKeydown}
					placeholder="Enter Access Key"
					maxlength="4"
					autocomplete="off"
				/>
			</div>

			<button class="login-btn" onclick={handleLogin}>
				<span>Enter System</span>
				<ArrowRight size={18} />
			</button>
		</div>

		{#if error}
			<div class="error-msg">Access Denied</div>
		{/if}
	</div>
</div>

<style>
	.login-page {
		height: 100vh;
		width: 100vw;
		background: radial-gradient(circle at center, #12072b 0%, #03000a 100%);
		display: flex;
		justify-content: center;
		align-items: center;
		color: #fff;
		font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
		overflow: hidden;
	}

	.login-container {
		width: 100%;
		max-width: 400px;
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3rem;
		background: rgba(15, 10, 42, 0.4);
		border: 1px solid rgba(168, 85, 247, 0.1);
		border-radius: 32px;
		backdrop-filter: blur(20px);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	/* Brand Animation */
	.brand-container {
		text-align: center;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.brand-container.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.brand-text {
		font-size: 3rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		letter-spacing: -2px;
	}

	.rdnk {
		color: #fff;
		text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
	}

	.slash {
		color: rgba(168, 85, 247, 0.4);
		font-weight: 300;
		margin: 0 0.2rem;
	}

	.axiom-wrapper {
		overflow: hidden;
		display: flex;
	}

	.axiom {
		color: transparent;
		background: linear-gradient(90deg, #ffffff 0%, #a855f7 100%);
		-webkit-background-clip: text;
		background-clip: text;
		transform: translateX(-100%);
		opacity: 0;
		transition: all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s; /* Delayed Animation */
	}

	.brand-container.visible .axiom {
		transform: translateX(0);
		opacity: 1;
	}

	.brand-subtitle {
		margin-top: 0.5rem;
		color: rgba(168, 85, 247, 0.6);
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 2px;
		font-weight: 500;
	}

	/* Input Section */
	.input-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		opacity: 0;
		transform: translateY(10px);
		transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;
	}

	.input-container.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.input-wrapper {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(168, 85, 247, 0.2);
		border-radius: 16px;
		padding: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.2s;
	}

	.input-wrapper:focus-within {
		border-color: #a855f7;
		background: rgba(168, 85, 247, 0.08);
		box-shadow: 0 0 15px rgba(168, 85, 247, 0.25);
	}

	.input-wrapper.error {
		border-color: #ff3366;
		background: rgba(255, 51, 102, 0.1);
		animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
	}

	@keyframes shake {
		10%,
		90% {
			transform: translate3d(-1px, 0, 0);
		}
		20%,
		80% {
			transform: translate3d(2px, 0, 0);
		}
		30%,
		50%,
		70% {
			transform: translate3d(-4px, 0, 0);
		}
		40%,
		60% {
			transform: translate3d(4px, 0, 0);
		}
	}

	.input-icon {
		color: rgba(168, 85, 247, 0.5);
	}

	input {
		background: transparent;
		border: none;
		color: #fff;
		font-size: 1rem;
		width: 100%;
		outline: none;
		text-align: center;
		letter-spacing: 4px;
		font-family: inherit;
	}

	::placeholder {
		letter-spacing: normal;
		color: rgba(168, 85, 247, 0.4);
		text-transform: uppercase;
		font-size: 0.75rem;
	}

	.login-btn {
		background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
		color: #fff;
		border: none;
		padding: 1rem;
		border-radius: 16px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.2s;
		box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35);
	}

	.login-btn:hover {
		background: linear-gradient(135deg, #8b5cf6 0%, #f472b6 100%);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(124, 58, 237, 0.5);
	}

	.login-btn:active {
		transform: scale(0.98);
	}

	.error-msg {
		color: #ff3366;
		font-size: 0.875rem;
		text-align: center;
		animation: fadeIn 0.2s;
		font-weight: 500;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
