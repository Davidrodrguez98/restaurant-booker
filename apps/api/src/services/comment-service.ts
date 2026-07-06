import {
  commentRepository,
  CommentRepository,
} from "@/db/repositories/comment-repository";
import {
  restaurantRepository,
  RestaurantRepository,
} from "@/db/repositories/restaurant-repository";
import type { CommentInsert } from "@/db/schemas/schema";
import { ensureRestaurantExists } from "@/utils/ensure-restaurant-exists";

export class CommentService {
  constructor(
    private readonly repository: CommentRepository = commentRepository,
    private readonly restaurants: RestaurantRepository = restaurantRepository,
  ) {}

  async getRestaurantComments(restaurantId: string) {
    await ensureRestaurantExists(restaurantId, this.restaurants);

    return this.repository.getCommentsByRestaurantId(restaurantId);
  }

  async createComment(
    restaurantId: string,
    userId: string,
    data: Pick<CommentInsert, "rating" | "body">,
  ) {
    await ensureRestaurantExists(restaurantId, this.restaurants);

    return this.repository.createComment(restaurantId, userId, data);
  }

  async updateComment(
    commentId: string,
    userId: string,
    data: Partial<Pick<CommentInsert, "rating" | "body">>,
  ) {
    const existingComment = await this.repository.getCommentById(commentId);

    if (!existingComment) {
      const error = new Error("Comment not found") as Error & { status?: number };
      error.status = 404;
      throw error;
    }

    if (existingComment.userId !== userId) {
      const error = new Error("Forbidden") as Error & { status?: number };
      error.status = 403;
      throw error;
    }

    return this.repository.updateComment(commentId, data);
  }

  async deleteComment(commentId: string, userId: string) {
    const existingComment = await this.repository.getCommentById(commentId);

    if (!existingComment) {
      const error = new Error("Comment not found") as Error & { status?: number };
      error.status = 404;
      throw error;
    }

    if (existingComment.userId !== userId) {
      const error = new Error("Forbidden") as Error & { status?: number };
      error.status = 403;
      throw error;
    }

    return this.repository.deleteComment(commentId);
  }
}

export const commentService = new CommentService();
