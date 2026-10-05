<script lang="ts">
	import MarketingNav from '$lib/marketing/MarketingNav.svelte';
	import MarketingFooter from '$lib/marketing/MarketingFooter.svelte';
	import '$lib/marketing/marketing.css';
</script>

<svelte:head>
	<title>Privacy Policy - Axiom Student OS</title>
	<meta name="description" content="Axiom local-first privacy policy. All data remains in your browser IndexedDB storage without server telemetry." />
</svelte:head>

<div class="axiom-marketing-root">
	<MarketingNav />

	<main class="legal-page-container">
		<header class="legal-header">
			<div class="draft-badge">
				<span class="draft-dot"></span>
				<span>Operational Working Draft for Institutional Review</span>
			</div>
			<h1 class="legal-title">Privacy Policy</h1>
			<p class="legal-subtitle">
				Axiom is built on a strict local-first architecture. We do not operate databases, collect analytics, or transmit your financial information across the internet.
			</p>
			<div class="legal-meta-row">
				<span>Effective Date: October 2026</span>
				<span class="meta-sep">•</span>
				<span>Document Version: 2.4-draft</span>
			</div>
		</header>

		<article class="legal-body">
			<!-- Section 1 -->
			<section class="legal-section" id="architecture">
				<h2 class="section-heading">1. Architectural Foundation</h2>
				<p>
					Axiom is client-side software. When you load Axiom in a modern web browser, the application executes entirely within your local browser runtime.
					No user account registration, phone number verification, email confirmation, or cloud database connection is required to utilize any feature.
				</p>
				<p>
					Because no centralized application server receives your transactions, the developers and maintainers of Axiom possess no technical means to view, intercept, sell, aggregate, or access your financial records.
				</p>
			</section>

			<!-- Section 2 -->
			<section class="legal-section" id="storage">
				<h2 class="section-heading">2. Information Stored Locally on Your Device</h2>
				<p>
					All financial and preference information entered into Axiom is stored directly in your browser using the IndexedDB key-value storage engine (powered by the idb-keyval library). This local storage includes:
				</p>
				<ul class="legal-list">
					<li><strong>Student Profile:</strong> Monthly allowance target, allowance cycle day, campus work hourly wage, semester term designation, and target budget allocation percentages.</li>
					<li><strong>Wallets and Accounts:</strong> Wallet identifiers, custom names (such as UPI, Cash, or Bank Account), and current calculated balances stored in paise units.</li>
					<li><strong>Transaction Records:</strong> Expense and income entries, monetary values, timestamps, category tags, value classifications (Need, Want, Growth), and optional post-purchase satisfaction ratings.</li>
					<li><strong>Campus Split Tabs:</strong> Peer names, shared expense descriptions, direction of debt (receivable or payable), and settlement statuses.</li>
					<li><strong>Sinking Goals:</strong> Target titles, deadline dates, accumulated reserves, and priority rankings.</li>
				</ul>
				<p>
					This information is kept within the origin sandbox of your web browser on your specific physical device.
				</p>
			</section>

			<!-- Section 3 -->
			<section class="legal-section" id="telemetry">
				<h2 class="section-heading">3. Absence of Telemetry and Analytics</h2>
				<p>
					Axiom does not incorporate third-party analytics trackers, session replay utilities, tracking pixels, crash reporting telemetries, or behavioral metrics.
				</p>
				<p>
					Static hosting providers delivering the application bundles (such as GitHub Pages or Vercel static edge nodes) log standard HTTP server access requests (including client IP addresses and user agents) in server access logs strictly for static file delivery and DDoS mitigation. Axiom itself injects no user telemetry into these transactions.
				</p>
			</section>

			<!-- Section 4 -->
			<section class="legal-section" id="retention">
				<h2 class="section-heading">4. Data Retention and Complete Erasure</h2>
				<p>
					Data entered into Axiom persists inside your local browser storage until one of the following events occurs:
				</p>
				<ol class="legal-numbered-list">
					<li>You click the "Wipe Local Data" command in Axiom System Settings.</li>
					<li>You explicitly clear browser website data and cookies for this website origin in your browser settings.</li>
					<li>Your device operating system or browser automatically purges storage due to critical device disk pressure.</li>
				</ol>
				<p>
					Once cleared, local data cannot be recovered by Axiom developers, as no remote cloud backups exist.
				</p>
			</section>

			<!-- Section 5 -->
			<section class="legal-section" id="export">
				<h2 class="section-heading">5. Data Portability and Offline Backups</h2>
				<p>
					You retain complete ownership of your data at all times. Axiom includes an export feature in the Settings panel that compiles all stored records into a standard unencrypted JSON document.
				</p>
				<p>
					You may save this JSON file to external storage, import it into another device running Axiom, or inspect the file with any text editor.
				</p>
			</section>

			<!-- Section 6 -->
			<section class="legal-section" id="integrations">
				<h2 class="section-heading">6. External Link Protocol Schemes</h2>
				<p>
					The campus split settlement feature provides one-click generation of formatted reminder messages. When you choose to send a WhatsApp reminder, Axiom constructs a standard URI link formatted as a wa.me URL containing your pre-filled text.
				</p>
				<p>
					This action opens your local WhatsApp client or browser tab. No information is transmitted to Axiom servers during this process.
				</p>
			</section>

			<!-- Section 7 -->
			<section class="legal-section" id="legal-review">
				<h2 class="section-heading">7. Review Status and Institutional Inquiries</h2>
				<p>
					This policy is marked as a working operational draft. If you deploy Axiom across campus student organizations or academic societies, review these terms with your institutional advisors to ensure compliance with relevant local privacy guidelines.
				</p>
			</section>
		</article>

		<div class="legal-cta-strip">
			<span class="cta-strip-text">Need to inspect how your device stores records?</span>
			<div class="cta-strip-actions">
				<a href="/dashboard" class="primary-btn">Open Web App</a>
				<a href="/terms" class="secondary-btn">View Terms of Service</a>
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

	.legal-list,
	.legal-numbered-list {
		margin: 6px 0 6px 20px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		color: var(--axiom-text-secondary);
		font-size: 0.9375rem;
		line-height: 1.55;
	}

	.legal-list strong {
		color: var(--axiom-text-primary);
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
