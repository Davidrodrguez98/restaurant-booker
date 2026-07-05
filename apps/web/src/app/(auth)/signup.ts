import { authClient } from "../../lib/auth-client";

const email = 'user@example.com';
const password = 'password';
const name = 'John Doe';

const { data, error } = await authClient.signUp.email({
        email, // user email address
        password, // user password -> min 8 characters by default
        name, // user display name
        callbackURL: "/dashboard" // A URL to redirect to after the user verifies their email (optional)
    }, {
        onRequest: (ctx) => {
            //show loading
			console.log("Requesting sign up...");
        },
        onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
            console.log("Sign up successful!");
        },
        onError: (ctx) => {
            // display the error message
            alert(ctx.error.message);
        },
});