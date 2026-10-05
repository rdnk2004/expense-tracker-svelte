<script lang="ts">
	import MarketingNav from '$lib/marketing/MarketingNav.svelte';
	import MarketingFooter from '$lib/marketing/MarketingFooter.svelte';
	import ProductViewport from '$lib/marketing/ProductViewport.svelte';
	import InteractiveDemonstration from '$lib/marketing/InteractiveDemonstration.svelte';
	import '$lib/marketing/marketing.css';
</script>

<svelte:head>
	<title>Axiom - Student Personal Finance and Capital OS</title>
	<meta
		name="description"
		content="Axiom is a local-first personal finance system for university students. 3-bucket macro budgeting, campus debt tabs, labor-hour valuation, and browser IndexedDB storage."
	/>
</svelte:head>

<div class="axiom-marketing-root">
	<MarketingNav />

	<main class="marketing-main-content">
		<!-- HERO SECTION -->
		<section class="hero-section" id="overview">
			<div class="hero-container">
				<div class="hero-eyebrow-pill">
					<span class="pill-dot"></span>
					<span>Local-First Financial Intelligence</span>
				</div>

				<h1 class="hero-headline">
					Clarity over campus cashflow, without cloud accounts or bank credentials.
				</h1>

				<p class="hero-lead">
					Axiom organizes your monthly allowance, shared hostel expenses, and daily runway directly inside your browser. All data stays in your device's local database.
				</p>

				<div class="hero-cta-group">
					<a href="/dashboard" class="hero-primary-btn">
						<span>Launch Web Application</span>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
							<path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</a>
					<a href="#interactive-demo" class="hero-secondary-btn">
						<span>Test Interactive Demonstration</span>
					</a>
				</div>

				<div class="hero-trust-strip">
					<span class="trust-item">100% Client-Side IndexedDB</span>
					<span class="trust-sep">•</span>
					<span class="trust-item">Zero Remote Telemetry</span>
					<span class="trust-sep">•</span>
					<span class="trust-item">Free and Open Source</span>
				</div>

				<!-- Product visual hero showcase -->
				<div class="hero-visual-wrapper">
					<ProductViewport />
				</div>
			</div>
		</section>

		<!-- SECTION 2: 3-BUCKET MACRO MODEL -->
		<section class="content-section subtle-bg" id="allocation">
			<div class="section-container">
				<div class="section-header-block">
					<span class="section-eyebrow">Capital Allocation</span>
					<h2 class="section-heading">Budgeting designed for student cashflow.</h2>
					<p class="section-lead">
						Traditional monthly budgets fail when allowances arrive on irregular schedules. Axiom divides your funds into three purposeful pools to prevent mid-semester deficits.
					</p>
				</div>

				<div class="split-editorial-layout">
					<!-- Left: Principles Explanation -->
					<div class="editorial-col">
						<div class="bucket-definition-item">
							<div class="bucket-header-line">
								<span class="bucket-tag survival">Survival: 50%</span>
								<span class="bucket-rule">Non-negotiable essentials</span>
							</div>
							<h3 class="bucket-title">Protect your base living requirements</h3>
							<p class="bucket-desc">
								Mess subscriptions, hostel maintenance fees, required textbooks, prescription medicines, and basic campus transit. These payments are committed early in the cycle and cannot be spent on impulse purchases.
							</p>
						</div>

						<div class="bucket-definition-item">
							<div class="bucket-header-line">
								<span class="bucket-tag discretionary">Discretionary: 30%</span>
								<span class="bucket-rule">Flexible daily allowance</span>
							</div>
							<h3 class="bucket-title">Controlled through daily safe-to-spend caps</h3>
							<p class="bucket-desc">
								Canteen breaks, evening chai, late night takeout, and streaming services. Axiom recalculates your safe daily spending allowance each morning, adjusting automatically when you splurge.
							</p>
						</div>

						<div class="bucket-definition-item">
							<div class="bucket-header-line">
								<span class="bucket-tag future">Future: 20%</span>
								<span class="bucket-rule">Predictable sinking funds</span>
							</div>
							<h3 class="bucket-title">Accumulate for semester trips and hardware</h3>
							<p class="bucket-desc">
								Post-exam travel, campus fest registrations, laptop repairs, and rental security deposits. Sinking funds grow steadily without eating into food or study allowances.
							</p>
						</div>
					</div>

					<!-- Right: Real Allocation Table -->
					<div class="editorial-col">
						<div class="data-card">
							<div class="data-card-header">
								<span class="card-caption">Sample Monthly Split</span>
								<span class="mono-meta">₹12,000 Standard Allowance</span>
							</div>

							<div class="allocation-table">
								<div class="table-row header">
									<span>Category Target</span>
									<span>Monthly Pool</span>
									<span class="text-right">Allocation</span>
								</div>

								<div class="table-row">
									<div class="row-label-group">
										<span class="row-name">Mess, Rent & Books</span>
										<span class="row-sub">Survival Pool</span>
									</div>
									<span class="mono-val">₹6,000.00</span>
									<span class="mono-percent text-right">50%</span>
								</div>

								<div class="table-row highlight">
									<div class="row-label-group">
										<span class="row-name">Canteen, Cafes & Outings</span>
										<span class="row-sub">Discretionary Pool</span>
									</div>
									<span class="mono-val accent">₹3,600.00</span>
									<span class="mono-percent text-right">30%</span>
								</div>

								<div class="table-row">
									<div class="row-label-group">
										<span class="row-name">Semester Trip & Tech Fund</span>
										<span class="row-sub">Future Reserves</span>
									</div>
									<span class="mono-val">₹2,400.00</span>
									<span class="mono-percent text-right">20%</span>
								</div>
							</div>

							<div class="data-card-footer">
								<div class="stat-pair">
									<span class="stat-caption">Daily Safe-to-Spend Cap</span>
									<span class="stat-figure">₹120 / day</span>
								</div>
								<span class="stat-footnote">Calculated across 30 active academic days</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- SECTION 3: WORK VALUATION ENGINE -->
		<section class="content-section" id="work-valuation">
			<div class="section-container">
				<div class="section-header-block">
					<span class="section-eyebrow">Behavioral Spending Insight</span>
					<h2 class="section-heading">Translate monetary costs into hours of campus labor.</h2>
					<p class="section-lead">
						When money represents hours spent tutoring or coding freelance projects, purchasing choices shift. Axiom calculates the labor cost of every spend entry in real time.
					</p>
				</div>

				<div class="work-valuation-grid">
					<!-- Concept Card 1 -->
					<div class="concept-card">
						<span class="concept-eyebrow">Hourly Attribution</span>
						<h3 class="concept-title">Ground prices in personal effort</h3>
						<p class="concept-desc">
							Set your hourly earnings from campus tutoring, internships, or graphic design. Axiom converts every expense entry into the precise hours of physical work required to fund it.
						</p>
						<div class="metric-pill-demo">
							<span class="mono-pill-label">Tutoring Rate: ₹250 / hr</span>
							<span class="mono-pill-result">₹500 purchase = 2.0 hrs work</span>
						</div>
					</div>

					<!-- Concept Card 2 -->
					<div class="concept-card">
						<span class="concept-eyebrow">Regret Auditing</span>
						<h3 class="concept-title">Identify recurring impulse regret</h3>
						<p class="concept-desc">
							Review past transactions and tag them as Worth It, Neutral, or Regretted. Over time, Axiom highlights which spending categories deliver low satisfaction relative to their labor cost.
						</p>
						<div class="regret-example-strip">
							<span class="regret-pill active">Late Night Takeout: Regretted</span>
							<span class="regret-pill">Textbook: Worth It</span>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- SECTION 4: CAMPUS SPLIT TABS -->
		<section class="content-section subtle-bg" id="campus-splits">
			<div class="section-container">
				<div class="section-header-block">
					<span class="section-eyebrow">Peer Finance</span>
					<h2 class="section-heading">Settle hostel tabs without awkward reminders.</h2>
					<p class="section-lead">
						Keep running balances with roommates and lab partners for shared groceries, WiFi bills, and project components. Format polite WhatsApp reminders with one click.
					</p>
				</div>

				<div class="splits-feature-layout">
					<div class="feature-info-col">
						<div class="feature-point">
							<h3 class="point-title">Running peer balances</h3>
							<p class="point-desc">
								Track mutual debts over multiple weeks without demanding immediate payments for small sums. Settle net amounts when convenient.
							</p>
						</div>

						<div class="feature-point">
							<h3 class="point-title">Zero payment commissions</h3>
							<p class="point-desc">
								Axiom does not act as a payment gateway. Friends settle directly using their existing UPI apps, retaining full privacy and zero transaction cuts.
							</p>
						</div>

						<div class="feature-point">
							<h3 class="point-title">One-tap plain text templates</h3>
							<p class="point-desc">
								Generate structured WhatsApp messages containing the exact expense breakdown, individual share, and total amount.
							</p>
						</div>
					</div>

					<div class="feature-visual-col">
						<div class="tabs-display-card">
							<div class="tabs-card-titlebar">
								<span class="card-caption">Campus Split Ledger</span>
								<span class="mono-meta">Active Roommates</span>
							</div>

							<div class="peer-row">
								<div class="peer-details">
									<span class="peer-name">Rohan Sharma</span>
									<span class="peer-desc">Hostel 4 Room WiFi Share</span>
								</div>
								<div class="peer-status-block">
									<span class="peer-amount receivable">+₹350.00</span>
									<span class="peer-action-label">Receivable</span>
								</div>
							</div>

							<div class="peer-row">
								<div class="peer-details">
									<span class="peer-name">Priya Patel</span>
									<span class="peer-desc">Electronics Kit Components</span>
								</div>
								<div class="peer-status-block">
									<span class="peer-amount receivable">+₹520.00</span>
									<span class="peer-action-label">Receivable</span>
								</div>
							</div>

							<div class="peer-row">
								<div class="peer-details">
									<span class="peer-name">Hostel Mess Committee</span>
									<span class="peer-desc">Weekend Farewell Feast</span>
								</div>
								<div class="peer-status-block">
									<span class="peer-amount payable">-₹400.00</span>
									<span class="peer-action-label">Payable</span>
								</div>
							</div>

							<div class="tabs-card-footer">
								<span class="net-summary">Net Position: +₹470.00 to collect</span>
								<a href="/dashboard" class="compact-cta-link">
									Manage Tabs in App
									<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
										<path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- SECTION 5: LOCAL-FIRST PRIVACY ARCHITECTURE -->
		<section class="content-section" id="architecture">
			<div class="section-container">
				<div class="section-header-block">
					<span class="section-eyebrow">Local-First Engineering</span>
					<h2 class="section-heading">Your personal financial data never leaves your device.</h2>
					<p class="section-lead">
						Axiom runs without central servers, user tracking databases, or bank screen scrapers. Here is how your data is handled.
					</p>
				</div>

				<div class="architecture-matrix">
					<div class="matrix-cell">
						<span class="matrix-num">01</span>
						<h3 class="matrix-title">IndexedDB Storage</h3>
						<p class="matrix-desc">
							Transactions, wallet balances, and budget caps are written directly to your browser's IndexedDB database. The app works fully offline without network dependencies.
						</p>
					</div>

					<div class="matrix-cell">
						<span class="matrix-num">02</span>
						<h3 class="matrix-title">Zero Bank Account Access</h3>
						<p class="matrix-desc">
							Axiom never requests your net banking passwords, SMS permissions, or debit card pins. You log expenses directly or use the rapid keypad interface.
						</p>
					</div>

					<div class="matrix-cell">
						<span class="matrix-num">03</span>
						<h3 class="matrix-title">Device Security PIN</h3>
						<p class="matrix-desc">
							A 4-digit client-side key protects the dashboard against casual inspection when you leave your laptop open in study halls or hostel common rooms.
						</p>
					</div>

					<div class="matrix-cell">
						<span class="matrix-num">04</span>
						<h3 class="matrix-title">Complete JSON Export</h3>
						<p class="matrix-desc">
							Export your entire transaction ledger and category preferences into an open JSON file with one click. Retain total ownership of your historical records.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- SECTION 6: INTERACTIVE DEMONSTRATION SANDBOX -->
		<section class="content-section subtle-bg" id="demo">
			<div class="section-container">
				<InteractiveDemonstration />
			</div>
		</section>

		<!-- SECTION 7: DIRECT LAUNCH & TRANSPARENT PRICING -->
		<section class="content-section launch-strip-section">
			<div class="section-container">
				<div class="launch-card">
					<span class="launch-eyebrow">Open Source Personal Software</span>
					<h2 class="launch-title">Free for every university student.</h2>
					<p class="launch-desc">
						Axiom does not feature subscription tiers, paywalls, premium feature gates, or embedded promotions.
					</p>
					<div class="launch-action-row">
						<a href="/dashboard" class="hero-primary-btn">
							<span>Launch Axiom in Browser</span>
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
								<path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</a>
						<a
							href="https://github.com/rdnk2004/expense-tracker-svelte"
							target="_blank"
							rel="noopener noreferrer"
							class="hero-secondary-btn"
						>
							<span>Inspect Code on GitHub</span>
						</a>
					</div>
					<span class="launch-meta">Requires no installation. Runs on desktop and mobile web browsers.</span>
				</div>
			</div>
		</section>
	</main>

	<MarketingFooter />
</div>

<style>
	.marketing-main-content {
		width: 100%;
	}

	/* Hero Section */
	.hero-section {
		padding: 96px 24px 80px;
		text-align: center;
		background-color: var(--axiom-canvas);
	}

	.hero-container {
		max-width: var(--axiom-container-width);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hero-eyebrow-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background-color: var(--axiom-canvas-subtle);
		border: 1px solid var(--axiom-border);
		padding: 5px 14px;
		border-radius: var(--axiom-radius-sm);
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-secondary);
		margin-bottom: 24px;
	}

	.pill-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: var(--axiom-accent);
	}

	.hero-headline {
		font-size: 3.5rem;
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.08;
		color: var(--axiom-text-primary);
		max-width: 880px;
		margin: 0 0 24px;
	}

	.hero-lead {
		font-size: 1.25rem;
		line-height: 1.5;
		color: var(--axiom-text-secondary);
		max-width: 680px;
		margin: 0 0 36px;
	}

	.hero-cta-group {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 32px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.hero-primary-btn {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #ffffff;
		background-color: var(--axiom-text-primary);
		text-decoration: none;
		padding: 12px 24px;
		border-radius: var(--axiom-radius-sm);
		display: inline-flex;
		align-items: center;
		gap: 8px;
		transition: background-color 0.15s ease;
	}

	.hero-primary-btn:hover {
		background-color: #333336;
	}

	.hero-secondary-btn {
		font-size: 0.9375rem;
		color: var(--axiom-text-primary);
		text-decoration: none;
		padding: 12px 22px;
		border-radius: var(--axiom-radius-sm);
		border: 1px solid var(--axiom-border-strong);
		background-color: transparent;
		transition: background-color 0.15s ease;
	}

	.hero-secondary-btn:hover {
		background-color: var(--axiom-canvas-subtle);
	}

	.hero-trust-strip {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
		margin-bottom: 56px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.trust-sep {
		color: var(--axiom-border-strong);
	}

	.hero-visual-wrapper {
		width: 100%;
		margin-top: 16px;
	}

	/* Generic Section Styles */
	.content-section {
		padding: 96px 24px;
		background-color: var(--axiom-canvas);
	}

	.content-section.subtle-bg {
		background-color: var(--axiom-canvas-subtle);
	}

	.section-container {
		max-width: var(--axiom-container-width);
		margin: 0 auto;
	}

	.section-header-block {
		max-width: 680px;
		margin-bottom: 56px;
	}

	.section-eyebrow {
		display: block;
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		font-weight: 600;
		color: var(--axiom-accent);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 10px;
	}

	.section-heading {
		font-size: 2.25rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.15;
		color: var(--axiom-text-primary);
		margin: 0 0 16px;
	}

	.section-lead {
		font-size: 1.0625rem;
		line-height: 1.5;
		color: var(--axiom-text-secondary);
		margin: 0;
	}

	/* Split Editorial Layout for 3-Bucket Section */
	.split-editorial-layout {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: 48px;
		align-items: flex-start;
	}

	.editorial-col {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.bucket-definition-item {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-lg);
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.bucket-header-line {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.bucket-tag {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		font-weight: 600;
		padding: 3px 8px;
		border-radius: var(--axiom-radius-sm);
		text-transform: uppercase;
	}

	.bucket-tag.survival {
		background-color: #1d1d1f;
		color: #ffffff;
	}

	.bucket-tag.discretionary {
		background-color: var(--axiom-accent-subtle);
		color: var(--axiom-accent);
		border: 1px solid var(--axiom-accent-border);
	}

	.bucket-tag.future {
		background-color: #f0f0f2;
		color: #515154;
	}

	.bucket-rule {
		font-size: 0.75rem;
		color: var(--axiom-text-tertiary);
	}

	.bucket-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
		margin: 0;
	}

	.bucket-desc {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--axiom-text-secondary);
		margin: 0;
	}

	/* Right: Allocation Data Card */
	.data-card {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-lg);
		overflow: hidden;
	}

	.data-card-header {
		padding: 18px 24px;
		background-color: var(--axiom-canvas-subtle);
		border-bottom: 1px solid var(--axiom-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.card-caption {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
		letter-spacing: 0.04em;
	}

	.mono-meta {
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-secondary);
		font-weight: 500;
	}

	.allocation-table {
		display: flex;
		flex-direction: column;
	}

	.table-row {
		padding: 16px 24px;
		display: grid;
		grid-template-columns: 2fr 1.2fr 0.8fr;
		align-items: center;
		border-bottom: 1px solid var(--axiom-border-subtle);
		font-size: 0.875rem;
	}

	.table-row.header {
		background-color: var(--axiom-canvas);
		font-size: 0.6875rem;
		text-transform: uppercase;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
		font-weight: 600;
		padding: 10px 24px;
	}

	.table-row.highlight {
		background-color: var(--axiom-accent-subtle);
	}

	.row-label-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.row-name {
		font-weight: 500;
		color: var(--axiom-text-primary);
	}

	.row-sub {
		font-size: 0.75rem;
		color: var(--axiom-text-tertiary);
	}

	.mono-val {
		font-family: var(--axiom-font-mono);
		font-weight: 600;
		color: var(--axiom-text-primary);
	}

	.mono-val.accent {
		color: var(--axiom-accent);
	}

	.mono-percent {
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-secondary);
	}

	.text-right {
		text-align: right;
	}

	.data-card-footer {
		padding: 20px 24px;
		background-color: var(--axiom-canvas-subtle);
		border-top: 1px solid var(--axiom-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
	}

	.stat-pair {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-caption {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		text-transform: uppercase;
		color: var(--axiom-text-tertiary);
	}

	.stat-figure {
		font-size: 1.125rem;
		font-weight: 600;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-primary);
	}

	.stat-footnote {
		font-size: 0.75rem;
		color: var(--axiom-text-muted);
	}

	/* Section 3: Work Valuation Grid */
	.work-valuation-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 28px;
	}

	.concept-card {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-lg);
		padding: 32px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.concept-eyebrow {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		text-transform: uppercase;
		color: var(--axiom-accent);
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.concept-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
		letter-spacing: -0.015em;
		margin: 0;
	}

	.concept-desc {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--axiom-text-secondary);
		margin: 0;
	}

	.metric-pill-demo {
		margin-top: 16px;
		padding: 12px 16px;
		background-color: var(--axiom-canvas-subtle);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-sm);
		display: flex;
		justify-content: space-between;
		font-size: 0.8125rem;
		font-family: var(--axiom-font-mono);
		flex-wrap: wrap;
		gap: 8px;
	}

	.mono-pill-label {
		color: var(--axiom-text-secondary);
	}

	.mono-pill-result {
		color: var(--axiom-accent);
		font-weight: 600;
	}

	.regret-example-strip {
		margin-top: 16px;
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.regret-pill {
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		padding: 6px 12px;
		border-radius: var(--axiom-radius-sm);
		background-color: var(--axiom-canvas-subtle);
		border: 1px solid var(--axiom-border);
		color: var(--axiom-text-secondary);
	}

	.regret-pill.active {
		border-color: #d97706;
		background-color: #fffbeb;
		color: #92400e;
		font-weight: 500;
	}

	/* Section 4: Campus Splits Layout */
	.splits-feature-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 40px;
		align-items: center;
	}

	.feature-info-col {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.feature-point {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.point-title {
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
		margin: 0;
	}

	.point-desc {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--axiom-text-secondary);
		margin: 0;
	}

	.tabs-display-card {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-lg);
		overflow: hidden;
	}

	.tabs-card-titlebar {
		padding: 16px 20px;
		background-color: var(--axiom-canvas-subtle);
		border-bottom: 1px solid var(--axiom-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.peer-row {
		padding: 14px 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--axiom-border-subtle);
	}

	.peer-row:last-child {
		border-bottom: none;
	}

	.peer-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.peer-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--axiom-text-primary);
	}

	.peer-desc {
		font-size: 0.75rem;
		color: var(--axiom-text-tertiary);
	}

	.peer-status-block {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}

	.peer-amount {
		font-size: 0.875rem;
		font-weight: 600;
		font-family: var(--axiom-font-mono);
	}

	.peer-amount.receivable {
		color: #047857;
	}

	.peer-amount.payable {
		color: #be123c;
	}

	.peer-action-label {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
	}

	.tabs-card-footer {
		padding: 14px 20px;
		background-color: var(--axiom-canvas-subtle);
		border-top: 1px solid var(--axiom-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.net-summary {
		font-size: 0.8125rem;
		font-family: var(--axiom-font-mono);
		font-weight: 600;
		color: var(--axiom-text-primary);
	}

	.compact-cta-link {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--axiom-accent);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.compact-cta-link:hover {
		text-decoration: underline;
	}

	/* Section 5: Architecture Matrix */
	.architecture-matrix {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24px;
	}

	.matrix-cell {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-lg);
		padding: 28px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.matrix-num {
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		font-weight: 600;
		color: var(--axiom-accent);
	}

	.matrix-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
		letter-spacing: -0.015em;
		margin: 0;
	}

	.matrix-desc {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--axiom-text-secondary);
		margin: 0;
	}

	/* Section 7: Launch Strip */
	.launch-strip-section {
		padding: 96px 24px 112px;
	}

	.launch-card {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-xl);
		padding: 64px 32px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.launch-eyebrow {
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		font-weight: 600;
		color: var(--axiom-accent);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 12px;
	}

	.launch-title {
		font-size: 2.5rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--axiom-text-primary);
		margin: 0 0 16px;
		max-width: 600px;
	}

	.launch-desc {
		font-size: 1.0625rem;
		line-height: 1.5;
		color: var(--axiom-text-secondary);
		margin: 0 0 32px;
		max-width: 540px;
	}

	.launch-action-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.launch-meta {
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-muted);
	}

	/* Responsive Breakpoints */
	@media (max-width: 860px) {
		.hero-headline {
			font-size: 2.25rem;
		}

		.hero-lead {
			font-size: 1rem;
		}

		.section-heading {
			font-size: 1.75rem;
		}

		.split-editorial-layout,
		.work-valuation-grid,
		.splits-feature-layout,
		.architecture-matrix {
			grid-template-columns: 1fr;
			gap: 24px;
		}

		.table-row {
			grid-template-columns: 1.5fr 1fr 0.6fr;
		}

		.hero-section,
		.content-section,
		.launch-strip-section {
			padding: 64px 16px;
		}

		.launch-card {
			padding: 40px 20px;
		}

		.launch-title {
			font-size: 1.875rem;
		}
	}
</style>
