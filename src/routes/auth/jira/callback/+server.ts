import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JIRA_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_JIRA_CLIENT_ID, PUBLIC_JIRA_REDIRECT_URI } from '$env/static/public';

export const GET: RequestHandler = async ({ request, cookies, url, locals }) => {
    const code = url.searchParams.get('code');

    if (!code) {
        return json({ error: 'No authorization code provided' }, { status: 400 });
    }

    try {
        // Exchange the authorization code for tokens
        const response = await fetch('https://auth.atlassian.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: PUBLIC_JIRA_CLIENT_ID,
                client_secret: JIRA_CLIENT_SECRET,
                code: code,
                redirect_uri: PUBLIC_JIRA_REDIRECT_URI
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
        
        // Redirect to a page where the user can start using Jira integration
        return Response.redirect('/auth/jira/test', 301);
    } catch (error) {
        console.error('Error in Jira OAuth flow:', error);
        return json({ error: 'Failed to complete Jira OAuth flow' }, { status: 500 });
    }
};