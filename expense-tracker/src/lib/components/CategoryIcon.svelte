<script lang="ts">
	import {
		Utensils,
		Gamepad2,
		Home,
		Car,
		ShoppingBag,
		Package,
		Briefcase,
		HeartPulse,
		GraduationCap,
		Plane,
		Zap,
		Coffee,
		Music,
		Smartphone,
		Wifi,
		Dumbbell,
		CreditCard
	} from 'lucide-svelte';

	// Props
	interface Props {
		icon: string;
		size?: number;
		class?: string;
	}

	let { icon, size = 24, class: className = '' }: Props = $props();

	// Map icon names to components
	const iconMap: Record<string, any> = {
		Utensils: Utensils,
		Gamepad2: Gamepad2,
		Home: Home,
		Car: Car,
		ShoppingBag: ShoppingBag,
		Package: Package,
		Briefcase: Briefcase,
		HeartPulse: HeartPulse,
		GraduationCap: GraduationCap,
		Plane: Plane,
		Zap: Zap,
		Coffee: Coffee,
		Music: Music,
		Smartphone: Smartphone,
		Wifi: Wifi,
		Dumbbell: Dumbbell,
		CreditCard: CreditCard
	};

	let IconComponent = $derived(iconMap[icon] || Package);
</script>

<IconComponent {size} class={className} />
