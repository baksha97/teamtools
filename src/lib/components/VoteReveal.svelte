<script lang="ts">
    import * as Avatar from '$lib/components/ui/avatar';

    export let votes: Record<string, string>;
    export let participants: any[];

    $: voteGroups = Object.entries(votes).reduce((acc, [userId, vote]) => {
        if (!acc[vote]) acc[vote] = [];
        acc[vote].push(userId);
        return acc;
    }, {} as Record<string, string[]>);

    function getParticipantAvatar(userId: string) {
        const participant = participants.find(p => p.user_id === userId);
        return participant ? participant.avatar_url : null;
    }
</script>

<div class="grid grid-cols-3 gap-4">
    {#each Object.entries(voteGroups) as [vote, userIds]}
        <div class="border rounded p-4">
            <div class="text-2xl font-bold mb-2">{vote}</div>
            <div class="flex flex-wrap gap-2">
                {#each userIds as userId}
                    <Avatar.Root class="w-8 h-8">
                        <Avatar.Image
                            src={getParticipantAvatar(userId)}
                            alt="User avatar"
                        />
                        <Avatar.Fallback>{userId.substring(0, 2).toUpperCase()}</Avatar.Fallback>
                    </Avatar.Root>
                {/each}
            </div>
        </div>
    {/each}
</div>