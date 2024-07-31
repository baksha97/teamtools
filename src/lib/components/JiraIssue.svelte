<!-- src/lib/components/JiraIssue.svelte -->
<script lang="ts">
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { AlertCircle, Calendar, Tag, Flag } from 'lucide-svelte';

    export let issue: any;

    function enhanceDescription(html: string): string {
        return html
            .replace(/<span style="color:#[0-9a-fA-F]{6};">/g, '<span class="text-blue-600 dark:text-blue-400">')
            .replace(/<(ul|ol)>/g, '<$1 class="list-disc list-inside">')
            .replace(/<h([1-6])>/g, '<h$1 class="font-bold mt-4 mb-2">')
            .replace(/<pre>/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-2 rounded-md my-2 overflow-x-auto">')
            .replace(/<code>/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">')
            .replace(/<a /g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" ');
    }

    function getStatusColor(status: string): string {
        switch(status.toLowerCase()) {
            case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'in progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    }

    function getPriorityColor(priority: string): string {
        switch(priority.toLowerCase()) {
            case 'high': return 'text-red-600 dark:text-red-400';
            case 'medium': return 'text-orange-600 dark:text-orange-400';
            case 'low': return 'text-green-600 dark:text-green-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    }
</script>

<Card class="w-full max-w-3xl shadow-md dark:shadow-lg dark:bg-gray-800">
    <CardHeader class="pb-2">
        <CardTitle class="text-2xl font-bold text-blue-700 dark:text-blue-300">{issue.fields.summary}</CardTitle>
        <CardDescription class="text-sm flex items-center gap-1 dark:text-gray-300">
            <Tag class="w-4 h-4" />
            Key: {issue.key}
        </CardDescription>
    </CardHeader>
    <CardContent>
        <div class="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" class={`text-sm px-2 py-1 ${getStatusColor(issue.fields.status.name)}`}>
                <AlertCircle class="w-4 h-4 mr-1 inline" />
                {issue.fields.status.name}
            </Badge>
            <Badge variant="secondary" class="text-sm px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <Calendar class="w-4 h-4 mr-1 inline" />
                {issue.fields.issuetype.name}
            </Badge>
            <Badge variant="secondary" class={`text-sm px-2 py-1 ${getPriorityColor(issue.fields.priority.name)}`}>
                <Flag class="w-4 h-4 mr-1 inline" />
                {issue.fields.priority.name}
            </Badge>
        </div>
        
        <Separator class="my-4 dark:bg-gray-600" />
        
        <div>
            <h3 class="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">Description:</h3>
            <div class="prose prose-sm max-w-none dark:prose-invert">
                {@html enhanceDescription(issue.renderedFields.description)}
            </div>
        </div>
    </CardContent>
</Card>
<style>
    :global(.prose p) {
        margin-bottom: 1em;
    }
    :global(.prose ul), :global(.prose ol) {
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
    :global(.prose li) {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
    }
    :global(.prose h1), :global(.prose h2), :global(.prose h3), 
    :global(.prose h4), :global(.prose h5), :global(.prose h6) {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
    }
    :global(.prose h1), :global(.prose h2), :global(.prose h3), 
    :global(.prose h4), :global(.prose h5), :global(.prose h6) {
        @apply text-blue-700 dark:text-blue-300;
    }
</style>