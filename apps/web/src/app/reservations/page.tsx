"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ApiErrorMessage } from "@/components/api-error-message";
import { Calendar, Clock, Users, MapPin, X } from "lucide-react";
import {
	getMyReservations,
	getRestaurants,
	cancelReservation,
	type Reservation,
	type Restaurant,
} from "@/lib/api";

export default function ReservationsPage() {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const router = useRouter();
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>(
		{},
	);
	const [filter, setFilter] = useState<"CONFIRMED" | "CANCELLED" | "ALL">(
		"ALL",
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<unknown>(null);
	const [cancellingId, setCancellingId] = useState<string | null>(null);

	useEffect(() => {
		if (!authLoading && !isAuthenticated) router.push("/auth/sign-in");
	}, [authLoading, isAuthenticated, router]);

	useEffect(() => {
		if (!isAuthenticated) return;
		let active = true;
		setIsLoading(true);
		setError(null);

		Promise.all([
			getMyReservations(),
			getRestaurants().catch(() => [] as Restaurant[]),
		])
			.then(([reservationData, restaurantData]) => {
				if (!active) return;
				setReservations(reservationData);
				const map: Record<string, Restaurant> = {};
				restaurantData.forEach((r) => {
					map[r.id] = r;
				});
				setRestaurants(map);
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

	const handleCancelReservation = async (id: string) => {
		setCancellingId(id);
		try {
			const updated = await cancelReservation(id);
			setReservations((prev) =>
				prev.map((res) => (res.id === id ? updated : res)),
			);
		} catch (err) {
			setError(err);
		} finally {
			setCancellingId(null);
		}
	};

	const isUpcoming = (res: Reservation) =>
		new Date(`${res.reservationDate}T${res.reservationTime}`) > new Date();

	const filteredReservations = useMemo(
		() =>
			reservations.filter((res) => filter === "ALL" || res.status === filter),
		[reservations, filter],
	);

	const stats = useMemo(() => {
		const confirmed = reservations.filter((r) => r.status === "CONFIRMED");
		return {
			upcoming: confirmed.filter(isUpcoming).length,
			past: confirmed.filter((r) => !isUpcoming(r)).length,
			cancelled: reservations.filter((r) => r.status === "CANCELLED").length,
		};
	}, [reservations]);

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

			<main className="pt-20 pb-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mb-8">
						<h1 className="text-4xl font-bold text-foreground mb-2">
							My Reservations
						</h1>
						<p className="text-muted-foreground">
							Manage and view all your restaurant reservations
						</p>
					</div>

					{/* Filter tabs */}
					<div className="flex gap-4 mb-8 border-b border-border pb-4">
						{(["ALL", "CONFIRMED", "CANCELLED"] as const).map((status) => (
							<button
								key={status}
								onClick={() => setFilter(status)}
								className={`px-4 py-2 font-medium transition ${
									filter === status
										? "text-primary border-b-2 border-primary"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{status === "ALL"
									? "All"
									: status === "CONFIRMED"
										? "Confirmed"
										: "Cancelled"}
							</button>
						))}
					</div>

					{/* Stats */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
						<div className="bg-card border border-border rounded-lg p-4">
							<p className="text-sm text-muted-foreground mb-1">Upcoming</p>
							<p className="text-3xl font-bold text-foreground">
								{stats.upcoming}
							</p>
						</div>
						<div className="bg-card border border-border rounded-lg p-4">
							<p className="text-sm text-muted-foreground mb-1">Past</p>
							<p className="text-3xl font-bold text-foreground">{stats.past}</p>
						</div>
						<div className="bg-card border border-border rounded-lg p-4">
							<p className="text-sm text-muted-foreground mb-1">Cancelled</p>
							<p className="text-3xl font-bold text-foreground">
								{stats.cancelled}
							</p>
						</div>
					</div>

					{Boolean(error) && <ApiErrorMessage error={error} className="mb-6" />}

					{/* List */}
					{isLoading ? (
						<div className="space-y-4">
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className="h-32 rounded-lg bg-muted animate-pulse border border-border"
								/>
							))}
						</div>
					) : filteredReservations.length === 0 ? (
						<div className="text-center py-16 bg-card border border-border rounded-lg">
							<p className="text-lg text-muted-foreground mb-4">
								No reservations found
							</p>
							<Button
								onClick={() => router.push("/")}
								className="bg-primary hover:bg-primary/90 text-primary-foreground"
							>
								Browse Restaurants
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							{filteredReservations.map((reservation) => {
								const restaurant = restaurants[reservation.restaurantId];
								return (
									<div
										key={reservation.id}
										className={`bg-card border rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
											reservation.status === "CANCELLED"
												? "border-destructive/30 opacity-75"
												: "border-border hover:border-primary/50"
										}`}
									>
										<div className="flex-1">
											<h3 className="text-xl font-semibold text-foreground mb-2">
												{restaurant?.name ?? "Restaurant"}
											</h3>
											<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
												<div className="flex items-center gap-2 text-muted-foreground">
													<Calendar size={16} />
													<span>
														{new Date(
															reservation.reservationDate,
														).toLocaleDateString()}
													</span>
												</div>
												<div className="flex items-center gap-2 text-muted-foreground">
													<Clock size={16} />
													<span>{reservation.reservationTime}</span>
												</div>
												<div className="flex items-center gap-2 text-muted-foreground">
													<Users size={16} />
													<span>{reservation.partySize} guests</span>
												</div>
												<div className="flex items-center gap-2 text-muted-foreground">
													<MapPin size={16} />
													<span className="line-clamp-1">
														{restaurant?.cuisineType ?? "—"}
													</span>
												</div>
											</div>
											{restaurant?.address && (
												<p className="text-xs text-muted-foreground mt-2">
													{restaurant.address}
												</p>
											)}
										</div>

										<div className="flex flex-col gap-2 items-start md:items-end">
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${
													reservation.status === "CONFIRMED"
														? "bg-primary/10 text-primary"
														: "bg-destructive/10 text-destructive"
												}`}
											>
												{reservation.status}
											</span>
											{reservation.status === "CONFIRMED" &&
												isUpcoming(reservation) && (
													<Button
														variant="outline"
														size="sm"
														disabled={cancellingId === reservation.id}
														onClick={() =>
															handleCancelReservation(reservation.id)
														}
														className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
													>
														<X size={16} className="mr-1" />
														{cancellingId === reservation.id
															? "Cancelling..."
															: "Cancel"}
													</Button>
												)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
