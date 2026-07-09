import express, { type Express } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/utils/auth";
import { restaurantRouter } from "@/routers/restaurant-router";
import { commentRouter } from "@/routers/comment-router";
import { reservationRouter } from "@/routers/reservation-router";
import swaggerUi from "swagger-ui-express";
import { favouriteRouter } from "./routers/favourite-router";
import { swaggerDocs } from "@/openapi";


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
	app.use("/api/restaurants", restaurantRouter);
	app.use("/api", commentRouter);
	app.use("/api/reservations", reservationRouter);
	app.use("/api/me/favourites", favouriteRouter);

	return app;
};
