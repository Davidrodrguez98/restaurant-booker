import { AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/api";

interface Props {
	error: unknown;
	className?: string;
}

function readUnknownError(error: unknown): { message: string; code?: string } {
	if (error instanceof Error) {
		const code =
			typeof (error as { code?: unknown }).code === "string"
				? (error as { code?: string }).code
				: undefined;
		return {
			message: error.message || "An unexpected error occurred",
			code,
		};
	}

	if (typeof error === "string") {
		return {
			message: error,
		};
	}

	if (typeof error === "object" && error !== null) {
		const shaped = error as { message?: unknown; code?: unknown };
		return {
			message:
				typeof shaped.message === "string" && shaped.message.trim()
					? shaped.message
					: "An unexpected error occurred",
			code: typeof shaped.code === "string" ? shaped.code : undefined,
		};
	}

	return {
		message: "An unexpected error occurred",
	};
}

/**
 * Renders an API error with its top-level message and any field-level
 * validation details returned by the server.
 */
export function ApiErrorMessage({ error, className = "" }: Props) {
	if (!error) return null;

	const { message, code } = readUnknownError(error);
	const details = error instanceof ApiError ? error.details : [];

	return (
		<div
			role="alert"
			className={`bg-destructive/10 border border-destructive/20 rounded-lg p-3 ${className}`}
		>
			<div className="flex items-start gap-2">
				<AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-destructive">{message}</p>
					{code && (
						<p className="mt-0.5 text-xs text-destructive/80">Code: {code}</p>
					)}
					{details.length > 0 && (
						<ul className="mt-1.5 space-y-0.5">
							{details.map((d, i) => (
								<li key={i} className="text-xs text-destructive/80">
									<span className="font-medium">
										{d.field.replace(/^body\./, "")}:
									</span>{" "}
									{d.message}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
