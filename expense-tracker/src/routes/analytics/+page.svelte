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
		Receipt
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
			<span class="campus-sub">Behavioral Economics</span>
			<h1 class="page-title">Spending Intelligence & ROI</h1>
		</div>
	</div>

	<!-- Proactive Analyst Pulse -->
	<AnalystNudgeCard />

	<!-- 1. Emotional ROI & Regret Audit Matrix -->
	<div class="card emotional-card">
		<div class="card-top-line">
			<div class="card-title-wrap">
				<Flame size={18} color="#F43F5E" />
				<h3 class="card-heading">Post-Purchase Emotional ROI</h3>
			</div>
			<span class="matrix-tag">Satisfaction Audit</span>
		</div>

		<p class="card-desc">
			FinTech isn't about extreme frugality—it's maximizing the joy and utility extracted per rupee spent.
		</p>

		<!-- Progress Bar -->
		<div class="satisfaction-bar">
			<div class="sat-fill worth" style="width: {emotional.worthItPercent}%;"></div>
			<div class="sat-fill neutral" style="width: {emotional.neutralPercent}%;"></div>
			<div class="sat-fill regret" style="width: {emotional.regretPercent}%;"></div>
		</div>

		<div class="satisfaction-grid">
			<div class="sat-box worth-box">
				<div class="sat-top">
					<span class="emoji">🔥</span>
					<span class="sat-pct tabular">{emotional.worthItPercent}%</span>
				</div>
				<span class="sat-val tabular">{formatCurrency(emotional.worthItTotal)}</span>
				<span class="sat-label">Worth It (High Joy)</span>
			</div>

			<div class="sat-box neutral-box">
				<div class="sat-top">
					<span class="emoji">😐</span>
					<span class="sat-pct tabular">{emotional.neutralPercent}%</span>
				</div>
				<span class="sat-val tabular">{formatCurrency(emotional.neutralTotal)}</span>
				<span class="sat-label">Neutral (Essentials)</span>
			</div>

			<div class="sat-box regret-box">
				<div class="sat-top">
					<span class="emoji">💀</span>
					<span class="sat-pct tabular">{emotional.regretPercent}%</span>
				</div>
				<span class="sat-val tabular">{formatCurrency(emotional.regrettedTotal)}</span>
				<span class="sat-label">Regretted (Impulse)</span>
			</div>
		</div>

		<!-- Regret Labor Callout -->
		{#if emotional.regrettedTotal > 0}
			<div class="regret-callout-banner">
				<span>💸 <strong>Cost of Regret:</strong> {formatCurrency(emotional.regrettedTotal)} spent on regretted impulse purchases = <strong class="tabular">{emotional.wastedLaborTime}</strong> of student work wasted for zero fulfillment.</span>
			</div>
		{/if}
	</div>

	<!-- 2. Mindful Value Split (Need vs Want vs Growth) -->
	<div class="card value-split-card">
		<div class="card-top-line">
			<div class="card-title-wrap">
				<Zap size={18} color="var(--accent-primary)" />
				<h3 class="card-heading">Mindful Value Split</h3>
			</div>
			<span class="matrix-tag">Monthly Flow</span>
		</div>

		<div class="value-track">
			<div class="v-seg need-seg" style="width: {valueTags.needPercent}%;"></div>
			<div class="v-seg want-seg" style="width: {valueTags.wantPercent}%;"></div>
			<div class="v-seg growth-seg" style="width: {valueTags.growthPercent}%;"></div>
		</div>

		<div class="value-tags-grid">
			<div class="vtag-box need-box">
				<div class="vtag-header">
					<Zap size={14} color="#10B981" />
					<span>⚡ Needs (50% goal)</span>
				</div>
				<div class="vtag-amount tabular">{formatCurrency(valueTags.needTotal)}</div>
				<span class="vtag-pct tabular">{valueTags.needPercent}% of spend</span>
			</div>

			<div class="vtag-box want-box">
				<div class="vtag-header">
					<Sparkles size={14} color="#38BDF8" />
					<span>✨ Wants (30% goal)</span>
				</div>
				<div class="vtag-amount tabular">{formatCurrency(valueTags.wantTotal)}</div>
				<span class="vtag-pct tabular">{valueTags.wantPercent}% of spend</span>
			</div>

			<div class="vtag-box growth-box">
				<div class="vtag-header">
					<GraduationCap size={14} color="#818CF8" />
					<span>📚 Growth (20% goal)</span>
				</div>
				<div class="vtag-amount tabular">{formatCurrency(valueTags.growthTotal)}</div>
				<span class="vtag-pct tabular">{valueTags.growthPercent}% of spend</span>
			</div>
		</div>
	</div>

	<!-- 3. Campus Labor Time-Valuation Converter -->
	<div class="card labor-card">
		<div class="card-top-line">
			<div class="card-title-wrap">
				<Clock size={18} color="var(--accent-primary)" />
				<h3 class="card-heading">Campus Labor Time-Valuation</h3>
			</div>
			<span class="wage-rate-pill tabular">₹{workVal.hourlyWageRate / 100}/hr gig wage</span>
		</div>

		<p class="card-desc">
			Every purchase costs finite life energy. Here is how your time converts this month:
		</p>

		<div class="labor-boxes-grid">
			<div class="labor-stat-card spent">
				<span class="l-stat-lbl">Labor Consumed in Spend</span>
				<div class="l-stat-val tabular">{workVal.laborHoursSpent}</div>
				<span class="l-stat-sub tabular">{formatCurrency($analytics.totalExpenseAmount)} outlaid</span>
			</div>

			<div class="labor-stat-card saved">
				<span class="l-stat-lbl">Labor Preserved in Goals</span>
				<div class="l-stat-val text-success tabular">{workVal.laborHoursSaved}</div>
				<span class="l-stat-sub tabular">{formatCurrency(workVal.totalSavedInGoals)} stashed</span>
			</div>
		</div>
	</div>

	<!-- 4. Category Outflows Ranking -->
	<div class="card categories-card">
		<h3 class="card-heading">Category Spending Ranks ({categories.length})</h3>

		<div class="categories-list">
			{#each categories as cat (cat.id)}
				<div class="cat-rank-row">
					<div class="cat-rank-left">
						<div class="cat-icon-frame" style="background: {cat.color}20; color: {cat.color};">
							<CategoryIcon icon={cat.icon} size={18} />
						</div>
						<div>
							<strong class="cat-name">{cat.name}</strong>
							<span class="cat-count-sub">{cat.count} transactions</span>
						</div>
					</div>

					<div class="cat-rank-right">
						<div class="cat-total-amt tabular">{formatCurrency(cat.total)}</div>
						<div class="cat-pct-track">
							<div class="cat-pct-bar" style="width: {cat.percent}%; background: {cat.color};"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.analytics-page {
		max-width: 680px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
	}

	.page-header {
		margin-bottom: 1.15rem;
	}

	.campus-sub {
		display: block;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent-primary);
		margin-bottom: 2px;
	}

	.page-title {
		font-size: 1.45rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		margin: 0;
		line-height: 1.2;
	}

	@media (min-width: 768px) {
		.page-title {
			font-size: 1.65rem;
		}
	}

	/* Card Base Layout */
	.card-top-line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
		gap: 6px;
	}

	.card-title-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.card-heading {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.matrix-tag {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		padding: 2px 8px;
		border-radius: var(--border-radius-pill);
		color: var(--text-secondary);
	}

	.card-desc {
		font-size: 0.84rem;
		color: var(--text-secondary);
		margin-bottom: 0.85rem;
		line-height: 1.45;
	}

	/* Emotional ROI */
	.emotional-card {
		padding: 1.15rem;
	}

	.satisfaction-bar {
		display: flex;
		height: 9px;
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		background: var(--surface-2);
		margin-bottom: 0.85rem;
		border: 1px solid var(--border-color);
	}

	.sat-fill.worth { background: #F59E0B; }
	.sat-fill.neutral { background: var(--surface-3); }
	.sat-fill.regret { background: #F43F5E; }

	.satisfaction-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
		margin-bottom: 0.85rem;
	}

	.sat-box {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-sm);
		padding: 0.75rem 0.4rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sat-top {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 4px;
		margin-bottom: 2px;
	}

	.sat-pct {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--text-muted);
	}

	.sat-val {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.sat-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.regret-callout-banner {
		background: rgba(244, 63, 94, 0.1);
		border: 1px solid rgba(244, 63, 94, 0.3);
		border-radius: var(--border-radius);
		padding: 0.75rem 1rem;
		font-size: 0.84rem;
		color: var(--text-primary);
		line-height: 1.45;
	}

	/* Value Split */
	.value-split-card {
		padding: 1.15rem;
	}

	.value-track {
		display: flex;
		height: 9px;
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		background: var(--surface-2);
		margin-bottom: 0.85rem;
		border: 1px solid var(--border-color);
	}

	.v-seg.need-seg { background: #10B981; }
	.v-seg.want-seg { background: #38BDF8; }
	.v-seg.growth-seg { background: #818CF8; }

	.value-tags-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}

	.vtag-box {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-sm);
		padding: 0.75rem 0.4rem;
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-align: center;
	}

	.vtag-header {
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.vtag-amount {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.vtag-pct {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	/* Labor Card */
	.labor-card {
		padding: 1.15rem;
	}

	.wage-rate-pill {
		font-size: 0.75rem;
		font-weight: 800;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		padding: 3px 9px;
		border-radius: var(--border-radius-pill);
		color: var(--accent-primary);
	}

	.labor-boxes-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.labor-stat-card {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 0.85rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.l-stat-lbl {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.l-stat-val {
		font-size: 1.45rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.l-stat-sub {
		font-size: 0.76rem;
		color: var(--text-secondary);
		font-weight: 600;
	}

	/* Categories Card */
	.categories-card {
		padding: 1.15rem;
	}

	.categories-list {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		margin-top: 0.85rem;
	}

	.cat-rank-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.85rem 1rem;
		border-radius: var(--border-radius);
		background: var(--surface-2);
		border: 1px solid var(--border-color);
	}

	.cat-rank-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.cat-icon-frame {
		width: 42px;
		height: 42px;
		border-radius: var(--border-radius-xs);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.cat-name {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-primary);
		display: block;
	}

	.cat-count-sub {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.cat-rank-right {
		text-align: right;
		min-width: 90px;
	}

	.cat-total-amt {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.cat-pct-track {
		height: 4px;
		background: var(--surface-3);
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		margin-top: 4px;
	}

	.cat-pct-bar {
		height: 100%;
		border-radius: var(--border-radius-pill);
	}
</style>
