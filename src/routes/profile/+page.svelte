<script lang="ts">
	import type { PageData } from './$types';
	import UpdateProfile from '$lib/components/UpdateProfile.svelte';
	
	export let data: PageData;
	
	$: profile = data.profile;
	$: console.log(profile);
	$: avatar = data?.user?.user_metadata?.avatar_url || '';
	</script>
	
	{#if profile}
	  <UpdateProfile { profile} {avatar} />
	{:else}
	  <p>Loading profile...</p>
	{/if}