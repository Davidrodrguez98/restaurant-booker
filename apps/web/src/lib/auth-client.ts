import { createAuthClient } from "better-auth/client";
import { API_BASE_URL, TOKEN_KEY } from "@/lib/api";

export const authClient = createAuthClient({
	baseURL: API_BASE_URL,
	fetchOptions: {
		auth: {
			type: "Bearer",
			token: () =>
				(typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY)) ||
				"",
		},
		onSuccess: (ctx) => {
			const authToken = ctx.response.headers.get("set-auth-token");
			if (authToken) {
				localStorage.setItem(TOKEN_KEY, authToken);
			}
		},
	},
});
