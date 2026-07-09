"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { RestaurantFormModal } from "@/components/restaurant-form-modal";
import { RestaurantDeleteModal } from "@/components/restaurant-delete-modal";
import { Button } from "@/components/ui/button";
import { ApiErrorMessage } from "@/components/api-error-message";
import {
	MapPin,
	Star,
	Users,
	Heart,
	Pencil,
	Trash2,
	X,
	Check,
} from "lucide-react";
import {
	getRestaurant,
	getAvailability,
	createReservation,
	getComments,
	createComment,
	updateComment,
	deleteComment,
	deleteRestaurant,
	getFavourites,
	addFavourite,
	removeFavourite,
	type Restaurant,
	type AvailabilitySlot,
	type Comment,
} from "@/lib/api";

export default function RestaurantDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const router = useRouter();

	const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
	const [comments, setComments] = useState<Comment[]>([]);
	const [isFavorited, setIsFavorited] = useState(false);
	const [pageLoading, setPageLoading] = useState(true);
	const [pageError, setPageError] = useState<unknown>(null);
	const [restaurantActionError, setRestaurantActionError] =
		useState<unknown>(null);

	// Restaurant actions
	const [showEditRestaurant, setShowEditRestaurant] = useState(false);
	const [showDeleteRestaurant, setShowDeleteRestaurant] = useState(false);
	const [deletingRestaurant, setDeletingRestaurant] = useState(false);

	// Reservation state
	const [reservationDate, setReservationDate] = useState("");
	const [partySize, setPartySize] = useState("2");
	const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
	const [selectedSlot, setSelectedSlot] = useState("");
	const [checking, setChecking] = useState(false);
	const [reserving, setReserving] = useState(false);
	const [reservationSuccessMessage, setReservationSuccessMessage] = useState<
		string | null
	>(null);
	const [reservationError, setReservationError] = useState<unknown>(null);

	// Comment form state
	const [newCommentRating, setNewCommentRating] = useState(5);
	const [newCommentBody, setNewCommentBody] = useState("");
	const [submittingComment, setSubmittingComment] = useState(false);
	const [commentError, setCommentError] = useState<unknown>(null);

	// Per-comment edit state
	const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
	const [editRating, setEditRating] = useState(5);
	const [editBody, setEditBody] = useState("");
	const [savingEdit, setSavingEdit] = useState(false);

	// Confirm delete
	const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		if (!authLoading && !isAuthenticated) router.push("/auth/sign-in");
	}, [authLoading, isAuthenticated, router]);

	useEffect(() => {
		if (!isAuthenticated) return;
		let active = true;
		setPageLoading(true);
		setPageError(null);

		Promise.all([
			getRestaurant(id),
			getComments(id).catch(() => [] as Comment[]),
			getFavourites().catch(() => []),
		])
			.then(([restaurantData, commentData, favourites]) => {
				if (!active) return;
				setRestaurant(restaurantData);
				setComments(commentData);
				setIsFavorited(favourites.some((f) => f.restaurantId === id));
			})
			.catch((err) => {
				if (active) setPageError(err);
			})
			.finally(() => {
				if (active) setPageLoading(false);
			});

		return () => {
			active = false;
		};
	}, [id, isAuthenticated]);

	// ---- Favourite ----
	const toggleFavourite = async () => {
		const prev = isFavorited;
		setIsFavorited(!prev);
		try {
			if (prev) await removeFavourite(id);
			else await addFavourite(id);
		} catch {
			setIsFavorited(prev);
		}
	};

	// ---- Restaurant delete ----
	const handleDeleteRestaurant = async () => {
		setDeletingRestaurant(true);
		setRestaurantActionError(null);
		try {
			await deleteRestaurant(id);
			router.push("/");
		} catch (err) {
			setRestaurantActionError(err);
			setDeletingRestaurant(false);
		}
	};

	const handleCloseDeleteRestaurant = () => {
		if (deletingRestaurant) return;
		setShowDeleteRestaurant(false);
		setRestaurantActionError(null);
	};

	// ---- Reservation ----
	const handleCheckAvailability = async () => {
		if (!reservationDate) {
			setReservationError(new Error("Please select a date"));
			setReservationSuccessMessage(null);
			return;
		}
		setChecking(true);
		setReservationError(null);
		setReservationSuccessMessage(null);
		setAvailableSlots([]);
		setSelectedSlot("");
		try {
			const slots = await getAvailability(
				id,
				reservationDate,
				Number(partySize),
			);
			setAvailableSlots(slots);
			if (slots.length === 0) {
				setReservationError(new Error("No availability for the selected date"));
			}
		} catch (err) {
			setReservationError(err);
		} finally {
			setChecking(false);
		}
	};

	const handleReserve = async () => {
		if (!selectedSlot) {
			setReservationError(new Error("Please select a time slot"));
			setReservationSuccessMessage(null);
			return;
		}
		setReserving(true);
		setReservationError(null);
		setReservationSuccessMessage(null);
		try {
			await createReservation({
				restaurantId: id,
				reservationDate,
				reservationTime: selectedSlot,
				partySize: Number(partySize),
			});
			setReservationSuccessMessage("Reservation confirmed!");
			setTimeout(() => router.push("/reservations"), 1200);
		} catch (err) {
			setReservationError(err);
		} finally {
			setReserving(false);
		}
	};

	// ---- Comment create ----
	const handleCreateComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCommentBody.trim()) return;
		setSubmittingComment(true);
		setCommentError(null);
		try {
			const created = await createComment(id, {
				rating: newCommentRating,
				body: newCommentBody,
			});
			setComments((prev) => [created, ...prev]);
			setNewCommentBody("");
			setNewCommentRating(5);
		} catch (err) {
			setCommentError(err);
		} finally {
			setSubmittingComment(false);
		}
	};

	// ---- Comment edit ----
	const startEdit = (comment: Comment) => {
		setEditingCommentId(comment.id);
		setEditRating(comment.rating);
		setEditBody(comment.body);
	};

	const cancelEdit = () => {
		setEditingCommentId(null);
		setEditBody("");
		setEditRating(5);
	};

	const handleSaveEdit = async (commentId: string) => {
		if (!editBody.trim()) return;
		setSavingEdit(true);
		setCommentError(null);
		try {
			const updated = await updateComment(id, commentId, {
				rating: editRating,
				body: editBody,
			});
			setComments((prev) =>
				prev.map((c) => (c.id === commentId ? updated : c)),
			);
			cancelEdit();
		} catch (err) {
			setCommentError(err);
		} finally {
			setSavingEdit(false);
		}
	};

	// ---- Comment delete ----
	const handleDeleteComment = async (commentId: string) => {
		setDeletingCommentId(commentId);
		setCommentError(null);
		try {
			await deleteComment(id, commentId);
			setComments((prev) => prev.filter((c) => c.id !== commentId));
		} catch (err) {
			setCommentError(err);
		} finally {
			setDeletingCommentId(null);
		}
	};

	// ---- Render guards ----
	if (authLoading || pageLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
					<p className="mt-4 text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (pageError || !restaurant) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<div className="pt-32 text-center px-4">
					{pageError ? (
						<ApiErrorMessage
							error={pageError}
							className="max-w-xl mx-auto text-left mb-4"
						/>
					) : (
						<p className="text-destructive text-lg mb-4">
							Restaurant not found
						</p>
					)}
					<Link href="/">
						<Button variant="outline">Back to Restaurants</Button>
					</Link>
				</div>
			</div>
		);
	}

	const avgRating =
		comments.length > 0
			? (
					comments.reduce((sum, c) => sum + c.rating, 0) / comments.length
				).toFixed(1)
			: (restaurant.rating?.toFixed(1) ?? "—");

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{showEditRestaurant && (
				<RestaurantFormModal
					restaurant={restaurant}
					onClose={() => setShowEditRestaurant(false)}
					onSaved={(updated) => {
						setRestaurant(updated);
						setShowEditRestaurant(false);
					}}
				/>
			)}

			{showDeleteRestaurant && (
				<RestaurantDeleteModal
					restaurantName={restaurant.name}
					deleting={deletingRestaurant}
					error={restaurantActionError}
					onClose={handleCloseDeleteRestaurant}
					onConfirm={handleDeleteRestaurant}
				/>
			)}

			<main className="pt-16">
				{/* Hero Image */}
				<div className="relative h-96 overflow-hidden bg-muted">
					<img
						src={restaurant.image || "/placeholder.svg?height=500&width=800"}
						alt={restaurant.name}
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
				</div>

				<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="relative -mt-9 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
						<div className="flex-1">
							<div className="flex flex-wrap items-center gap-3 mb-4">
								<div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full shadow">
									<Star size={16} className="fill-amber-400 text-amber-400" />
									<span className="font-medium text-foreground text-sm">
										{avgRating}
									</span>
									<span className="text-muted-foreground text-sm">
										({comments.length} reviews)
									</span>
								</div>
								<span className="bg-card px-3 py-1 rounded-full shadow text-sm font-medium text-foreground">
									{restaurant.cuisineType}
								</span>
								{restaurant.neighborhood && (
									<span className="bg-card px-3 py-1 rounded-full shadow text-sm font-medium text-foreground">
										{restaurant.neighborhood}
									</span>
								)}
							</div>
						</div>

						<div className="flex gap-2">
							<Button
								type="button"
								variant="secondary"
								size="icon-lg"
								onClick={toggleFavourite}
								aria-label="Toggle favourite"
								className="bg-card hover:bg-muted"
							>
								<Heart
									size={18}
									className={
										isFavorited
											? "fill-destructive text-destructive"
											: "text-muted-foreground"
									}
								/>
							</Button>
							<Button
								type="button"
								variant="secondary"
								onClick={() => setShowEditRestaurant(true)}
								aria-label="Edit restaurant"
								className="bg-card hover:bg-muted text-foreground"
							>
								<Pencil size={18} />
								<span className="text-sm font-medium">Edit</span>
							</Button>
							<Button
								type="button"
								variant="secondary"
								onClick={() => {
									setRestaurantActionError(null);
									setShowDeleteRestaurant(true);
								}}
								disabled={deletingRestaurant}
								aria-label="Delete restaurant"
								className="bg-card border-destructive/40 hover:bg-red-300 text-destructive"
							>
								<Trash2 size={18} />
								<span className="text-sm font-medium">
									{deletingRestaurant ? "Deleting..." : "Delete"}
								</span>
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
						{/* Main content */}
						<div className="lg:col-span-2 space-y-8">
							<div>
								<h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 text-balance">
									{restaurant.name}
								</h1>
								<h2 className="text-2xl font-semibold text-foreground mb-3">
									About
								</h2>
								<p className="text-muted-foreground leading-relaxed">
									{restaurant.description}
								</p>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="border border-border rounded-lg p-4 flex items-start gap-3">
									<MapPin size={18} className="text-primary mt-0.5 shrink-0" />
									<div>
										<h3 className="text-sm font-semibold text-foreground">
											Address
										</h3>
										<p className="text-sm text-muted-foreground">
											{restaurant.address}
										</p>
									</div>
								</div>
								<div className="border border-border rounded-lg p-4 flex items-start gap-3">
									<Users size={18} className="text-primary mt-0.5 shrink-0" />
									<div>
										<h3 className="text-sm font-semibold text-foreground">
											Capacity
										</h3>
										<p className="text-sm text-muted-foreground">
											Up to {restaurant.capacity} guests
										</p>
									</div>
								</div>
							</div>

							{/* Reviews section */}
							<div className="border-t border-border pt-8">
								<h2 className="text-2xl font-semibold text-foreground mb-6">
									Guest Reviews
								</h2>

								{/* New comment form */}
								<form
									onSubmit={handleCreateComment}
									className="border border-border rounded-lg p-5 mb-6 bg-card"
								>
									<h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
										Write a Review
									</h3>

									{Boolean(commentError) && (
										<ApiErrorMessage error={commentError} className="mb-3" />
									)}

									<div className="mb-4">
										<label className="block text-sm font-medium text-foreground mb-2">
											Rating
										</label>
										<StarRatingInput
											value={newCommentRating}
											onChange={setNewCommentRating}
										/>
									</div>

									<div className="mb-4">
										<label className="block text-sm font-medium text-foreground mb-2">
											Comment
										</label>
										<textarea
											required
											rows={3}
											value={newCommentBody}
											onChange={(e) => setNewCommentBody(e.target.value)}
											placeholder="Share your experience..."
											className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
										/>
									</div>

									<Button
										type="submit"
										disabled={submittingComment || !newCommentBody.trim()}
										className="bg-primary hover:bg-primary/90 text-primary-foreground"
									>
										{submittingComment ? "Posting..." : "Post Review"}
									</Button>
								</form>

								{/* Comment list */}
								{comments.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No reviews yet. Be the first!
									</p>
								) : (
									<div className="space-y-4">
										{comments.map((comment) => {
											const isOwner = user?.id === comment.userId;
											const isEditing = editingCommentId === comment.id;

											return (
												<div
													key={comment.id}
													className="border border-border rounded-lg p-4"
												>
													{isEditing ? (
														<div className="space-y-3">
															<div>
																<label className="block text-sm font-medium text-foreground mb-1.5">
																	Rating
																</label>
																<StarRatingInput
																	value={editRating}
																	onChange={setEditRating}
																/>
															</div>
															<textarea
																rows={3}
																value={editBody}
																onChange={(e) => setEditBody(e.target.value)}
																className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
															/>
															<div className="flex gap-2">
																<Button
																	size="sm"
																	onClick={() => handleSaveEdit(comment.id)}
																	disabled={savingEdit || !editBody.trim()}
																	className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1"
																>
																	<Check size={14} />
																	{savingEdit ? "Saving..." : "Save"}
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={cancelEdit}
																	className="flex items-center gap-1"
																>
																	<X size={14} />
																	Cancel
																</Button>
															</div>
														</div>
													) : (
														<div className="flex items-start gap-4">
															<div className="w-9 h-9 rounded-full bg-primary/15 shrink-0 flex items-center justify-center text-primary font-semibold text-sm">
																{comment.fullName
																	.trim()
																	.slice(0, 2)
																	.toUpperCase()}
															</div>
															<div className="flex-1 min-w-0">
																<div className="flex items-center justify-between mb-1 gap-2">
																	<div className="flex items-center gap-2">
																		<span className="text-sm font-semibold text-foreground">
																			{new Date(
																				comment.createdAt,
																			).toLocaleDateString()}
																		</span>
																		<StarDisplay rating={comment.rating} />
																	</div>
																	{isOwner && (
																		<div className="flex gap-1 shrink-0">
																			<Button
																				type="button"
																				variant="ghost"
																				size="icon-xs"
																				onClick={() => startEdit(comment)}
																				aria-label="Edit comment"
																				className="text-muted-foreground hover:text-foreground hover:bg-muted"
																			>
																				<Pencil size={14} />
																			</Button>
																			<Button
																				type="button"
																				variant="ghost"
																				size="icon-xs"
																				onClick={() =>
																					handleDeleteComment(comment.id)
																				}
																				disabled={
																					deletingCommentId === comment.id
																				}
																				aria-label="Delete comment"
																				className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
																			>
																				<Trash2 size={14} />
																			</Button>
																		</div>
																	)}
																</div>
																<p className="text-sm text-muted-foreground leading-relaxed">
																	{comment.body}
																</p>
															</div>
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>

						{/* Reservation sidebar */}
						<div className="lg:col-span-1">
							<div className="sticky top-24 bg-card border border-border rounded-lg p-6 shadow-lg">
								<h3 className="text-xl font-bold text-foreground mb-6">
									Reserve a Table
								</h3>

								{reservationSuccessMessage && (
									<div className="mb-4 p-3 rounded-lg text-sm border bg-primary/10 text-primary border-primary/20">
										{reservationSuccessMessage}
									</div>
								)}
								{Boolean(reservationError) && (
									<ApiErrorMessage error={reservationError} className="mb-4" />
								)}

								<div className="space-y-4 mb-6">
									<div>
										<label className="block text-sm font-medium text-foreground mb-2">
											Date
										</label>
										<input
											type="date"
											value={reservationDate}
											min={new Date().toISOString().split("T")[0]}
											onChange={(e) => setReservationDate(e.target.value)}
											className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-foreground mb-2">
											Party Size
										</label>
										<select
											value={partySize}
											onChange={(e) => setPartySize(e.target.value)}
											className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
										>
											{[...Array(12)].map((_, i) => (
												<option key={i + 1} value={String(i + 1)}>
													{i + 1} {i === 0 ? "Guest" : "Guests"}
												</option>
											))}
										</select>
									</div>

									<Button
										onClick={handleCheckAvailability}
										disabled={checking || !reservationDate}
										className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
									>
										{checking ? "Checking..." : "Check Availability"}
									</Button>
								</div>

								{availableSlots.length > 0 && (
									<div className="mb-6">
										<label className="block text-sm font-medium text-foreground mb-3">
											Available Times
										</label>
										<div className="grid grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto">
											{availableSlots.map((slot) => (
												<Button
													type="button"
													variant="secondary"
													size="sm"
													key={slot.time}
													disabled={!slot.available}
													onClick={() => setSelectedSlot(slot.time)}
													className={`h-auto p-2 rounded-lg disabled:opacity-40 ${
														selectedSlot === slot.time
															? "bg-primary text-primary-foreground border-primary"
															: "border-border hover:border-primary/50 text-foreground"
													}`}
												>
													{slot.time}
												</Button>
											))}
										</div>

										<Button
											onClick={handleReserve}
											disabled={reserving || !selectedSlot}
											className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
										>
											{reserving ? "Reserving..." : "Complete Reservation"}
										</Button>
									</div>
								)}

								<Link href="/">
									<Button variant="outline" className="w-full">
										Back to Restaurants
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}

// ---- Helpers ----

function StarRatingInput({
	value,
	onChange,
}: {
	value: number;
	onChange: (v: number) => void;
}) {
	return (
		<div className="flex gap-1">
			{[1, 2, 3, 4, 5].map((star) => (
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					key={star}
					onClick={() => onChange(star)}
					aria-label={`${star} star`}
					className="transition"
				>
					<Star
						size={22}
						className={
							star <= value ? "fill-amber-400 text-amber-400" : "text-muted"
						}
					/>
				</Button>
			))}
		</div>
	);
}

function StarDisplay({ rating }: { rating: number }) {
	return (
		<div className="flex gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					size={13}
					className={
						star <= rating ? "fill-amber-400 text-amber-400" : "text-muted"
					}
				/>
			))}
		</div>
	);
}
