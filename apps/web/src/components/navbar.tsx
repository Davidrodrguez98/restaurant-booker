"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
	const { isAuthenticated, user, logout } = useAuth();
	const router = useRouter();

	const handleLogout = async () => {
		await logout();
		router.push("/auth/sign-in");
	};

	return (
		<nav className="fixed top-0 w-full bg-card/95 backdrop-blur border-b border-border z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<Link href="/" className="text-2xl font-bold text-primary">
						Restaurant Booker
					</Link>

					<div className="flex items-center gap-4">
						{isAuthenticated ? (
							<>
								<div className="hidden sm:block">
									<p className="text-sm text-muted-foreground">
										Welcome,{" "}
										<span className="font-medium text-foreground">
											{user?.name}
										</span>
									</p>
								</div>
								<Link href="/reservations">
									<Button variant="ghost" size="sm">
										My Reservations
									</Button>
								</Link>
								<Button variant="outline" size="sm" onClick={handleLogout}>
									Sign Out
								</Button>
							</>
						) : (
							<>
								<Link href="/auth/sign-in">
									<Button variant="ghost" size="sm">
										Sign In
									</Button>
								</Link>
								<Link href="/auth/sign-up">
									<Button size="sm" className="bg-primary hover:bg-primary/90">
										Sign Up
									</Button>
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
