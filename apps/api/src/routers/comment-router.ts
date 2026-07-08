import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "@/utils/middleware";
import { commentService } from "@/services/comment-service";
import { sendRouteError, validateRequest } from "@/utils/validation";

export const commentRouter: Router = Router();

const restaurantIdParamsSchema = z.object({
  restaurantId: z.guid(),
});

const commentIdParamsSchema = z.object({
  commentId: z.guid(),
});

const createCommentSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(1).max(2000),
});

const updateCommentSchema = createCommentSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" },
);

commentRouter.use(requireAuth);

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
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
 *         rating:
 *           type: integer
 *         body:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateComment:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *         body:
 *           type: string
 *       required:
 *         - rating
 *         - body
 *
 *     UpdateComment:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         body:
 *           type: string
 *
 * tags:
 *   name: Comments
 *   description: Comment management endpoints
 */

/**
 * @swagger
 * /api/restaurants/{restaurantId}/comments:
 *   get:
 *     summary: Get comments for a restaurant
 *     tags: [Comments]
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
 *       200:
 *         description: List of comments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
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
 *   post:
 *     summary: Create a comment for a restaurant
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateComment'
 *     responses:
 *       201:
 *         description: Comment created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid restaurant id or request body.
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
 *         description: Restaurant not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/comments/{commentId}:
 *   patch:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *               $ref: '#/components/schemas/UpdateComment'
 *     responses:
 *       200:
 *         description: Comment updated.
 *       400:
 *         description: Invalid comment id or request body.
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
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Comment not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Comment deleted.
 *       400:
 *         description: Invalid comment id.
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
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Comment not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

commentRouter
  .get(
    "/restaurants/:restaurantId/comments",
    validateRequest({ params: restaurantIdParamsSchema }),
    (req, res) => {
    const { restaurantId } = req.params;
    return commentService
      .getRestaurantComments(restaurantId)
      .then((comments) => res.json(comments))
      .catch((err) => sendRouteError(res, err, 404, "Error fetching comments"));
    },
  )
  .post(
    "/restaurants/:restaurantId/comments",
    validateRequest({ params: restaurantIdParamsSchema, body: createCommentSchema }),
    (req, res) => {
    const { restaurantId } = req.params;
    return commentService
      .createComment(restaurantId, req.session!.user.id, req.body)
      .then((comment) => res.status(201).json(comment))
      .catch((err) => sendRouteError(res, err, 400, "Error creating comment"));
    },
  )
  .patch(
    "/comments/:commentId",
    validateRequest({ params: commentIdParamsSchema, body: updateCommentSchema }),
    (req, res) => {
    const { commentId } = req.params;
    return commentService
      .updateComment(commentId, req.session!.user.id, req.body)
      .then((comment) => res.json(comment))
      .catch((err) => sendRouteError(res, err, 400, "Error updating comment"));
    },
  )
  .delete(
    "/comments/:commentId",
    validateRequest({ params: commentIdParamsSchema }),
    (req, res) => {
    const { commentId } = req.params;
    return commentService
      .deleteComment(commentId, req.session!.user.id)
      .then(() => res.status(204).send())
      .catch((err) => sendRouteError(res, err, 400, "Error deleting comment"));
    },
  );
