import { httpClient } from "@/api/httpClient";

async function starItem(id: string) {
    await httpClient<any>(`/applemusic/me/ratings/songs/${id}`, {
        method: "PUT",
        body: JSON.stringify(
            {
                type: "rating",
                attributes: {
                    value: 1
                }
            }
        )
    });
}

async function unstarItem(id: string) {
    await httpClient<any>(`/applemusic/me/ratings/songs/${id}`, {
        method: "DELETE",
    });
}

interface HandleStarItem {
    id: string
    starred: boolean
}

async function handleStarItem({ id, starred }: HandleStarItem) {
    if (starred) {
        await unstarItem(id);
    } else {
        await starItem(id);
    }
}

export const star = {
    starItem,
    unstarItem,
    handleStarItem,
};
