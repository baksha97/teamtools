<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { 
        PUBLIC_JIRA_CLIENT_ID, 
        PUBLIC_JIRA_REDIRECT_URI 
    } from "$env/static/public";
    import { page } from '$app/stores';  

    export let variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" = "default";
    export let size: "default" | "sm" | "lg" | "icon" = "default";
    export let buttonText = "Link your Jira account";

    const clientId = PUBLIC_JIRA_CLIENT_ID;
    let redirectUri = $page.url.origin + PUBLIC_JIRA_REDIRECT_URI;
     // We need to work around code spaces handling redirects super weirdly.
     if(PUBLIC_JIRA_CLIENT_ID === "aSUdt6EMOkYRo0ZYYgnePOuFYrCxmJf2") {
        // if testing in a github codespace, use the codespace's hostname and not origin since there's a mismatch and it'll become localhost.
        redirectUri = "https://obscure-parakeet-9755p9wg7g629p9x-5173.app.github.dev/auth/jira/callback"
    }
    console.log(redirectUri);
    const scopes = "offline_access read:me read:account read:jira-user read:jira-work write:jira-work manage:jira-project";
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