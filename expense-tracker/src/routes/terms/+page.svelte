<script lang="ts">
	import MarketingNav from '$lib/marketing/MarketingNav.svelte';
	import MarketingFooter from '$lib/marketing/MarketingFooter.svelte';
	import '$lib/marketing/marketing.css';
</script>

<svelte:head>
	<title>Terms of Service - Axiom Student OS</title>
	<meta name="description" content="Axiom Terms of Service. Personal software utility terms, disclaimers, and open-source licensing details." />
</svelte:head>

<div class="axiom-marketing-root">
	<MarketingNav />

	<main class="legal-page-container">
		<header class="legal-header">
			<div class="draft-badge">
				<span class="draft-dot"></span>
				<span>Operational Working Draft for Institutional Review</span>
			</div>
			<h1 class="legal-title">Terms of Service</h1>
			<p class="legal-subtitle">
				Terms and conditions governing the use of the Axiom client-side personal financial intelligence system.
			</p>
			<div class="legal-meta-row">
				<span>Effective Date: October 2026</span>
				<span class="meta-sep">•</span>
				<span>Document Version: 2.4-draft</span>
			</div>
		</header>

		<article class="legal-body">
			<!-- Section 1 -->
			<section class="legal-section" id="acceptance">
				<h2 class="section-heading">1. Acceptance of Terms</h2>
				<p>
					By accessing or using the Axiom web application, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should discontinue use of the application.
				</p>
			</section>

			<!-- Section 2 -->
			<section class="legal-section" id="nature-of-software">
				<h2 class="section-heading">2. Nature of the Software Utility</h2>
				<p>
					Axiom is provided as a self-hosted, local-first software utility designed to assist university students and young adults in organizing personal cashflow, tracking allowances, and computing campus split expenses.
				</p>
				<p>
					The software executes entirely within your client browser. Axiom does not provide banking facilities, hold financial custody of funds, process money transfers, or operate as a payment intermediary. Any actual payments or transfers occur outside of Axiom through your independent banking or UPI payment providers.
				</p>
			</section>

			<!-- Section 3 -->
			<section class="legal-section" id="disclaimer">
				<h2 class="section-heading">3. Financial and Professional Advisory Disclaimer</h2>
				<p>
					Axiom is an educational and informational organization tool. It is not a registered investment advisor, certified financial planner, tax consultant, or legal counsel.
				</p>
				<p>
					Calculations presented by Axiom, including the 3-bucket macro distribution, safe-to-spend estimations, and hourly labor cost valuations, are mathematical projections based solely on parameters you supply. They should not be construed as financial advice or an assurance of future solvency.
				</p>
			</section>

			<!-- Section 4 -->
			<section class="legal-section" id="user-responsibilities">
				<h2 class="section-heading">4. Local Storage and Data Responsibilities</h2>
				<p>
					Because Axiom maintains no central servers or user accounts, you are solely responsible for managing and preserving your local device data.
				</p>
				<p>
					You acknowledge that clearing your browser cache, re-installing operating systems, or losing physical access to your device will result in the loss of stored records unless you have generated regular JSON backups using the export feature in Settings. Axiom maintainers cannot restore lost client records under any circumstances.
				</p>
			</section>

			<!-- Section 5 -->
			<section class="legal-section" id="license">
				<h2 class="section-heading">5. Intellectual Property and Open Source License</h2>
				<p>
					Axiom is released as open-source software under the standard MIT License. You are permitted to inspect, fork, modify, and self-host the source code in accordance with the terms of the applicable repository license.
				</p>
			</section>

			<!-- Section 6 -->
			<section class="legal-section" id="liability">
				<h2 class="section-heading">6. Limitation of Liability</h2>
				<p>
					To the maximum extent permitted by applicable law, Axiom and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenues, or data, arising from your access to or use of the application.
				</p>
				<p>
					The software is provided on an "as is" and "as available" basis, without warranties of any kind, whether express or implied.
				</p>
			</section>

			<!-- Section 7 -->
			<section class="legal-section" id="modifications">
				<h2 class="section-heading">7. Modifications to the Service and Terms</h2>
				<p>
					We reserve the right to revise these terms at any time. When updates occur, the updated document version and effective date will be displayed at the top of this page. Continued usage of Axiom after modifications constitutes acceptance of the amended terms.
				</p>
			</section>

			<!-- Section 8 -->
			<section class="legal-section" id="draft-notice">
				<h2 class="section-heading">8. Operational Review Status</h2>
				<p>
					This document is currently an active working draft. Certain administrative details and institutional legal requirements are pending formal counsel review. No legal commitments beyond open-source licensing are created through this document.
				</p>
			</section>
		</article>

		<div class="legal-cta-strip">
			<span class="cta-strip-text">Ready to experience local-first personal finance?</span>
			<div class="cta-strip-actions">
				<a href="/dashboard" class="primary-btn">Launch App</a>
				<a href="/privacy" class="secondary-btn">Review Privacy Policy</a>
			</div>
		</div>
	</main>

	<MarketingFooter />
</div>

<style>
	.legal-page-container {
		max-width: var(--axiom-container-narrow);
		margin: 0 auto;
		padding: 72px 24px 96px;
	}

	.legal-header {
		margin-bottom: 56px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.draft-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background-color: var(--axiom-canvas-subtle);
		border: 1px solid var(--axiom-border);
		padding: 4px 12px;
		border-radius: var(--axiom-radius-sm);
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-secondary);
		width: fit-content;
	}

	.draft-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: #b45309;
	}

	.legal-title {
		font-size: 2.75rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--axiom-text-primary);
		line-height: 1.1;
		margin: 0;
	}

	.legal-subtitle {
		font-size: 1.125rem;
		line-height: 1.5;
		color: var(--axiom-text-secondary);
		margin: 0;
	}

	.legal-meta-row {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.8125rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
		margin-top: 8px;
	}

	.meta-sep {
		color: var(--axiom-border-strong);
	}

	.legal-body {
		display: flex;
		flex-direction: column;
		gap: 48px;
	}

	.legal-section {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.section-heading {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
		letter-spacing: -0.015em;
		margin: 0;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--axiom-border);
	}

	.legal-section p {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--axiom-text-secondary);
		margin: 0;
	}

	.legal-cta-strip {
		margin-top: 64px;
		padding: 24px 28px;
		background-color: var(--axiom-canvas-subtle);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 16px;
	}

	.cta-strip-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--axiom-text-primary);
	}

	.cta-strip-actions {
		display: flex;
		gap: 10px;
	}

	.primary-btn {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #ffffff;
		text-decoration: none;
		padding: 8px 16px;
		border-radius: var(--axiom-radius-sm);
		background-color: var(--axiom-text-primary);
		transition: background-color 0.15s ease;
	}

	.primary-btn:hover {
		background-color: #333336;
	}

	.secondary-btn {
		font-size: 0.8125rem;
		color: var(--axiom-text-primary);
		text-decoration: none;
		padding: 8px 14px;
		border-radius: var(--axiom-radius-sm);
		border: 1px solid var(--axiom-border-strong);
		background-color: transparent;
		transition: background-color 0.15s ease;
	}

	.secondary-btn:hover {
		background-color: var(--axiom-surface);
	}

	@media (max-width: 640px) {
		.legal-title {
			font-size: 2rem;
		}

		.legal-page-container {
			padding: 48px 16px 64px;
		}

		.legal-cta-strip {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
