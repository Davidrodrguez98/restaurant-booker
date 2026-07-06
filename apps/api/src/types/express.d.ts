import "express";

declare global {
	namespace Express {
		interface Request {
			session: Awaited<
				ReturnType<typeof import("@/utils/auth").auth.api.getSession>
			>;
		}
	}
}
