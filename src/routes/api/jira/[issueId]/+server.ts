// src/routes/api/jira/[...path]/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const JIRA_API_URL = 'https://api.atlassian.com/ex/jira/';

export const GET: RequestHandler = async ({ params, request, cookies }) => {
    const jiraToken = cookies.get('jira_access_token');
    if (!jiraToken) {
        return json({ error: 'No Jira token found' }, { status: 401 });
    }
    
    return json({data: jiraToken});
};

// Implement POST, PUT, DELETE methods similarly if needed