export async function load({ parent }) {
    const data = await parent()
    console.log("[routes/profile/+page.server.ts] parent-data", data);
    return {
        ...data
    }
}