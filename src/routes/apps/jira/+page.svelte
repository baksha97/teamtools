<script lang="ts">
    import { onMount } from 'svelte';
    import JiraIssue from '$lib/components/JiraIssue.svelte';

    export let data;
    let issue: any = null;
    let error: string | null = null;

    onMount(async () => {
        try {
            const encodedPath = encodeURIComponent('49e93ba6-3eac-4bbc-9f21-6f5d0b4e4682/rest/api/3/issue/SAM-3?expand=names,renderedFields&fieldsByKeys=true');
            const response = await fetch(`/api/jira?path=${encodedPath}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            issue = await response.json();
        } catch (e) {
            error = 'Failed to load Jira issue';
            console.error(error, e);
        }
    });
</script>

{#if error}
    <p class="error">{error}</p>
{:else if issue}
    <JiraIssue {issue} />
{:else}
    <p>Loading...</p>
{/if}