import crypto from "node:crypto";
import { z } from "zod";
import type { Review, ReviewColumn, ReviewItem, ReviewStatus, ApprovalResult } from "../types/review.js";
import type { IpcServer } from "./ipc-server.js";

const ReviewRespondBody = z.object({
  id: z.string().min(1),
  approved: z.boolean(),
  selectedIds: z.array(z.string()),
});
const ReviewIdBody = z.object({ id: z.string().min(1) });

export class ReviewManager {
  private reviews = new Map<string, Review>();
  private waiters = new Map<string, (result: ApprovalResult) => void>();

  // ── Lifecycle ──

  create(opts: { name: string; description: string; columns: ReviewColumn[] }): Review {
    const id = crypto.randomUUID();
    const review: Review = {
      id,
      name: opts.name,
      description: opts.description,
      columns: opts.columns,
      items: [],
      status: "building",
      selectedIds: [],
      createdAt: Date.now(),
    };
    this.reviews.set(id, review);
    return review;
  }

  appendItems(id: string, items: ReviewItem[]): { appended: number; total: number } {
    const review = this.reviews.get(id);
    if (!review) throw new Error("Review not found: " + id);
    if (review.status !== "building") throw new Error(`Cannot append to review in "${review.status}" state`);
    review.items.push(...items);
    return { appended: items.length, total: review.items.length };
  }

  removeItems(id: string, itemIds: string[]): { removed: number; total: number } {
    const review = this.reviews.get(id);
    if (!review) throw new Error("Review not found: " + id);
    if (review.status !== "building") throw new Error(`Cannot remove items from review in "${review.status}" state`);
    const idsToRemove = new Set(itemIds);
    const before = review.items.length;
    review.items = review.items.filter((item) => !idsToRemove.has(item.id));
    return { removed: before - review.items.length, total: review.items.length };
  }

  setStatus(id: string, status: ReviewStatus, selectedByDefault?: boolean): Review {
    const review = this.reviews.get(id);
    if (!review) throw new Error("Review not found: " + id);

    const allowed: Record<ReviewStatus, ReviewStatus[]> = {
      building: ["pending", "closed"],
      pending: ["building", "closed"],
      approved: ["closed"],
      rejected: ["closed"],
      closed: [],
    };

    if (!allowed[review.status]?.includes(status)) {
      throw new Error(`Cannot transition from "${review.status}" to "${status}"`);
    }

    if (status === "closed") {
      this.close(id);
      return review;
    }

    review.status = status;
    if (status === "pending" && selectedByDefault !== undefined) {
      for (const item of review.items) {
        item.selected = selectedByDefault;
      }
    }
    return review;
  }



  respond(id: string, approved: boolean, selectedIds: string[]): void {
    const review = this.reviews.get(id);
    if (!review) throw new Error("Review not found: " + id);
    review.status = approved ? "approved" : "rejected";
    review.selectedIds = selectedIds;
    const waiter = this.waiters.get(id);
    if (waiter) {
      this.waiters.delete(id);
      waiter({ approved, selectedIds });
    }
  }

  close(id: string): void {
    const review = this.reviews.get(id);
    if (review) {
      review.status = "closed";
      const waiter = this.waiters.get(id);
      if (waiter) {
        this.waiters.delete(id);
        waiter({ approved: false, selectedIds: [] });
      }
    }
    this.reviews.delete(id);
  }

  // ── Queries ──

  get(id: string): Review | undefined {
    return this.reviews.get(id);
  }

  getAll(): Review[] {
    return [...this.reviews.values()];
  }

  getByStatus(...statuses: ReviewStatus[]): Review[] {
    const set = new Set(statuses);
    return [...this.reviews.values()].filter(r => set.has(r.status));
  }

  // ── Blocking wait ──

  waitForApproval(id: string, timeoutMs = 600000): Promise<ApprovalResult> {
    const review = this.reviews.get(id);
    if (!review) return Promise.reject(new Error("Review not found: " + id));
    if (review.status === "approved" || review.status === "rejected") {
      return Promise.resolve({ approved: review.status === "approved", selectedIds: review.selectedIds });
    }
    if (review.status !== "pending") {
      return Promise.reject(new Error(`Cannot wait on review in "${review.status}" state`));
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiters.delete(id);
        reject(new Error("Review timed out after " + (timeoutMs / 1000) + "s"));
      }, timeoutMs);
      this.waiters.set(id, (result) => {
        clearTimeout(timer);
        resolve(result);
      });
    });
  }

  // ── IPC handlers ──

  registerIpcHandlers(ipc: IpcServer): void {
    ipc.registerHandler("/reviews/pending", async () =>
      this.getByStatus("pending", "building")
    );

    ipc.registerHandler("/reviews/all", async () => this.getAll());

    ipc.registerHandler("/reviews/respond", async (body: unknown) => {
      const { id, approved, selectedIds } = ReviewRespondBody.parse(body);
      this.respond(id, approved, selectedIds);
      return { ok: true };
    });

    ipc.registerHandler("/reviews/close", async (body: unknown) => {
      const { id } = ReviewIdBody.parse(body);
      this.close(id);
      return { ok: true };
    });
  }
}
