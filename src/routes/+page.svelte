<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import UpdateProfile from '$lib/components/UpdateProfile.svelte';

	export let data;
	let avatar: string;

	// Reactive statement to update avatar when data changes
	$: session = data?.session;
</script>

{#if session}
	You are logged in!
{:else}
	<Hero />
{/if}
