/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as backend_admin from "../backend/admin.js";
import type * as backend_announcements from "../backend/announcements.js";
import type * as backend_blocks from "../backend/blocks.js";
import type * as backend_content from "../backend/content.js";
import type * as backend_events from "../backend/events.js";
import type * as backend_feed from "../backend/feed.js";
import type * as backend_feedback from "../backend/feedback.js";
import type * as backend_hottestArtists from "../backend/hottestArtists.js";
import type * as backend_messages from "../backend/messages.js";
import type * as backend_moderation from "../backend/moderation.js";
import type * as backend_notifications from "../backend/notifications.js";
import type * as backend_playlists from "../backend/playlists.js";
import type * as backend_promotions from "../backend/promotions.js";
import type * as backend_storage from "../backend/storage.js";
import type * as backend_stripe from "../backend/stripe.js";
import type * as backend_subscriptions from "../backend/subscriptions.js";
import type * as backend_userEvents from "../backend/userEvents.js";
import type * as backend_users from "../backend/users.js";
import type * as constants from "../constants.js";
import type * as helpers from "../helpers.js";
import type * as index from "../index.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "backend/admin": typeof backend_admin;
  "backend/announcements": typeof backend_announcements;
  "backend/blocks": typeof backend_blocks;
  "backend/content": typeof backend_content;
  "backend/events": typeof backend_events;
  "backend/feed": typeof backend_feed;
  "backend/feedback": typeof backend_feedback;
  "backend/hottestArtists": typeof backend_hottestArtists;
  "backend/messages": typeof backend_messages;
  "backend/moderation": typeof backend_moderation;
  "backend/notifications": typeof backend_notifications;
  "backend/playlists": typeof backend_playlists;
  "backend/promotions": typeof backend_promotions;
  "backend/storage": typeof backend_storage;
  "backend/stripe": typeof backend_stripe;
  "backend/subscriptions": typeof backend_subscriptions;
  "backend/userEvents": typeof backend_userEvents;
  "backend/users": typeof backend_users;
  constants: typeof constants;
  helpers: typeof helpers;
  index: typeof index;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
