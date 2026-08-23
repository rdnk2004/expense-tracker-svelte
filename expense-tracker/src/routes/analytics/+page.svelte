<script lang="ts">
	import {
		analytics,
		studentProfile,
		formatCurrency
	} from '$lib/stores';
	import {
		TrendingUp,
		Flame,
		Zap,
		Sparkles,
		GraduationCap,
		Clock,
		Smile,
		Meh,
		Frown,
		PiggyBank,
		AlertTriangle,
		ArrowUpRight,
		Receipt,
		Compass
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import AnalystNudgeCard from '$lib/components/AnalystNudgeCard.svelte';

	let emotional = $derived($analytics.emotionalRoi);
	let valueTags = $derived($analytics.valueTags);
	let workVal = $derived($analytics.workValuation);
	let categories = $derived($analytics.categoryBreakdown);
</script>

<div class="analytics-page">
	<div class="page-header">
		<div>
			<span class="eyebrow">Behavioral Economics</span>
			<h1 class="page-title">Spending Intelligence</h1>
		</div>
	</div>

	<!-- Analyst Nudge Pulse -->
	<AnalystNudgeCard />

	<!-- 1. Emotional ROI Matrix (Worth It vs Regret) -->
	<div class="card emotional-roi-card">
		<div class="card-header">
			<div class="header-title-wrap">
				<Flame size={20} class="text-accent" />
				<h2 class="card-title">Emotional ROI & Regret Audit</h2>
			</div>
			<span class="pill-badge">Post-Purchase Audit</span>
		</div>

		<p class="section-desc">
			Financial health isn't about hoarding every rupee—it's maximizing the happiness & growth generated per rupee spent.
		</p>

		<!-- Progress Bar for Satisfaction Breakdown -->
		<div class="satisfaction-bar">
			<div class="sat-fill worth" style="width: {emotional.worthItPercent}%;"></div>
			<div class="sat-fill neutral" style="width: {emotional.neutralPercent}%;"></div>
			<div class="sat-fill regret" style="width: {emotional.regretPercent}%;"></div>
		</div>

		<div class="satisfaction-grid">
			<div class="sat-box worth-box">
				<div class="sat-top">
					<span class="emoji">🔥</span>
					<span class="sat-pct">{emotional.worthItPercent}%</span>
				</div>
				<span class="sat-val">{formatCurrency(emotional.worthItTotal)}</span>
				<span class="sat-label">Worth It (Joy & Utility)</span>
			</div>

			<div class="sat-box neutral-box">
				<div class="sat-top">
					<span class="emoji">😐</span>
					<span class="sat-pct">{emotional.neutralPercent}%</span>
				</div>
				<span class="sat-val">{formatCurrency(emotional.neutralTotal)}</span>
				<span class="sat-label">Neutral (Essentials)</span>
			</div>

			<div class="sat-box regret-box">
				<div class="sat-top">
					<span class="emoji">💀</span>
					<span class="sat-pct">{emotional.regretPercent}%</span>
				</div>
				<span class="sat-val">{formatCurrency(emotional.regrettedTotal)}</span>
				<span class="sat-label">Regretted (Impulse)</span>
			</div>
		</div>

		<!-- Regret Labor Callout -->
		{#if emotional.regrettedTotal > 0}
			<div class="regret-labor-alert">
				<AlertTriangle size={18} class="alert-icon" />
				<div>
					<strong>Cost of Regret:</strong> You spent {formatCurrency(emotional.regrettedTotal)} on regretted expenses.
					That is equivalent to <strong>{emotional.wastedLaborTime}</strong> of campus labor traded for zero fulfillment.
				</div>
			</div>
		{/if}
	</div>

	<!-- 2. Needs vs Wants vs Growth Macro Distribution -->
	<div class="card value-tags-card">
		<div class="card-header">
			<div class="header-title-wrap">
				<Zap size={20} class="text-accent" />
				<h2 class="card-title">Mindful Value Split</h2>
			</div>
			<span class="pill-badge">Monthly Flow</span>
		</div>

		<div class="macro-split-track">
			<div class="split-seg need-seg" style="width: {valueTags.needPercent}%;"></div>
			<div class="split-seg want-seg" style="width: {valueTags.wantPercent}%;"></div>
			<div class="split-seg growth-seg" style="width: {valueTags.growthPercent}%;"></div>
		</div>

		<div class="value-tags-grid">
			<div class="vtag-item need-tag">
				<div class="vtag-header">
					<Zap size={15} />
					<span>Needs (50% target)</span>
				</div>
				<div class="vtag-amount">{formatCurrency(valueTags.needTotal)}</div>
				<span class="vtag-pct">{valueTags.needPercent}% of spend</span>
			</div>

			<div class="vtag-item want-tag">
				<div class="vtag-header">
					<Sparkles size={15} />
					<span>Wants (30% target)</span>
				</div>
				<div class="vtag-amount">{formatCurrency(valueTags.wantTotal)}</div>
				<span class="vtag-pct">{valueTags.wantPercent}% of spend</span>
			</div>

			<div class="vtag-item growth-tag">
				<div class="vtag-header">
					<GraduationCap size={15} />
					<span>Growth (20% target)</span>
				</div>
				<div class="vtag-amount">{formatCurrency(valueTags.growthTotal)}</div>
				<span class="vtag-pct">{valueTags.growthPercent}% of spend</span>
			</div>
		</div>
	</div>

	<!-- 3. Gig Labor Time-Valuation Converter -->
	<div class="card labor-valuation-card">
		<div class="card-header">
			<div class="header-title-wrap">
				<Clock size={20} class="text-accent" />
				<h2 class="card-title">Campus Labor Time-Valuation</h2>
			</div>
			<span class="wage-rate-pill">₹{workVal.hourlyWageRate / 100}/hr rate</span>
		</div>

		<p class="section-desc">
			Every purchase costs life energy. Here is how your time converts this month:
		</p>

		<div class="labor-stats-row">
			<div class="labor-box spent">
				<span class="labor-label">Labor Consumed in Spend</span>
				<div class="labor-value">{workVal.laborHoursSpent}</div>
				<span class="labor-sub">{formatCurrency($analytics.totalExpenseAmount)} spent</span>
			</div>

			<div class="labor-box saved">
				<span class="labor-label">Labor Preserved in Goals</span>
				<div class="labor-value text-success">{workVal.laborHoursSaved}</div>
				<span class="labor-sub">{formatCurrency(workVal.totalSavedInGoals)} stashed</span>
			</div>
		</div>
	</div>

	<!-- 4. Category Spending Breakdown -->
	<div class="card category-breakdown-card">
		<h2 class="card-title">Category Outflows ({categories.length})</h2>

		<div class="cat-list-stack">
			{#each categories as cat (cat.id)}
				<div class="cat-row-item">
					<div class="cat-row-left">
						<div class="cat-icon-wrap" style="background: {cat.color}20; color: {cat.color};">
							<CategoryIcon icon={cat.icon} size={18} />
						</div>
						<div>
							<div class="cat-name">{cat.name}</div>
							<div class="cat-count">{cat.count} transactions</div>
						</div>
					</div>

					<div class="cat-row-right">
						<div class="cat-amount">{formatCurrency(cat.total)}</div>
						<div class="cat-pct-bar-wrap">
							<div class="cat-pct-fill" style="width: {cat.percent}%; background: {cat.color};"></div>
						</div>
					</div>
				</div>
			{:else}
				<div class="empty-cat">No expenses recorded for this month yet.</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.analytics-page {
		max-width: 620px;
		margin: 0 auto;
		padding: 0 16px 120px 16px;
		animation: fadeIn 0.4s ease-out;
	}

	.page-header {
		margin-bottom: 20px;
		padding-top: 8px;
	}

	.eyebrow {
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--accent-primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		display: block;
		margin-bottom: 2px;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.5px;
	}

	.card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 24px;
		padding: 20px;
		margin-bottom: 20px;
		box-shadow: var(--shadow-sm);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.header-title-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.card-title {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.pill-badge {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 3px 8px;
		border-radius: 9999px;
		background: var(--bg-primary);
		color: var(--text-muted);
	}

	.section-desc {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin-bottom: 16px;
		line-height: 1.4;
	}

	/* Satisfaction Bar */
	.satisfaction-bar {
		display: flex;
		height: 10px;
		border-radius: 9999px;
		background: var(--bg-primary);
		overflow: hidden;
		margin-bottom: 14px;
	}

	.sat-fill.worth { background: #F59E0B; }
	.sat-fill.neutral { background: var(--accent-primary); }
	.sat-fill.regret { background: #FF3366; }

	.satisfaction-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-bottom: 14px;
	}

	.sat-box {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		padding: 12px 10px;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sat-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.sat-pct {
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.sat-val {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-top: 4px;
	}

	.sat-label {
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	.regret-labor-alert {
		background: rgba(255, 51, 102, 0.08);
		border: 1px solid rgba(255, 51, 102, 0.2);
		border-radius: 14px;
		padding: 12px;
		display: flex;
		gap: 10px;
		align-items: flex-start;
		font-size: 0.78rem;
		color: var(--text-primary);
		line-height: 1.4;
	}

	:global(.alert-icon) {
		color: #FF3366;
		flex-shrink: 0;
		margin-top: 2px;
	}

	/* Macro Split */
	.macro-split-track {
		display: flex;
		height: 10px;
		border-radius: 9999px;
		background: var(--bg-primary);
		overflow: hidden;
		margin-bottom: 14px;
	}

	.split-seg.need-seg { background: #2563EB; }
	.split-seg.want-seg { background: #DB2777; }
	.split-seg.growth-seg { background: #059669; }

	.value-tags-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.vtag-item {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		padding: 12px 10px;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.vtag-header {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.68rem;
		font-weight: 700;
	}

	.need-tag .vtag-header { color: #2563EB; }
	.want-tag .vtag-header { color: #DB2777; }
	.growth-tag .vtag-header { color: #059669; }

	.vtag-amount {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-top: 4px;
	}

	.vtag-pct {
		font-size: 0.68rem;
		color: var(--text-muted);
	}

	/* Labor Valuation */
	.wage-rate-pill {
		background: rgba(124, 58, 237, 0.1);
		color: var(--accent-primary);
		padding: 4px 10px;
		border-radius: 9999px;
		font-size: 0.72rem;
		font-weight: 700;
	}

	.labor-stats-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.labor-box {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		padding: 14px;
		border-radius: 16px;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.labor-label {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.labor-value {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.labor-sub {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	/* Category Stack */
	.cat-list-stack {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 14px;
	}

	.cat-row-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 16px;
	}

	.cat-row-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.cat-icon-wrap {
		width: 36px;
		height: 36px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cat-name {
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.cat-count {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.cat-row-right {
		text-align: right;
		width: 110px;
	}

	.cat-amount {
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.cat-pct-bar-wrap {
		height: 4px;
		background: var(--border-color);
		border-radius: 9999px;
		overflow: hidden;
	}

	.cat-pct-fill {
		height: 100%;
		border-radius: 9999px;
	}

	.empty-cat {
		text-align: center;
		padding: 20px;
		color: var(--text-muted);
		font-size: 0.82rem;
	}
</style>
