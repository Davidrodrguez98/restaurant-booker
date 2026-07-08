"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { TOKEN_KEY } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

interface User {
	id: string;
	email: string;
	name: string;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (email: string, name: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	token: string | null;
}

type AuthEndpointErrorShape = {
	message?: unknown;
	code?: unknown;
	status?: unknown;
};

export class AuthEndpointError extends Error {
	readonly code?: string;
	readonly status?: number;

	constructor(message: string, code?: string, status?: number) {
		super(message);
		this.name = "AuthEndpointError";
		this.code = code;
		this.status = status;
	}
}

function normalizeAuthError(
	err: unknown,
	fallbackMessage: string,
): AuthEndpointError {
	if (err instanceof AuthEndpointError) {
		return err;
	}

	if (typeof err === "object" && err !== null) {
		const shaped = err as AuthEndpointErrorShape;
		const message =
			typeof shaped.message === "string" && shaped.message.trim()
				? shaped.message
				: fallbackMessage;
		const code = typeof shaped.code === "string" ? shaped.code : undefined;
		const status =
			typeof shaped.status === "number" ? shaped.status : undefined;

		return new AuthEndpointError(message, code, status);
	}

	if (err instanceof Error) {
		return new AuthEndpointError(err.message || fallbackMessage);
	}

	return new AuthEndpointError(fallbackMessage);
}

const USER_KEY = "auth_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedToken = localStorage.getItem(TOKEN_KEY);
		const storedUser = localStorage.getItem(USER_KEY);
		if (storedToken && storedUser) {
			setToken(storedToken);
			setUser(JSON.parse(storedUser));
		}
		setIsLoading(false);
	}, []);

	const persistSession = (sessionUser: User | null) => {
		// The Better Auth client stores the bearer token from the
		// `set-auth-token` response header in its onSuccess handler.
		const sessionToken = localStorage.getItem(TOKEN_KEY);
		if (sessionToken) {
			setToken(sessionToken);
		}
		if (sessionUser) {
			setUser(sessionUser);
			localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
		}
	};

	const login = async (email: string, password: string) => {
		try {
			const { data, error } = await authClient.signIn.email({
				email,
				password,
			});

			if (error) {
				throw normalizeAuthError(error, "Invalid email or password");
			}

			persistSession(
				data?.user
					? { id: data.user.id, email: data.user.email, name: data.user.name }
					: null,
			);
		} catch (err) {
			throw normalizeAuthError(err, "Invalid email or password");
		}
	};

	const signup = async (email: string, name: string, password: string) => {
		try {
			const { data, error } = await authClient.signUp.email({
				email,
				name,
				password,
			});

			if (error) {
				throw normalizeAuthError(error, "Could not create account");
			}

			persistSession(
				data?.user
					? { id: data.user.id, email: data.user.email, name: data.user.name }
					: null,
			);
		} catch (err) {
			throw normalizeAuthError(err, "Could not create account");
		}
	};

	const logout = async () => {
		try {
			await authClient.signOut();
		} finally {
			setToken(null);
			setUser(null);
			localStorage.removeItem(TOKEN_KEY);
			localStorage.removeItem(USER_KEY);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAuthenticated: !!user,
				login,
				signup,
				logout,
				token,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
