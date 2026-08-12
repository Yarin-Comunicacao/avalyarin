import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.JWT_SECRET = "test-session-secret-that-is-long-enough-32";
  process.env.VITE_APP_ID = "avalyarin-test";
});

describe("Session token", () => {
  it("accepts a valid token when the user name is empty", async () => {
    const { sdk } = await import("./_core/sdk");
    const token = await sdk.createSessionToken("local_test_user", { name: "" });
    const session = await sdk.verifySession(token);

    expect(session).toEqual({
      openId: "local_test_user",
      appId: "avalyarin-test",
      name: "",
    });
  });
});
