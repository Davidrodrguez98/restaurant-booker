import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "@/utils/middleware";
import { favouriteService } from "@/services/favourite-service";
import { sendRouteError, validateRequest } from "@/utils/validation";

export const favouriteRouter: Router = Router();

const restaurantIdParamsSchema = z.object({
	restaurantId: z.guid(),
});

favouriteRouter.use(requireAuth);

/**
 * @swagger
 * components:
 *   schemas:
 *     Favourite:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         restaurantId:
 *           type: string
 *           format: uuid
 *     FavouriteWithRestaurant:
 *       allOf:
 *         - $ref: '#/components/schemas/Favourite'
 *         - type: object
 *           properties:
 *             restaurant:
 *               $ref: '#/components/schemas/Restaurant'
 *
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
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of favourite restaurants.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FavouriteWithRestaurant'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
favouriteRouter.get("", (req, res) => {
	return favouriteService
		.getMyFavourites(req.session!.user.id)
		.then((favourites) => res.json(favourites))
		.catch((err) => sendRouteError(res, err, 500, "Error fetching favourites"));
});

/**
 * @swagger
 * /api/me/favourites/{restaurantId}:
 *   post:
 *     summary: Add a restaurant to favourites
 *     tags: [Favourites]
 *     security:
 *       - cookieAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Favourite'
 *       400:
 *         description: Invalid restaurant id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurant not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Remove a restaurant from favourites
 *     tags: [Favourites]
 *     security:
 *       - cookieAuth: []
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
 *       400:
 *         description: Invalid restaurant id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Favourite not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
favouriteRouter.post("/:restaurantId", validateRequest({ params: restaurantIdParamsSchema }), (req, res) => {
	return favouriteService
		.addFavourite(req.session!.user.id, req.params.restaurantId)
		.then((favourite) => res.status(201).json(favourite))
		.catch((err) => sendRouteError(res, err, 400, "Error adding favourite"));
});

favouriteRouter.delete("/:restaurantId", validateRequest({ params: restaurantIdParamsSchema }), (req, res) => {
	return favouriteService
		.removeFavourite(req.session!.user.id, req.params.restaurantId)
		.then(() => res.status(204).send())
		.catch((err) => sendRouteError(res, err, 404, "Error removing favourite"));
});
