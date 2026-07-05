import express, { type Express } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth";
import { router } from "./router";

export const createServer = (): Express => {
	const app = express();
	app.all("/api/auth/*", toNodeHandler(auth));
	app.use(express.json());
	  app
	    .use(cors({
			origin: ["http://localhost:3000", "http://localhost:3001"],
			methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
			credentials: true,
		}))
	app.use("/api", router);
	app.get("/", (req, res) => {
		return res.json({ message: "Hello from the API!" });
	});

	return app;
};
