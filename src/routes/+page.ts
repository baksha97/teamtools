export async function load({parent}) {
    const data = await parent()
    console.log("[routes/+page.server.ts] parent-data", data);
    return {
        ...data
    }
}