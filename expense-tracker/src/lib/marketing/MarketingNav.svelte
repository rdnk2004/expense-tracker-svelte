<script lang="ts">
	import { page } from '$app/stores';

	let isMobileMenuOpen = $state(false);

	function toggleMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMenu() {
		isMobileMenuOpen = false;
	}
</script>

<header class="marketing-nav-header">
	<div class="nav-container">
		<div class="nav-brand">
			<a href="/" class="brand-link" onclick={closeMenu}>
				<span class="brand-name">Axiom</span>
				<span class="brand-badge">Student OS</span>
			</a>
		</div>

		<nav class="nav-links-desktop" aria-label="Primary Marketing Navigation">
			<a href="/#overview" class="nav-link">Overview</a>
			<a href="/#allocation" class="nav-link">3-Bucket Model</a>
			<a href="/#work-valuation" class="nav-link">Work Valuation</a>
			<a href="/#campus-splits" class="nav-link">Campus Tabs</a>
			<a href="/#architecture" class="nav-link">Architecture</a>
			<a href="/privacy" class="nav-link" class:active={$page.url.pathname === '/privacy'}>Privacy</a>
		</nav>

		<div class="nav-actions-desktop">
			<a href="/#interactive-demo" class="secondary-btn">Interactive Demo</a>
			<a href="/dashboard" class="primary-btn">
				<span>Launch App</span>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
					<path d="M2.5 6h7M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</a>
		</div>

		<!-- Mobile menu button -->
		<button
			type="button"
			class="mobile-toggle-btn"
			onclick={toggleMenu}
			aria-expanded={isMobileMenuOpen}
			aria-label="Toggle navigation menu"
		>
			{#if isMobileMenuOpen}
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
					<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
				</svg>
			{:else}
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
					<path d="M3 5.5h12M3 12.5h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
				</svg>
			{/if}
		</button>
	</div>

	<!-- Mobile dropdown menu -->
	{#if isMobileMenuOpen}
		<div class="mobile-dropdown-menu">
			<nav class="mobile-nav-list" aria-label="Mobile Navigation Links">
				<a href="/#overview" class="mobile-nav-link" onclick={closeMenu}>Overview</a>
				<a href="/#allocation" class="mobile-nav-link" onclick={closeMenu}>3-Bucket Allocation</a>
				<a href="/#work-valuation" class="mobile-nav-link" onclick={closeMenu}>Work-Valuation Engine</a>
				<a href="/#campus-splits" class="mobile-nav-link" onclick={closeMenu}>Campus Peer Tabs</a>
				<a href="/#architecture" class="mobile-nav-link" onclick={closeMenu}>Local-First Architecture</a>
				<a href="/privacy" class="mobile-nav-link" onclick={closeMenu}>Privacy Policy</a>
				<a href="/terms" class="mobile-nav-link" onclick={closeMenu}>Terms of Service</a>
			</nav>

			<div class="mobile-cta-row">
				<a href="/#interactive-demo" class="mobile-secondary-cta" onclick={closeMenu}>Try Interactive Demo</a>
				<a href="/dashboard" class="mobile-primary-cta" onclick={closeMenu}>Launch App</a>
			</div>
		</div>
	{/if}
</header>

<style>
	.marketing-nav-header {
		position: sticky;
		top: 0;
		z-index: 100;
		width: 100%;
		background-color: rgba(251, 251, 253, 0.88);
		backdrop-filter: saturate(180%) blur(20px);
		-webkit-backdrop-filter: saturate(180%) blur(20px);
		border-bottom: 1px solid var(--axiom-border);
	}

	.nav-container {
		max-width: var(--axiom-container-wide);
		margin: 0 auto;
		height: 52px;
		padding: 0 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-brand {
		display: flex;
		align-items: center;
	}

	.brand-link {
		display: flex;
		align-items: baseline;
		gap: 8px;
		text-decoration: none;
		color: var(--axiom-text-primary);
	}

	.brand-name {
		font-size: 1.125rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.brand-badge {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		font-weight: 500;
		color: var(--axiom-text-tertiary);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.nav-links-desktop {
		display: flex;
		align-items: center;
		gap: 28px;
	}

	.nav-link {
		font-size: 0.8125rem;
		color: var(--axiom-text-secondary);
		text-decoration: none;
		transition: color 0.15s ease;
		font-weight: 400;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--axiom-text-primary);
	}

	.nav-actions-desktop {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.secondary-btn {
		font-size: 0.8125rem;
		color: var(--axiom-text-primary);
		text-decoration: none;
		padding: 6px 12px;
		border-radius: var(--axiom-radius-sm);
		border: 1px solid var(--axiom-border-strong);
		background-color: transparent;
		transition: background-color 0.15s ease;
	}

	.secondary-btn:hover {
		background-color: var(--axiom-canvas-subtle);
	}

	.primary-btn {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #ffffff;
		text-decoration: none;
		padding: 6px 14px;
		border-radius: var(--axiom-radius-sm);
		background-color: var(--axiom-text-primary);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: background-color 0.15s ease;
	}

	.primary-btn:hover {
		background-color: #333336;
	}

	.mobile-toggle-btn {
		display: none;
		background: none;
		border: none;
		color: var(--axiom-text-primary);
		padding: 8px;
		cursor: pointer;
	}

	.mobile-dropdown-menu {
		display: none;
	}

	@media (max-width: 860px) {
		.nav-links-desktop,
		.nav-actions-desktop {
			display: none;
		}

		.mobile-toggle-btn {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.mobile-dropdown-menu {
			display: block;
			padding: 16px 24px 28px;
			background-color: var(--axiom-canvas);
			border-bottom: 1px solid var(--axiom-border);
		}

		.mobile-nav-list {
			display: flex;
			flex-direction: column;
			gap: 14px;
			margin-bottom: 20px;
		}

		.mobile-nav-link {
			font-size: 1rem;
			color: var(--axiom-text-primary);
			text-decoration: none;
			font-weight: 500;
			padding: 4px 0;
		}

		.mobile-cta-row {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}

		.mobile-primary-cta {
			text-align: center;
			background-color: var(--axiom-text-primary);
			color: #ffffff;
			text-decoration: none;
			padding: 12px;
			border-radius: var(--axiom-radius-sm);
			font-size: 0.875rem;
			font-weight: 500;
		}

		.mobile-secondary-cta {
			text-align: center;
			border: 1px solid var(--axiom-border-strong);
			color: var(--axiom-text-primary);
			text-decoration: none;
			padding: 11px;
			border-radius: var(--axiom-radius-sm);
			font-size: 0.875rem;
		}
	}
</style>
