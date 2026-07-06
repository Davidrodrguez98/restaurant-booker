import { auth } from "@/utils/auth";
import { Request, Response, NextFunction } from "express";

export async function requireAuth(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const session = await auth.api.getSession({
		headers: req.headers,
	});

	if (!session) {
		return res.status(401).json({
			error: "Unauthorized",
		});
	}

	next();
}
