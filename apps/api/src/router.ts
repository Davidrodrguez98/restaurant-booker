import { Router } from "express";
import { auth } from "./utils/auth";
import { fromNodeHeaders } from "better-auth/node";
import { requireAuth} from "./utils/session";

export const router = Router();

router
	.use(requireAuth)
	.get("/message/:name", (req, res) => {
		return res.json({ message: `hello ${req.params.name}` });
	})
	.get("/status", (_, res) => {
		return res.json({ ok: true });
	})
	.get("/me", async (req, res) => {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers),
		});
		console.log("Getting me", session);
		
		return res.json(session);
	});
