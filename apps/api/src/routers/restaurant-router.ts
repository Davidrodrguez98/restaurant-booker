import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "@/utils/middleware";
import { restaurantService } from "@/services/restaurant-service";
import { reservationService } from "@/services/reservation-service";
import { sendRouteError, validateRequest } from "@/utils/validation";

export const restaurantRouter: Router = Router();

const restaurantIdParamsSchema = z.object({
  id: z.guid(),
});

const availabilityParamsSchema = z.object({
  restaurantId: z.guid(),
});

const availabilityQuerySchema = z.object({
  date: z.iso.date(),
  partySize: z.coerce.number().int().positive(),
});

const createRestaurantSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1),
  address: z.string().trim().min(1).max(255),
  neighborhood: z.string().trim().min(1).max(100),
  image: z.string().trim().min(1).max(500),
  cuisineType: z.enum(["ASIAN", "PIZZA", "AMERICAN", "MEXICAN"]),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  capacity: z.number().int().positive(),
});

const updateRestaurantSchema = createRestaurantSchema.partial().refine(
  (data: Partial<z.infer<typeof createRestaurantSchema>>) =>
    Object.keys(data).length > 0,
  { message: "At least one field is required" },
);

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
 *         neighborhood:
 *           type: string
 *         image:
 *           type: string
 *         cuisineType:
 *           type: string
 *           enum: [ASIAN, PIZZA, AMERICAN, MEXICAN]
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         rating:
 *           type: number
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
 *         neighborhood:
 *           type: string
 *         image:
 *           type: string
 *         cuisineType:
 *           type: string
 *           enum: [ASIAN, PIZZA, AMERICAN, MEXICAN]
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
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
 *         neighborhood:
 *           type: string
 *         image:
 *           type: string
 *         cuisineType:
 *           type: string
 *           enum: [ASIAN, PIZZA, AMERICAN, MEXICAN]
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
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
 *       - cookieAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - cookieAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     tags: [Restaurants]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Restaurant found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid restaurant id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *
 *   patch:
 *     summary: Update a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid restaurant id or request body.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *
 *   delete:
 *     summary: Delete a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Restaurant deleted.
 *       404:
 *         description: Restaurant not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid restaurant id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *
 * /api/restaurants/{restaurantId}/availability:
 *   get:
 *     summary: Get availability slots for a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: partySize
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: List of availability slots.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   time:
 *                     type: string
 *                   capacity:
 *                     type: integer
 *                   available:
 *                     type: boolean
 *                   remainingCapacity:
 *                     type: integer
 *       400:
 *         description: Invalid query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Restaurant not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

restaurantRouter
  .get(
    "/:restaurantId/availability",
    validateRequest({
      params: availabilityParamsSchema,
      query: availabilityQuerySchema,
    }),
    (req, res) => {
      const { restaurantId } = req.params;
      const { date, partySize } = req.query as unknown as {
        date: string;
        partySize: number;
      };

      return reservationService
        .getAvailability(restaurantId, date, partySize)
        .then((availability) => res.json(availability))
        .catch((err) => sendRouteError(res, err, 400, "Error fetching availability"));
    },
  )
  .get("", (req, res) => {
    return restaurantService
      .getAllRestaurants()
      .then((restaurants) => res.json(restaurants))
      .catch((err) => sendRouteError(res, err, 500, "Error fetching restaurants"));
  })
  .get("/:id", validateRequest({ params: restaurantIdParamsSchema }), (req, res) => {
    const { id } = req.params;

    return restaurantService
      .getRestaurantById(id)
      .then((restaurant) => res.json(restaurant))
      .catch((err) => sendRouteError(res, err, 404, "Error fetching restaurant"));
  })
  .post("", validateRequest({ body: createRestaurantSchema }), (req, res) => {
    const data = req.body as z.infer<typeof createRestaurantSchema>;

    return restaurantService
      .createRestaurant(data)
      .then((restaurant) => res.status(201).json(restaurant))
      .catch((err) => sendRouteError(res, err, 400, "Error creating restaurant"));
  })
  .patch(
    "/:id",
    validateRequest({ params: restaurantIdParamsSchema, body: updateRestaurantSchema }),
    (req, res) => {
      const { id } = req.params;
      const data = req.body as z.infer<typeof updateRestaurantSchema>;

      return restaurantService
        .updateRestaurant(id, data)
        .then((restaurant) => res.json(restaurant))
        .catch((err) => sendRouteError(res, err, 404, "Error updating restaurant"));
    },
  )
  .delete("/:id", validateRequest({ params: restaurantIdParamsSchema }), (req, res) => {
    const { id } = req.params;

    return restaurantService
      .deleteRestaurant(id)
      .then(() => res.status(204).send())
      .catch((err) => sendRouteError(res, err, 404, "Error deleting restaurant"));
  });
