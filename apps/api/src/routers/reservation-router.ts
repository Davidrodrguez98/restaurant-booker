import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "@/utils/middleware";
import { reservationService } from "@/services/reservation-service";
import { sendRouteError, validateRequest } from "@/utils/validation";

export const reservationRouter: Router = Router();

const reservationIdParamsSchema = z.object({
	reservationId: z.guid(),
});

const createReservationSchema = z.object({
	restaurantId: z.guid(),
	reservationDate: z.iso.date(),
	reservationTime: z.iso.time({ precision: -1 }),
	partySize: z.number().int().positive(),
});

reservationRouter.use(requireAuth);

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         restaurantId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         reservationDate:
 *           type: string
 *           format: date
 *         reservationTime:
 *           type: string
 *           format: time
 *         partySize:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [CONFIRMED, CANCELLED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateReservation:
 *       type: object
 *       properties:
 *         restaurantId:
 *           type: string
 *           format: uuid
 *         reservationDate:
 *           type: string
 *           format: date
 *         reservationTime:
 *           type: string
 *           example: "19:30"
 *         partySize:
 *           type: integer
 *           minimum: 1
 *       required:
 *         - restaurantId
 *         - reservationDate
 *         - reservationTime
 *         - partySize
 *
 * tags:
 *   name: Reservations
 *   description: Reservation management endpoints
 */

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a reservation
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservation'
 *     responses:
 *       201:
 *         description: Reservation created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Invalid request payload or reservation is in the past.
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
 *       404:
 *         description: Restaurant or reservation settings not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Slot capacity exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/reservations/me:
 *   get:
 *     summary: Get my reservations
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of reservations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/reservations/{reservationId}:
 *   get:
 *     summary: Get a reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Invalid reservation id.
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
 *         description: Reservation not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/reservations/{reservationId}/cancel:
 *   patch:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation cancelled.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Invalid reservation id.
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
 *       403:
 *         description: Reservation does not belong to the authenticated user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reservation not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Reservation already cancelled.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

reservationRouter
	.post("", validateRequest({ body: createReservationSchema }), (req, res) => {
		return reservationService
			.createReservation(req.session!.user.id, req.body)
			.then((reservation) => res.status(201).json(reservation))
			.catch((err) => sendRouteError(res, err, 400, "Error creating reservation"));
	})
	.get("/me", (req, res) => {
		return reservationService
			.getMyReservations(req.session!.user.id)
			.then((reservations) => res.json(reservations))
			.catch((err) => sendRouteError(res, err, 500, "Error fetching reservations"));
	})
	.get("/:reservationId", validateRequest({ params: reservationIdParamsSchema }), (req, res) => {
		const { reservationId } = req.params;
		return reservationService
			.getReservationById(reservationId)
			.then((reservation) => res.json(reservation))
			.catch((err) => sendRouteError(res, err, 404, "Error fetching reservation"));
	})
	.patch("/:reservationId/cancel", validateRequest({ params: reservationIdParamsSchema }), (req, res) => {
		const { reservationId } = req.params;
		return reservationService
			.cancelReservation(reservationId, req.session!.user.id)
			.then((reservation) => res.json(reservation))
			.catch((err) => sendRouteError(res, err, 400, "Error cancelling reservation"));
	});
