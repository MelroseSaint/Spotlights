import { defineAuth } from "@convex-dev/auth/server";
import { Credentials } from "@convex-dev/auth/providers/Credentials";

export const auth = defineAuth({
  credentials: Credentials({
    // You can customize the login flow here
    // For now, we'll use email/password
    // In a real app, you'd want to add proper validation
    async authenticate(credentials) {
      // This is a placeholder - in a real app you'd check against your database
      // For demo purposes, we'll accept any credentials
      if (credentials.email && credentials.password) {
        return {
          // In a real app, you'd look up the user by email and verify the password
          // For now, we'll create a mock user ID
          // You'll need to implement proper user lookup in your Convex functions
          token: `token-${credentials.email}`,
          // You can store additional user info here
          // For example: { userId: "some-user-id", name: "User Name" }
        };
      }
      throw new Error("Invalid credentials");
    },
  }),
});