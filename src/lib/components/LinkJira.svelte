<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { 
        PUBLIC_JIRA_CLIENT_ID, 
        PUBLIC_JIRA_REDIRECT_URI 
    } from "$env/static/public";

    export let variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" = "default";
    export let size: "default" | "sm" | "lg" | "icon" = "default";
    export let buttonText = "Link your Jira account";

    const clientId = PUBLIC_JIRA_CLIENT_ID;
    const redirectUri = PUBLIC_JIRA_REDIRECT_URI;
    const scopes = "read:me read:account read:jira-user read:jira-work write:jira-work manage:jira-project";
    const audience = 'api.atlassian.com';
    const responseType = 'code';
    const prompt = 'consent';

    // TODO: Use state to verify user on callback...
    // Removing for now :sweat-smile: &state=${YOUR_USER_BOUND_VALUE}
    // Removing this isn't best practice and isn't secure. Remember to add it back in after dev :) 
    const state = 'YOUR_USER_BOUND_VALUE';

    const url = `https://auth.atlassian.com/authorize?audience=${audience}&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&prompt=${prompt}`;
</script>

<Button {variant} {size} href={url}>
    {buttonText}
</Button>