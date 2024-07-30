import { writable, get, type Writable } from 'svelte/store';
import { getContext, setContext, type SvelteComponent } from 'svelte';

const JIRA_CONTEXT_KEY = 'jira_store';

export interface JiraIntegrationData {
    isLinked: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
}

export interface JiraTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}


export class JiraStore {
    private store: Writable<JiraIntegrationData>;

    constructor() {
        this.store = writable<JiraIntegrationData>({
            isLinked: false,
            accessToken: null,
            refreshToken: null,
            expiresAt: null
        });

        // Initialize from localStorage if available
        if (typeof localStorage !== 'undefined') {
            const storedData = localStorage.getItem('jiraIntegration');
            if (storedData) {
                const parsedData = JSON.parse(storedData) as Partial<JiraIntegrationData>;
                this.store.set({
                    isLinked: true,
                    accessToken: parsedData.accessToken || null,
                    refreshToken: parsedData.refreshToken || null,
                    expiresAt: parsedData.expiresAt || null
                });
            }
        }

        // Subscribe to changes and update localStorage
        this.store.subscribe(value => {
            if (typeof localStorage !== 'undefined') {
                if (value.isLinked) {
                    localStorage.setItem('jiraIntegration', JSON.stringify({
                        accessToken: value.accessToken,
                        refreshToken: value.refreshToken,
                        expiresAt: value.expiresAt
                    }));
                } else {
                    localStorage.removeItem('jiraIntegration');
                }
            }
        });
    }

    get isLinked(): boolean {
        return get(this.store).isLinked;
    }

    async linkJira(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
        const expiresAt = Date.now() + expiresIn * 1000;
        this.store.set({
            isLinked: true,
            accessToken,
            refreshToken,
            expiresAt
        });
    }

    unlinkJira(): void {
        this.store.set({
            isLinked: false,
            accessToken: null,
            refreshToken: null,
            expiresAt: null
        });
    }

    async getValidToken(): Promise<string> {
        const { accessToken, refreshToken, expiresAt } = get(this.store);

        if (!accessToken || !refreshToken || !expiresAt) {
            throw new Error('Jira not linked');
        }

        if (expiresAt <= Date.now()) {
            return this.refreshToken(refreshToken);
        }

        return accessToken;
    }

    private async refreshToken(refreshToken: string): Promise<string> {
        try {
            const newTokens = await this.refreshJiraTokenAPI(refreshToken);

            this.store.update(state => ({
                ...state,
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                expiresAt: Date.now() + newTokens.expiresIn * 1000
            }));

            return newTokens.accessToken;
        } catch (error) {
            console.error('Failed to refresh Jira token:', error);
            this.unlinkJira();
            throw error;
        }
    }

    private async refreshJiraTokenAPI(refreshToken: string): Promise<JiraTokenResponse> {
        // Implement the actual API call to Jira to refresh the token
        // This is a placeholder implementation
        return {
            accessToken: 'new_access_token',
            refreshToken: 'new_refresh_token',
            expiresIn: 3600
        };
    }

    subscribe(run: (value: JiraIntegrationData) => void): () => void {
        return this.store.subscribe(run);
    }

    static setContext(): void {
        setContext(JIRA_CONTEXT_KEY, new JiraStore());
    }

    static getContext(): JiraStore {
        const context = getContext<JiraStore>(JIRA_CONTEXT_KEY);
        if (!context) {
            throw new Error('JiraStore context not found. Did you call JiraStore.setContext()?');
        }
        return context;
    }
}
