"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ApiErrorMessage } from "@/components/api-error-message";

export default function SignUpPage() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState<unknown>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { signup } = useAuth();
	const router = useRouter();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		if (formData.password !== formData.confirmPassword) {
			setError(new Error("Passwords do not match"));
			setIsLoading(false);
			return;
		}

		if (formData.password.length < 8) {
			setError(new Error("Password must be at least 8 characters"));
			setIsLoading(false);
			return;
		}

		try {
			await signup(formData.email, formData.name, formData.password);
			router.push("/");
		} catch (err) {
			setError(err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-background via-background to-muted flex items-center justify-center px-4 py-12">
			<div className="w-full max-w-md">
				<div className="bg-card rounded-lg shadow-lg border border-border p-8">
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-foreground text-center">
							Create Account
						</h1>
						<p className="text-center text-muted-foreground mt-2">
							Join TableBook and discover amazing restaurants
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{Boolean(error) && <ApiErrorMessage error={error} />}

						<div>
							<label className="block text-sm font-medium text-foreground mb-2">
								Full Name
							</label>
							<input
								type="text"
								name="name"
								value={formData.name}
								onChange={handleChange}
								placeholder="John Doe"
								className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-foreground mb-2">
								Email
							</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								placeholder="you@example.com"
								className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-foreground mb-2">
								Password
							</label>
							<input
								type="password"
								name="password"
								value={formData.password}
								onChange={handleChange}
								placeholder="••••••••"
								className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-foreground mb-2">
								Confirm Password
							</label>
							<input
								type="password"
								name="confirmPassword"
								value={formData.confirmPassword}
								onChange={handleChange}
								placeholder="••••••••"
								className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
								required
							/>
						</div>

						<Button
							type="submit"
							disabled={isLoading}
							className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-lg transition"
						>
							{isLoading ? "Creating Account..." : "Create Account"}
						</Button>
					</form>

					<p className="text-center text-muted-foreground mt-6 text-sm">
						Already have an account?{" "}
						<Link
							href="/auth/sign-in"
							className="text-primary hover:underline font-medium"
						>
							Sign In
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
