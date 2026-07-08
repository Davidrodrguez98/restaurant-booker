"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiErrorMessage } from "@/components/api-error-message";

interface Props {
	restaurantName: string;
	deleting: boolean;
	error?: unknown;
	onClose: () => void;
	onConfirm: () => void;
}

export function RestaurantDeleteModal({
	restaurantName,
	deleting,
	error,
	onClose,
	onConfirm,
}: Props) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Delete restaurant"
		>
			<div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
				<div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
					<h2 className="text-xl font-bold text-foreground">Delete Restaurant</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={deleting}
						aria-label="Close"
						className="text-muted-foreground hover:text-foreground transition disabled:opacity-50"
					>
						<X size={20} />
					</button>
				</div>

				<div className="px-6 py-5 space-y-4">
					<p className="text-sm text-muted-foreground">
						Are you sure you want to delete
						<span className="font-semibold text-foreground"> {restaurantName}</span>?
						 This action cannot be undone.
					</p>

					{Boolean(error) && <ApiErrorMessage error={error} />}

					<div className="flex gap-3 pt-1">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={onClose}
							disabled={deleting}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							className="flex-1"
							onClick={onConfirm}
							disabled={deleting}
						>
							{deleting ? "Deleting..." : "Delete Restaurant"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
