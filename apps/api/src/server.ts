import express, { type Express } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/utils/auth";
import { restaurantRouter } from "@/routers/restaurant-router";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Restaurant Booker API",
      version: "1.0.0",
      description: "API for managing restaurants"
    }
  },
  apis: ["./src/routers/*.ts"]
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

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
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
	app.get("/api/health", (req, res) => {
		res.status(200).json({ status: "ok" });
	});
	app.use("/api/restaurants", restaurantRouter);

	return app;
};
