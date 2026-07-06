import { Router } from "express";

import { requireAuth } from "@/utils/middleware";
import { restaurantService } from "@/services/restaurant-service";

export const restaurantRouter: Router = Router();

restaurantRouter.use(requireAuth);

/**
 * @swagger
 * components:
 *   schemas:
 *     Restaurant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         capacity:
 *           type: integer
 *       required:
 *         - id
 *         - name
 *         - address
 *         - capacity
 *
 *     CreateRestaurant:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         capacity:
 *           type: integer
 *       required:
 *         - name
 *         - address
 *         - capacity
 *
 *     UpdateRestaurant:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         capacity:
 *           type: integer
 *
 * tags:
 *   name: Restaurants
 *   description: Restaurant management endpoints
 */

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     summary: Get all restaurants
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of restaurants.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 *       500:
 *         description: Internal server error.
 *
 *   post:
 *     summary: Create a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRestaurant'
 *     responses:
 *       201:
 *         description: Restaurant created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Invalid request body.
 *
 * /api/restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found.
 *
 *   patch:
 *     summary: Update a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRestaurant'
 *     responses:
 *       200:
 *         description: Restaurant updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found.
 *
 *   delete:
 *     summary: Delete a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Restaurant deleted.
 *       404:
 *         description: Restaurant not found.
 */

restaurantRouter
  .get("", (req, res) => {
    return restaurantService
      .getAllRestaurants()
      .then((restaurants) => res.json(restaurants))
      .catch((err) => {
        console.error("Error fetching restaurants:", err);
        res.status(err.status || 500).json({ error: err.message });
      });
  })
  .get("/:id", (req, res) => {
    const { id } = req.params;
    return restaurantService
      .getRestaurantById(id)
      .then((restaurant) => res.json(restaurant))
      .catch((err) => {
        console.error("Error fetching restaurant:", err);
        res.status(err.status || 404).json({ error: err.message });
      });
  })
  .post("", (req, res) => {
    const data = req.body;
    return restaurantService
      .createRestaurant(data)
      .then((restaurant) => res.status(201).json(restaurant))
      .catch((err) => {
        console.error("Error creating restaurant:", err);
        res.status(err.status || 400).json({ error: err.message });
      });
  })
  .patch("/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    return restaurantService
      .updateRestaurant(id, data)
      .then((restaurant) => res.json(restaurant))
      .catch((err) => {
        console.error("Error updating restaurant:", err);
        res.status(err.status || 404).json({ error: err.message });
      });
  })
  .delete("/:id", (req, res) => {
    const { id } = req.params;
    return restaurantService
      .deleteRestaurant(id)
      .then(() => res.status(204).send())
      .catch((err) => {
        console.error("Error deleting restaurant:", err);
        res.status(err.status || 404).json({ error: err.message });
      });
  });
