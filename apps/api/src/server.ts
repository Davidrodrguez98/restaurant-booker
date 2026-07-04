import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth";

export const createServer = (): Express => {
  const app = express();
  app.all("/api/*", toNodeHandler(auth));
  app.use(express.json());
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors({
		methods: ["GET", "POST", "PATCH", "DELETE"],
		credentials: true,
	}))
    .get("/api/message/:name", (req, res) => {
      return res.json({ message: `hello ${req.params.name}` });
    })
    .get("/api/status", (_, res) => {
      return res.json({ ok: true });
    })
	.get("/api/me", async (req, res) => {
 	const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
	return res.json(session);
});

  return app;
};
