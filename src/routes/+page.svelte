<script lang="ts">
	import { page } from '$app/stores';
	import Hero from '$lib/components/Hero.svelte';
	import Dashboard from '$lib/components/Dashboard.svelte';

	export let data;

	// // Reactive statement to update avatar when data changes
	$: session = data?.session;

	let fullName = "";
	$: fullName = data.user?.user_metadata.full_name;
	$: avatar = data.user?.user_metadata?.avatar_url;
	$: console.log(session)
</script>

{#if session}
	<Dashboard fullName={fullName} avatar={avatar}/>
{:else}
	<Hero />
{/if}
