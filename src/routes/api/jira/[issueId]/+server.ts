import { json } from '@sveltejs/kit';
import { JIRA_RESOURCE_ID } from '$env/static/private';

export async function GET({ params, fetch }) {
    const { issueId } = params;
    const url = `/api/jira?path=${JIRA_RESOURCE_ID}/rest/api/3/issue/${issueId}?expand=names,renderedFields&fieldsByKeys=true`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Error fetching Jira issue:', error);
        return json({ error: 'An error occurred while fetching the issue' }, { status: 500 });
    }
}