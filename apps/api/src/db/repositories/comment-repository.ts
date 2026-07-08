import { desc, eq, getTableColumns } from "drizzle-orm";

import { db } from "@/db/db";
import { user } from "@/db/schemas/auth";
import {
  comment,
  type CommentInsert,
  type CommentSelect,
} from "@/db/schemas/schema";

export type CommentWithAuthor = CommentSelect & {
  fullName: string;
};

const commentColumns = getTableColumns(comment);

export class CommentRepository {
  async getCommentsByRestaurantId(restaurantId: string) {
    return db
      .select({
        ...commentColumns,
        fullName: user.name,
      })
      .from(comment)
      .innerJoin(user, eq(comment.userId, user.id))
      .where(eq(comment.restaurantId, restaurantId))
      .orderBy(desc(comment.createdAt));
  }

  private async getCommentWithAuthorById(commentId: string) {
    const [result] = await db
      .select({
        ...commentColumns,
        fullName: user.name,
      })
      .from(comment)
      .innerJoin(user, eq(comment.userId, user.id))
      .where(eq(comment.id, commentId))
      .limit(1);

    return result ?? null;
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
      .returning({ id: comment.id });

    const commentWithAuthor = await this.getCommentWithAuthorById(created.id);

    if (!commentWithAuthor) {
      throw new Error("Unable to load created comment");
    }

    return commentWithAuthor;
  }

  async updateComment(
    commentId: string,
    data: Partial<Pick<CommentInsert, "rating" | "body">>,
  ) {
    const [updated] = await db
      .update(comment)
      .set(data)
      .where(eq(comment.id, commentId))
      .returning({ id: comment.id });

    if (!updated) {
      return null;
    }

    return this.getCommentWithAuthorById(updated.id);
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
