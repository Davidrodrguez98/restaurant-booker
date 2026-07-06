import { desc, eq } from "drizzle-orm";

import { db } from "@/db/db";
import { comment, type CommentInsert } from "@/db/schemas/schema";

export class CommentRepository {
  async getCommentsByRestaurantId(restaurantId: string) {
    return db
      .select()
      .from(comment)
      .where(eq(comment.restaurantId, restaurantId))
      .orderBy(desc(comment.createdAt));
  }

  async getCommentById(commentId: string) {
    const [result] = await db
      .select()
      .from(comment)
      .where(eq(comment.id, commentId))
      .limit(1);

    return result ?? null;
  }

  async createComment(
    restaurantId: string,
    userId: string,
    data: Pick<CommentInsert, "rating" | "body">,
  ) {
    const [created] = await db
      .insert(comment)
      .values({
        restaurantId,
        userId,
        createdAt: new Date(),
        ...data,
      })
      .returning();

    return created;
  }

  async updateComment(
    commentId: string,
    data: Partial<Pick<CommentInsert, "rating" | "body">>,
  ) {
    const [updated] = await db
      .update(comment)
      .set(data)
      .where(eq(comment.id, commentId))
      .returning();

    return updated ?? null;
  }

  async deleteComment(commentId: string) {
    const [deleted] = await db
      .delete(comment)
      .where(eq(comment.id, commentId))
      .returning();

    return deleted ?? null;
  }
}

export const commentRepository = new CommentRepository();
