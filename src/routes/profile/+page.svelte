<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import UpdateProfile from '$lib/components/UpdateProfile.svelte';

	export let data;

	let avatar: string;
	console.log("/routes/profile/+page.svelte data: ", data);
	// Reactive statement to update avatar when data changes
	$: userProfile = data?.userProfile || '';
	$: avatar = data?.user?.user_metadata?.avatar_url || '';
</script>

{#if userProfile}
	<UpdateProfile {userProfile} {avatar} />
{:else}
	<h1>You are not logged in..</h1>
{/if}