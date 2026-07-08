"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
	createRestaurant,
	updateRestaurant,
	type Restaurant,
	type RestaurantPayload,
	type CuisineType,
} from "@/lib/api";
import { ApiErrorMessage } from "@/components/api-error-message";

const CUISINES: CuisineType[] = ["AMERICAN", "ASIAN", "MEXICAN", "PIZZA"];

const EMPTY: RestaurantPayload = {
	name: "",
	description: "",
	address: "",
	neighborhood: "",
	image: "",
	cuisineType: "AMERICAN",
	latitude: 0,
	longitude: 0,
	capacity: 50,
};

interface Props {
	restaurant?: Restaurant | null;
	onClose: () => void;
	onSaved: (r: Restaurant) => void;
}

export function RestaurantFormModal({ restaurant, onClose, onSaved }: Props) {
	const [form, setForm] = useState<RestaurantPayload>(EMPTY);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		if (restaurant) {
			setForm({
				name: restaurant.name,
				description: restaurant.description,
				address: restaurant.address,
				neighborhood: restaurant.neighborhood,
				image: restaurant.image,
				cuisineType: restaurant.cuisineType,
				latitude: restaurant.latitude,
				longitude: restaurant.longitude,
				capacity: restaurant.capacity,
			});
		} else {
			setForm(EMPTY);
		}
	}, [restaurant]);

	const set = (key: keyof RestaurantPayload, value: string | number) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		try {
			const saved = restaurant
				? await updateRestaurant(restaurant.id, form)
				: await createRestaurant(form);
			onSaved(saved);
		} catch (err) {
			setError(err);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			role="dialog"
			aria-modal="true"
			aria-label={restaurant ? "Edit restaurant" : "Create restaurant"}
		>
			<div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
					<h2 className="text-xl font-bold text-foreground">
						{restaurant ? "Edit Restaurant" : "Add Restaurant"}
					</h2>
					<button
						onClick={onClose}
						aria-label="Close"
						className="text-muted-foreground hover:text-foreground transition"
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
					{Boolean(error) && <ApiErrorMessage error={error} />}

					<Field label="Name">
						<input
							required
							value={form.name}
							onChange={(e) => set("name", e.target.value)}
							className={inputCls}
							placeholder="The Golden Fork"
						/>
					</Field>

					<Field label="Description">
						<textarea
							required
							rows={3}
							value={form.description}
							onChange={(e) => set("description", e.target.value)}
							className={inputCls}
							placeholder="A short description..."
						/>
					</Field>

					<div className="grid grid-cols-2 gap-4">
						<Field label="Cuisine">
							<select
								value={form.cuisineType}
								onChange={(e) =>
									set("cuisineType", e.target.value as CuisineType)
								}
								className={inputCls}
							>
								{CUISINES.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</select>
						</Field>

						<Field label="Capacity">
							<input
								required
								type="number"
								min={1}
								value={form.capacity}
								onChange={(e) => set("capacity", Number(e.target.value))}
								className={inputCls}
							/>
						</Field>
					</div>

					<Field label="Address">
						<input
							required
							value={form.address}
							onChange={(e) => set("address", e.target.value)}
							className={inputCls}
							placeholder="123 Main St, City, State"
						/>
					</Field>

					<Field label="Neighborhood">
						<input
							value={form.neighborhood}
							onChange={(e) => set("neighborhood", e.target.value)}
							className={inputCls}
							placeholder="Downtown"
						/>
					</Field>

					<Field label="Image URL">
						<input
							value={form.image}
							onChange={(e) => set("image", e.target.value)}
							className={inputCls}
							placeholder="https://..."
						/>
					</Field>

					<div className="grid grid-cols-2 gap-4">
						<Field label="Latitude">
							<input
								type="number"
								step="any"
								value={form.latitude}
								onChange={(e) => set("latitude", Number(e.target.value))}
								className={inputCls}
							/>
						</Field>
						<Field label="Longitude">
							<input
								type="number"
								step="any"
								value={form.longitude}
								onChange={(e) => set("longitude", Number(e.target.value))}
								className={inputCls}
							/>
						</Field>
					</div>

					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={saving}
							className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
						>
							{saving
								? "Saving..."
								: restaurant
									? "Save Changes"
									: "Create Restaurant"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label className="block text-sm font-medium text-foreground mb-1.5">
				{label}
			</label>
			{children}
		</div>
	);
}

const inputCls =
	"w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
