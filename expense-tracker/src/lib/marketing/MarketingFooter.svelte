<footer class="marketing-footer">
	<div class="footer-container">
		<!-- Disclaimer & Operational Notice -->
		<div class="footer-disclaimer">
			<p>
				Axiom is an open source personal financial tracking tool engineered for university students.
				It does not provide certified financial, accounting, tax, or investment advice.
				All records remain stored exclusively on your device within browser IndexedDB storage.
				No remote database is maintained, and no personal telemetry is collected.
				Legal documents linked below represent active operational drafts for review.
			</p>
		</div>

		<div class="footer-divider"></div>

		<!-- Columns Directory -->
		<div class="footer-grid">
			<div class="footer-col">
				<span class="footer-col-title">Product System</span>
				<ul class="footer-links-list">
					<li><a href="/#overview">System Overview</a></li>
					<li><a href="/#allocation">3-Bucket Macro Model</a></li>
					<li><a href="/#work-valuation">Work-Valuation Engine</a></li>
					<li><a href="/#campus-splits">Campus Split Tabs</a></li>
					<li><a href="/#architecture">Local Storage Architecture</a></li>
					<li><a href="/dashboard">Launch Web Application</a></li>
				</ul>
			</div>

			<div class="footer-col">
				<span class="footer-col-title">Data & Legal</span>
				<ul class="footer-links-list">
					<li><a href="/privacy">Privacy Policy</a></li>
					<li><a href="/terms">Terms of Service</a></li>
					<li><a href="/privacy#storage">IndexedDB Retention</a></li>
					<li><a href="/privacy#export">JSON Data Portability</a></li>
					<li><a href="/terms#disclaimer">Advisory Disclaimer</a></li>
				</ul>
			</div>

			<div class="footer-col">
				<span class="footer-col-title">Engineering</span>
				<ul class="footer-links-list">
					<li><a href="https://github.com/rdnk2004/expense-tracker-svelte" target="_blank" rel="noopener noreferrer">Source Repository</a></li>
					<li><a href="https://github.com/rdnk2004/expense-tracker-svelte/issues" target="_blank" rel="noopener noreferrer">Issue Tracker</a></li>
					<li><a href="https://github.com/rdnk2004/expense-tracker-svelte/blob/main/README.md" target="_blank" rel="noopener noreferrer">Project Readme</a></li>
					<li><a href="/dashboard">Direct App Entry</a></li>
				</ul>
			</div>
		</div>

		<div class="footer-divider"></div>

		<!-- Bottom Copyright & Direct Legal Meta -->
		<div class="footer-bottom-row">
			<div class="copyright-text">
				<span>Copyright 2026 Axiom. Client-side personal utility.</span>
			</div>
			<div class="legal-inline-links">
				<a href="/privacy">Privacy Policy</a>
				<span class="bullet-sep">/</span>
				<a href="/terms">Terms of Service</a>
				<span class="bullet-sep">/</span>
				<a href="/dashboard">Web App</a>
			</div>
		</div>
	</div>
</footer>

<style>
	.marketing-footer {
		background-color: var(--axiom-canvas-subtle);
		border-top: 1px solid var(--axiom-border);
		color: var(--axiom-text-tertiary);
		font-size: 0.75rem;
		line-height: 1.5;
		padding: 48px 24px 56px;
	}

	.footer-container {
		max-width: var(--axiom-container-width);
		margin: 0 auto;
	}

	.footer-disclaimer p {
		margin: 0 0 24px;
		color: var(--axiom-text-muted);
		font-size: 0.75rem;
		line-height: 1.55;
	}

	.footer-divider {
		height: 1px;
		background-color: var(--axiom-border);
		margin: 20px 0;
	}

	.footer-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 32px;
		padding: 8px 0;
	}

	.footer-col-title {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
		letter-spacing: -0.01em;
		margin-bottom: 12px;
	}

	.footer-links-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.footer-links-list a {
		color: var(--axiom-text-secondary);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.footer-links-list a:hover {
		color: var(--axiom-text-primary);
	}

	.footer-bottom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 8px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.copyright-text {
		color: var(--axiom-text-muted);
	}

	.legal-inline-links {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.legal-inline-links a {
		color: var(--axiom-text-secondary);
		text-decoration: none;
	}

	.legal-inline-links a:hover {
		color: var(--axiom-text-primary);
	}

	.bullet-sep {
		color: var(--axiom-border-strong);
	}

	@media (max-width: 720px) {
		.footer-grid {
			grid-template-columns: 1fr;
			gap: 24px;
		}

		.footer-bottom-row {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
