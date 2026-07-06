import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
	baseURL: "http://localhost:3001",
    fetchOptions: {
		auth: {
           type:"Bearer",
           token: () => localStorage.getItem("bearer_token") || ""
        },
        onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token")
            if(authToken){
              localStorage.setItem("bearer_token", authToken);
            }
        }
    }
});