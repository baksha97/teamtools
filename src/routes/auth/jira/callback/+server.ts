import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JIRA_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_JIRA_CLIENT_ID, PUBLIC_JIRA_REDIRECT_URI } from '$env/static/public';
import { page } from '$app/stores';  
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, cookies, url, locals }) => {
    const code = url.searchParams.get('code');

    if (!code) {
        return json({ error: 'No authorization code provided' }, { status: 400 });
    }
    let redirectUri = url.origin + PUBLIC_JIRA_REDIRECT_URI;
    let finalRedirect = url.origin;
    
    // We need to work around code spaces handling redirects super weirdly.
    if(PUBLIC_JIRA_CLIENT_ID === "aSUdt6EMOkYRo0ZYYgnePOuFYrCxmJf2") {
        // if testing in a github codespace, use the codespace's hostname and not origin since there's a mismatch and it'll become localhost.
        redirectUri = "https://obscure-parakeet-9755p9wg7g629p9x-5173.app.github.dev/auth/jira/callback"
        finalRedirect = "https://obscure-parakeet-9755p9wg7g629p9x-5173.app.github.dev"
    }
    console.log(redirectUri);

    // Exchange the authorization code for tokens
    const response = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: PUBLIC_JIRA_CLIENT_ID,
            client_secret: JIRA_CLIENT_SECRET,
            code: code,
            redirect_uri: redirectUri
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}|||\n ${JSON.stringify(await response.json())}`);
    }

    const data = await response.json();

    // Set the access token in a secure HTTP-only cookie
    cookies.set('jira_access_token', data.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: data.expires_in
    });
    throw redirect(301, finalRedirect);
};