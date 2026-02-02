<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		passwordExists,
		setPassword,
		verifyPassword,
		checkPasswordStrength
	} from '$lib/stores/auth';

	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let isSubmitting = $state(false);
	let showPassword = $state(false);

	let isCreatingPassword = $derived(!$passwordExists);

	let passwordStrength = $derived(
		isCreatingPassword && password ? checkPasswordStrength(password) : null
	);

	async function handleSubmit() {
		error = '';

		if (!password) {
			error = 'Password is required';
			return;
		}

		if (isCreatingPassword) {
			// Creating new password
			if (password.length < 6) {
				error = 'Password must be at least 6 characters';
				return;
			}

			if (password !== confirmPassword) {
				error = 'Passwords do not match';
				return;
			}
		}

		isSubmitting = true;

		try {
			if (isCreatingPassword) {
				await setPassword(password);
				goto('/');
			} else {
				const isValid = await verifyPassword(password);
				if (isValid) {
					goto('/');
				} else {
					error = 'Incorrect password';
					password = '';
				}
			}
		} catch (err) {
			console.error('Auth error:', err);
			error = 'An error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="login-page">
	<div class="login-container">
		<div class="login-card">
			<div class="login-header">
				<h1 class="app-title">Finance Tracker 🖤</h1>
				<p class="login-subtitle">
					{isCreatingPassword ? 'Create a password to secure your app' : 'Enter your password'}
				</p>
			</div>

			<!-- Warning Banner -->
			<div class="warning-banner">
				<span class="warning-icon">⚠️</span>
				<div class="warning-text">
					<strong>Important:</strong> This password locks the app interface only. Your data is stored
					unencrypted in your browser. Anyone with access to DevTools can view it.
				</div>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<div class="form-group">
					<label for="password">Password</label>
					<div class="password-input-wrapper">
						<input
							type={showPassword ? 'text' : 'password'}
							id="password"
							bind:value={password}
							placeholder="Enter password"
							autocomplete={isCreatingPassword ? 'new-password' : 'current-password'}
						/>
						<button
							type="button"
							class="toggle-password"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? '👁️' : '👁️‍🗨️'}
						</button>
					</div>

					{#if passwordStrength}
						<div class="password-strength strength-{passwordStrength.strength}">
							<div class="strength-bar">
								<div class="strength-fill"></div>
							</div>
							<span class="strength-label">{passwordStrength.message}</span>
						</div>
					{/if}
				</div>

				{#if isCreatingPassword}
					<div class="form-group">
						<label for="confirm-password">Confirm Password</label>
						<input
							type={showPassword ? 'text' : 'password'}
							id="confirm-password"
							bind:value={confirmPassword}
							placeholder="Confirm password"
							autocomplete="new-password"
						/>
					</div>
				{/if}

				{#if error}
					<div class="error-message">{error}</div>
				{/if}

				<button type="submit" class="submit-btn" disabled={isSubmitting}>
					{#if isSubmitting}
						⏳ Please wait...
					{:else if isCreatingPassword}
						🔒 Create Password
					{:else}
						🔓 Unlock
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
		padding: 1rem;
	}

	.login-container {
		width: 100%;
		max-width: 450px;
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.login-card {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 2rem;
		box-shadow: var(--shadow-lg);
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.app-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	.login-subtitle {
		color: var(--text-secondary);
		font-size: 0.95rem;
	}

	/* Warning Banner */
	.warning-banner {
		background: rgba(251, 140, 0, 0.1);
		border: 1px solid #fb8c00;
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 1.5rem;
		display: flex;
		gap: 0.75rem;
	}

	.warning-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.warning-text {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary);
	}

	.warning-text strong {
		color: var(--text-primary);
		font-weight: 600;
	}

	/* Form */
	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	input {
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.875rem;
		border-radius: var(--border-radius);
		font-size: 1rem;
		transition: all 0.2s;
	}

	input:focus {
		outline: none;
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px rgba(192, 192, 192, 0.1);
	}

	.password-input-wrapper {
		position: relative;
	}

	.password-input-wrapper input {
		padding-right: 3rem;
	}

	.toggle-password {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		font-size: 1.25rem;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.toggle-password:hover {
		opacity: 1;
	}

	/* Password Strength */
	.password-strength {
		margin-top: 0.75rem;
	}

	.strength-bar {
		height: 4px;
		background: var(--bg-secondary);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.strength-fill {
		height: 100%;
		transition:
			width 0.3s ease,
			background 0.3s ease;
		border-radius: 2px;
	}

	.password-strength.strength-weak .strength-fill {
		width: 33%;
		background: var(--danger);
	}

	.password-strength.strength-medium .strength-fill {
		width: 66%;
		background: var(--warning);
	}

	.password-strength.strength-strong .strength-fill {
		width: 100%;
		background: var(--success);
	}

	.strength-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.password-strength.strength-weak .strength-label {
		color: var(--danger);
	}

	.password-strength.strength-medium .strength-label {
		color: var(--warning);
	}

	.password-strength.strength-strong .strength-label {
		color: var(--success);
	}

	/* Error Message */
	.error-message {
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid var(--danger);
		color: var(--danger);
		padding: 0.75rem;
		border-radius: var(--border-radius);
		margin-bottom: 1rem;
		font-size: 0.875rem;
		text-align: center;
	}

	/* Submit Button */
	.submit-btn {
		width: 100%;
		background: var(--accent-primary);
		color: var(--bg-primary);
		border: none;
		padding: 1rem;
		border-radius: var(--border-radius);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.login-card {
			padding: 1.5rem;
		}

		.app-title {
			font-size: 1.75rem;
		}
	}
</style>
