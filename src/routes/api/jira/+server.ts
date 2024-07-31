// src/routes/api/jira/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';


// USED LIKE THIS:
// https://obscure-parakeet-9755p9wg7g629p9x-5173.app.github.dev/api/jira?path=49e93ba6-3eac-4bbc-9f21-6f5d0b4e4682/rest/api/3/issue/SAM-3?expand=names,renderedFields&fieldsByKeys=true
const JIRA_API_URL = 'https://api.atlassian.com/ex/jira/';

export const GET: RequestHandler = async ({ url, cookies }) => {
    const jiraToken = cookies.get('jira_access_token');
    if (!jiraToken) {
        return json({ error: 'No Jira token found' }, { status: 401 });
    }

    const path = url.searchParams.get('path');
    if (!path) {
        return json({ error: 'No path provided' }, { status: 400 });
    }

    // Split the path parameter to separate the Jira instance ID and the API path
    const [instanceId, ...restPath] = path.split('/');
    const apiPath = restPath.join('/');

    // Construct the full Jira API URL
    const jiraUrl = new URL(`${instanceId}/${apiPath}`, JIRA_API_URL);
    
    // Copy all query parameters from the original path
    const originalQueryString = path.split('?')[1];
    if (originalQueryString) {
        jiraUrl.search = originalQueryString;
    }

    try {
        const response = await fetch(jiraUrl.toString(), {
            headers: {
                'Authorization': `Bearer ${jiraToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Error fetching Jira data:', error);
        return json({ error: 'Failed to fetch Jira data' }, { status: 500 });
    }
};