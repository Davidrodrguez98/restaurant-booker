"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { RestaurantCard } from "@/components/restaurant-card";
import { Button } from "@/components/ui/button";
import { ApiErrorMessage } from "@/components/api-error-message";
import { Plus } from "lucide-react";
import {
	getRestaurants,
	getFavourites,
	addFavourite,
	removeFavourite,
	type Restaurant,
} from "@/lib/api";
import { RestaurantFormModal } from "@/components/restaurant-form-modal";

const CUISINES = ["ALL", "AMERICAN", "ASIAN", "PIZZA", "MEXICAN"] as const;

export default function HomePage() {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const router = useRouter();
	const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
	const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
	const [cuisine, setCuisine] = useState<string>("ALL");
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<unknown>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/auth/sign-in");
		}
	}, [isAuthenticated, authLoading, router]);

	useEffect(() => {
		if (!isAuthenticated) return;

		let active = true;
		setIsLoading(true);
		setError(null);

		Promise.all([getRestaurants(), getFavourites().catch(() => [])])
			.then(([restaurantData, favourites]) => {
				if (!active) return;
				setRestaurants(restaurantData);
				setFavouriteIds(new Set(favourites.map((f) => f.restaurantId)));
			})
			.catch((err) => {
				if (active) setError(err);
			})
			.finally(() => {
				if (active) setIsLoading(false);
			});

		return () => {
			active = false;
		};
	}, [isAuthenticated]);

	const toggleFavourite = async (restaurantId: string) => {
		const isFav = favouriteIds.has(restaurantId);
		// optimistic update
		setFavouriteIds((prev) => {
			const next = new Set(prev);
			if (isFav) next.delete(restaurantId);
			else next.add(restaurantId);
			return next;
		});
		try {
			if (isFav) await removeFavourite(restaurantId);
			else await addFavourite(restaurantId);
		} catch {
			// revert on failure
			setFavouriteIds((prev) => {
				const next = new Set(prev);
				if (isFav) next.add(restaurantId);
				else next.delete(restaurantId);
				return next;
			});
		}
	};

	const filteredRestaurants = useMemo(() => {
		let filtered = restaurants;
		if (cuisine !== "ALL") {
			filtered = filtered.filter((r) => r.cuisineType === cuisine);
		}
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(r) =>
					r.name.toLowerCase().includes(term) ||
					(r.description ?? "").toLowerCase().includes(term) ||
					(r.neighborhood ?? "").toLowerCase().includes(term),
			);
		}
		return filtered;
	}, [restaurants, cuisine, searchTerm]);

	if (authLoading || !isAuthenticated) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
					<p className="mt-4 text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{showCreateModal && (
				<RestaurantFormModal
					onClose={() => setShowCreateModal(false)}
					onSaved={(r) => {
						setRestaurants((prev) => [r, ...prev]);
						setShowCreateModal(false);
					}}
				/>
			)}

			<main className="pt-20">
				{/* Hero Section */}
				<section className="bg-linear-to-r from-primary/10 via-transparent to-primary/5 border-b border-border">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
						<h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight text-balance">
							Discover Your Next{" "}
							<span className="text-primary">Perfect Meal</span>
						</h1>
						<p className="text-xl text-muted-foreground max-w-2xl mb-8 text-pretty">
							Browse exceptional restaurants, check availability, and book your
							table instantly
						</p>

						<div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
							<input
								type="text"
								placeholder="Search restaurants..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="flex-1 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
							/>
							<Button
								onClick={() => setShowCreateModal(true)}
								className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 whitespace-nowrap"
							>
								<Plus size={18} />
								Add Restaurant
							</Button>
						</div>
					</div>
				</section>

				{/* Filters */}
				<section className="border-b border-border bg-card">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
						<div className="flex items-center gap-2 overflow-x-auto pb-2">
							<span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
								Cuisine:
							</span>
							{CUISINES.map((type) => (
								<button
									key={type}
									onClick={() => setCuisine(type)}
									className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
										cuisine === type
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground hover:bg-border"
									}`}
								>
									{type === "ALL" ? "All Cuisines" : type}
								</button>
							))}
						</div>
					</div>
				</section>

				{/* Restaurants Grid */}
				<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
					{isLoading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[...Array(6)].map((_, i) => (
								<div
									key={i}
									className="h-80 rounded-lg bg-muted animate-pulse border border-border"
								/>
							))}
						</div>
					) : error ? (
						<div className="text-center py-12">
							<ApiErrorMessage
								error={error}
								className="max-w-xl mx-auto text-left"
							/>
						</div>
					) : filteredRestaurants.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-muted-foreground text-lg">
								No restaurants found
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredRestaurants.map((restaurant) => (
								<RestaurantCard
									key={restaurant.id}
									restaurant={restaurant}
									isFavorited={favouriteIds.has(restaurant.id)}
									onToggleFavorite={() => toggleFavourite(restaurant.id)}
								/>
							))}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
