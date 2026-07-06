import { Router } from "express";

import { requireAuth } from "@/utils/middleware";
import { favouriteService } from "@/services/favourite-service";

export const favouriteRouter: Router = Router();

favouriteRouter.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Favourites
 *   description: Manage the authenticated user's favourite restaurants.
 */

/**
 * @swagger
 * /api/me/favourites:
 *   get:
 *     summary: Get the authenticated user's favourite restaurants
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favourite restaurants.
 *       401:
 *         description: Unauthorized.
 */
favouriteRouter.get("", (req, res) => {
	return favouriteService
		.getMyFavourites(req.session!.user.id)
		.then((favourites) => res.json(favourites))
		.catch((err) => {
			console.error("Error fetching favourites:", err);
			res.status(err.status || 500).json({ error: err.message });
		});
});

/**
 * @swagger
 * /api/me/favourites/{restaurantId}:
 *   post:
 *     summary: Add a restaurant to favourites
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Restaurant added to favourites.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Restaurant not found.
 *
 *   delete:
 *     summary: Remove a restaurant from favourites
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Restaurant removed from favourites.
 *       401:
 *         description: Unauthorized.
 */
favouriteRouter.post("/:restaurantId", (req, res) => {
	return favouriteService
		.addFavourite(req.session!.user.id, req.params.restaurantId)
		.then((favourite) => res.status(201).json(favourite))
		.catch((err) => {
			console.error("Error adding favourite:", err);
			res.status(err.status || 400).json({ error: err.message });
		});
});

favouriteRouter.delete("/:restaurantId", (req, res) => {
	return favouriteService
		.removeFavourite(req.session!.user.id, req.params.restaurantId)
		.then(() => res.status(204).send())
		.catch((err) => {
			console.error("Error removing favourite:", err);
			res.status(404).json({ error: err.message });
		});
});
