import { Router } from "express";

import { requireAuth } from "@/utils/middleware";
import { commentService } from "@/services/comment-service";

export const commentRouter: Router = Router();

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
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *
 *   post:
 *     summary: Create a comment for a restaurant
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
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
 *
 * /api/comments/{commentId}:
 *   patch:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateComment'
 *     responses:
 *       200:
 *         description: Comment updated.
 *
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Comment deleted.
 */

commentRouter
  .get("/restaurants/:restaurantId/comments", (req, res) => {
    const { restaurantId } = req.params;
    return commentService
      .getRestaurantComments(restaurantId)
      .then((comments) => res.json(comments))
      .catch((err) => {
        console.error("Error fetching comments:", err);
        res.status(err.status || 404).json({ error: err.message });
      });
  })
  .post("/restaurants/:restaurantId/comments", (req, res) => {
    const { restaurantId } = req.params;
    return commentService
      .createComment(restaurantId, req.session!.user.id, req.body)
      .then((comment) => res.status(201).json(comment))
      .catch((err) => {
        console.error("Error creating comment:", err);
        res.status(err.status || 400).json({ error: err.message });
      });
  })
  .patch("/comments/:commentId", (req, res) => {
    const { commentId } = req.params;
    return commentService
      .updateComment(commentId, req.session!.user.id, req.body)
      .then((comment) => res.json(comment))
      .catch((err) => {
        console.error("Error updating comment:", err);
        res.status(err.status || 400).json({ error: err.message });
      });
  })
  .delete("/comments/:commentId", (req, res) => {
    const { commentId } = req.params;
    return commentService
      .deleteComment(commentId, req.session!.user.id)
      .then(() => res.status(204).send())
      .catch((err) => {
        console.error("Error deleting comment:", err);
        res.status(err.status || 400).json({ error: err.message });
      });
  });
