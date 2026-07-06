import express, { type Express } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth";
import { router } from "./router";

export const createServer = (): Express => {
	const app = express();

	app.disable("x-powered-by");
	app.use(
		cors({
			origin: "http://localhost:3000",
			methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
			credentials: true,
		}),
	);
	app.all("/api/auth/*", toNodeHandler(auth));
	app.use(express.json());
	app.use("/api", router);

	return app;
};
