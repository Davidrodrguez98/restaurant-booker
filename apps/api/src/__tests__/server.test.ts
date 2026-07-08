import supertest from "supertest";
import { describe, it, expect } from "@jest/globals";

import { createServer } from "../server";

describe("server", () => {
  it("health check returns 200 and status ok", async () => {
    await supertest(createServer())
      .get("/api/health")
      .expect(200)
      .then((res) => {
        expect(res.body.status).toBe("ok");
      });
  });
});
