"use client";

import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import { authClient } from "../../../lib/auth-client";
import { Button } from "@repo/ui/button";

const API_HOST =
	process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3001/api";

export function Web() {
	const [name, setName] = useState<string>("");
	const [response, setResponse] = useState<{ message: string } | null>(null);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		setResponse(null);
		setError(undefined);
	}, [name]);

	const onChange = (e: ChangeEvent<HTMLInputElement>) =>
		setName(e.target.value);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			const result = await fetch(`${API_HOST}/message/${name}`);
			if (!result.ok) throw new Error("Failed to fetch response");
			const response = await result.json();
			setResponse(response);
		} catch (err) {
			console.error(err);
			setError("Unable to fetch response");
		}
	};

	const onReset = () => {
		setName("");
	};

	return (
		<div>
			<h1>Web</h1>
			<form onSubmit={onSubmit}>
				<label htmlFor="name">Name </label>
				<input
					type="text"
					name="name"
					id="name"
					value={name}
					onChange={onChange}
				></input>
				<Button type="submit">Submit</Button>
			</form>
			{error && (
				<div>
					<h3>Error</h3>
					<p>{error}</p>
				</div>
			)}
			{response && (
				<div>
					<h3>Greeting</h3>
					<p>{response.message}</p>
					<Button onClick={onReset}>Reset</Button>
				</div>
			)}
		</div>
	);
}

export default function SignIn() {
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<string | undefined>();

	const onChangeEmail = (e: ChangeEvent<HTMLInputElement>) =>
		setEmail(e.target.value);
	const onChangePassword = (e: ChangeEvent<HTMLInputElement>) =>
		setPassword(e.target.value);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const { data } = await authClient.signIn.email(
			{
				email,
				password,
				fetchOptions: {
					headers: {
						accept: "application/json",
					},
					onSuccess: async (context) => {
						if (context.data?.redirect && context.data?.url) {
							console.log("Redirecting to:", context.data.url);
							window.location.href = context.data.url;
						} else {
							Web();
						}
					},
				},
			},
			{
				onError: (err) => {
					console.error("Sign-in error:", err);
					setError(err.error.message);
				},
				onSuccess: (ctx) => {
					console.log("Sign-in successful!");
					Web();
				},
			},
		);

		console.log("Sign-in response:", data);
	};

	return (
		<div>
			<h1>Sign In</h1>
			<form onSubmit={onSubmit}>
				<label htmlFor="email">Email </label>
				<input
					type="email"
					name="email"
					id="email"
					value={email}
					onChange={onChangeEmail}
				></input>
				<label htmlFor="password">Password </label>
				<input
					type="password"
					name="password"
					id="password"
					value={password}
					onChange={onChangePassword}
				></input>
				<Button type="submit">Sign In</Button>
			</form>
			{error && (
				<div>
					<h3>Error</h3>
					<p>{error}</p>
				</div>
			)}
		</div>
	);
}
