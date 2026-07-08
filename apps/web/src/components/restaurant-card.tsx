"use client";

import Link from "next/link";
import { Heart, MapPin, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Restaurant } from "@/lib/api";

interface RestaurantCardProps {
	restaurant: Restaurant;
	isFavorited: boolean;
	onToggleFavorite: () => void;
}

export function RestaurantCard({
	restaurant,
	isFavorited,
	onToggleFavorite,
}: RestaurantCardProps) {
	return (
		<div className="group bg-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/50">
			{/* Image Container */}
			<div className="relative h-48 overflow-hidden bg-muted">
				<img
					src={restaurant.image || "/placeholder.svg?height=300&width=400"}
					alt={restaurant.name}
					className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
				/>
				<button
					onClick={onToggleFavorite}
					aria-label={
						isFavorited ? "Remove from favourites" : "Add to favourites"
					}
					className="absolute top-3 right-3 p-2 bg-card/90 rounded-full shadow-md hover:bg-card transition"
				>
					<Heart
						size={20}
						className={
							isFavorited
								? "fill-destructive text-destructive"
								: "text-muted-foreground"
						}
					/>
				</button>
				<div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
					{restaurant.cuisineType}
				</div>
			</div>

			{/* Content */}
			<div className="p-4">
				<div className="mb-2">
					<h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition">
						{restaurant.name}
					</h3>
					<p className="text-sm text-muted-foreground line-clamp-2">
						{restaurant.description}
					</p>
				</div>

				{/* Rating and Capacity */}
				<div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
					<div className="flex items-center gap-1">
						<Star size={16} className="fill-amber-400 text-amber-400" />
						<span className="font-medium">
							{restaurant.rating?.toFixed(1) ?? "—"}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<Users size={16} />
						<span>Up to {restaurant.capacity}</span>
					</div>
				</div>

				{/* Address */}
				<div className="flex items-start gap-2 mb-4 text-sm text-muted-foreground">
					<MapPin size={16} className="mt-0.5 flex-shrink-0" />
					<span className="line-clamp-1">
						{restaurant.neighborhood ? `${restaurant.neighborhood} · ` : ""}
						{restaurant.address}
					</span>
				</div>

				{/* Book Button */}
				<Link href={`/restaurants/${restaurant.id}`}>
					<Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
						Book a Table
					</Button>
				</Link>
			</div>
		</div>
	);
}
