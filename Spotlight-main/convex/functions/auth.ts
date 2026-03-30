import { defineAuth } from "convex/auth";
import { db } from "../db";

export default defineAuth({
  async onAuth({ user, context }) {
    const { email } = user;
    
    // Check if user exists in database
    const existingUser = await db.query.userByEmail(email);
    
    if (!existingUser) {
      // Create new user record
      const newUser = await db.mutation.createUser({
        email,
        name: user.name || email,
        username: user.name?.replace(/\s+/g, "").toLowerCase() || email.split("@")[0],
        avatarUrl: user.picture,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { userId: newUser.id };
    }
    
    // Update user if needed
    if (existingUser.name !== user.name || existingUser.avatarUrl !== user.picture) {
      await db.mutation.updateUser({
        id: existingUser.id,
        name: user.name || existingUser.name,
        avatarUrl: user.picture || existingUser.avatarUrl,
        updatedAt: new Date(),
      });
    }
    
    return { userId: existingUser.id };
  },
});
