export function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export const oauthURL = "https://discord.com/oauth2/authorize?client_id=1325109688467193967&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5001%2Fapi%2Fauth%2F&scope=identify+guilds+email+connections"