# Catchpoint Backend & Social Features PRD

**Version:** 1.0
**Date:** 2026-01-17
**Status:** Draft

---

## 1. Overview

### 1.1 Problem Statement

Catchpoint currently operates as a local-only PWA where fishermen log catches on their device. Users cannot share their catches with friends, discover fishing spots, compete with others, or back up their data to the cloud.

### 1.2 Solution

Add a Firebase backend to enable:

- Cloud sync and backup of all catches
- Social features (follow, feed, likes, comments, DMs)
- Leaderboards and competitions
- User profiles with fishing statistics
- Privacy-respecting location sharing

### 1.3 Success Metrics

- 50% of users create an account within first week
- 30% of users follow at least one other user
- Average 3+ catches shared publicly per active user per month
- 90% sync success rate (offline catches synced within 1 hour of connectivity)

---

## 2. Technical Architecture

### 2.1 Backend Stack: Firebase

| Service                  | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| Firebase Auth            | Email, Google, Apple, Facebook sign-in          |
| Cloud Firestore          | NoSQL database for users, catches, social graph |
| Cloud Storage            | Photo uploads                                   |
| Cloud Functions          | Leaderboard aggregation, notifications, cleanup |
| Firebase Cloud Messaging | Push notifications                              |

### 2.2 Data Model

#### Users Collection (`/users/{userId}`)

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  isPublic: boolean; // Profile visibility

  // Stats (denormalized for performance)
  stats: {
    totalCatches: number;
    speciesCount: number;
    biggestFish: { species: string; weight: number; unit: "lb" | "kg" };
    mostCaughtSpecies: string;
    catchStreak: number; // consecutive days
  };

  // Social counts
  followersCount: number;
  followingCount: number;

  // Settings
  notificationSettings: {
    newFollower: boolean;
    likes: boolean;
    comments: boolean;
    leaderboardChanges: boolean;
  };
}
```

#### Catches Collection (`/catches/{catchId}`)

```typescript
interface CloudCatch {
  id: string;
  userId: string;
  localId: string; // Original Dexie ID for sync

  // Core data
  species: string;
  weight: number | null;
  length: number | null;
  unit: "lb" | "kg" | "cm" | "in";
  timestamp: Timestamp;
  notes: string;
  photoURL: string | null;

  // Location (fuzzy - ~1 mile radius applied on write)
  location: {
    fuzzyLat: number;
    fuzzyLng: number;
    waterBody: string | null; // "Lake Michigan", "Colorado River"
    region: string; // For regional leaderboards
  };

  // Visibility
  isPublic: boolean; // false = only visible to self

  // Weather (synced from local)
  weather: {
    temp: number;
    conditions: string;
    windSpeed: number;
    pressure: number;
  } | null;

  // Social (denormalized counts)
  likesCount: number;
  commentsCount: number;

  // Sync metadata
  syncedAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Social Graph (`/follows/{id}`)

```typescript
interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
}
// Indexed both ways for efficient queries
```

#### Likes (`/likes/{catchId}/users/{userId}`)

```typescript
interface Like {
  userId: string;
  createdAt: Timestamp;
}
```

#### Comments (`/catches/{catchId}/comments/{commentId}`)

```typescript
interface Comment {
  id: string;
  userId: string;
  userDisplayName: string; // Denormalized
  userPhotoURL: string | null;
  text: string;
  createdAt: Timestamp;
}
```

#### Direct Messages (`/conversations/{conversationId}`)

```typescript
interface Conversation {
  id: string;
  participants: string[]; // [userId1, userId2]
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
  unreadCount: { [userId: string]: number };
}

// Subcollection: /conversations/{id}/messages/{messageId}
interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  readAt: Timestamp | null;
}
```

#### Leaderboards (`/leaderboards/{type}`)

```typescript
interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string | null;
  value: number; // weight, count, etc.
  rank: number;
  metadata: {
    species?: string;
    catchId?: string;
    photoURL?: string;
  };
}

// Types:
// - global_biggest_{species}
// - global_most_catches
// - weekly_biggest_{species}
// - monthly_catches
// - region_{regionCode}_biggest
```

### 2.3 Sync Architecture

```
+-------------------------------------------------------------+
|                      Client (PWA)                           |
+-------------------------------------------------------------+
|  IndexedDB (Dexie)          |  Firebase SDK                 |
|  - Primary data store       |  - Auth state                 |
|  - Offline-first            |  - Realtime listeners         |
|  - syncStatus per catch     |  - Firestore cache            |
+--------------+--------------+---------------+---------------+
               |                              |
               |   Sync Service               |
               |   - On connectivity change   |
               |   - On catch create/update   |
               |   - Bidirectional merge      |
               v                              v
+-------------------------------------------------------------+
|                     Cloud Firestore                          |
|  - Source of truth for shared data                          |
|  - Security rules enforce privacy                           |
+-------------------------------------------------------------+
```

**Sync Rules:**

1. Local IndexedDB remains source of truth for user's own catches
2. On catch create/update -> sync to Firestore (queue if offline)
3. Firestore listener updates local cache for feed data
4. Conflict resolution: last-write-wins with timestamp comparison
5. Deleted catches: soft-delete with `deletedAt` field

---

## 3. Features

### 3.1 Authentication

#### Sign Up / Sign In

- **Email/Password**: Standard flow with email verification
- **Google Sign-In**: One-tap on mobile, popup on desktop
- **Apple Sign-In**: Required for iOS, available everywhere
- **Facebook Login**: Optional social login

#### Account Linking

- Users can link multiple auth providers to one account
- Prevents duplicate accounts when trying different login methods

#### Session Management

- Persistent sessions (stay logged in)
- Multi-device support
- Sign out from all devices option

### 3.2 User Profiles

#### Profile Page (`/profile/{userId}`)

- Display name and photo
- Public/private toggle
- Stats dashboard:
  - Total catches
  - Species caught (unique count)
  - Biggest fish (overall, with photo)
  - Most caught species
  - Current streak (days)
  - Member since
- Recent catches grid (public only for others)
- Follow/Following counts
- Follow button (for other users)
- Message button (for other users)

#### Profile Editing

- Change display name
- Upload/change photo (cropped, compressed)
- Toggle profile visibility
- Notification preferences
- Connected accounts management

### 3.3 Social Feed

#### Home Feed (`/feed`)

- Chronological feed of catches from followed users
- Public catches from followed users only
- Pull-to-refresh
- Infinite scroll pagination
- Each catch card shows:
  - User avatar, name, timestamp
  - Catch photo (tap to fullscreen)
  - Species, size, fuzzy location
  - Like count, comment count
  - Like button, comment button, share button

#### Discover Tab (`/discover`)

- Public catches from all users (trending/recent)
- Search users by name
- Suggested users to follow (based on region, activity)
- Trending species this week

### 3.4 Catch Interactions

#### Likes

- Tap heart to like/unlike
- See who liked (tap like count)
- Notification to catch owner

#### Comments

- View all comments on a catch
- Add comment (max 500 chars)
- Delete own comments
- Catch owner can delete any comment on their catch

#### Sharing

- Share catch to external apps (native share sheet)
- Copy link to catch
- Share to feed (if catch was private, prompts to make public)

### 3.5 Direct Messages

#### Conversations List (`/messages`)

- List of all conversations
- Sorted by most recent message
- Unread indicator
- Search conversations

#### Chat View (`/messages/{conversationId}`)

- Real-time messaging
- Message bubbles (sent/received)
- Timestamp grouping
- Typing indicator (nice-to-have)
- Send photos (from catch or camera)

#### Message Requests

- Messages from non-followers go to "Requests" folder
- Accept/Decline message request
- Block user option

### 3.6 Leaderboards

#### Global Leaderboards (`/leaderboards`)

**All-Time:**

- Biggest fish per species (top 10)
- Most catches overall (top 50)
- Most species caught (top 50)

**Time-Based:**

- Weekly biggest catch (any species)
- Monthly most catches
- Seasonal challenges (Spring Bass Bash, etc.)

**Location-Based:**

- Regional leaderboards (auto-detected from user's catches)
- "Local Heroes" - top anglers in your area

#### Leaderboard Entry

- Rank, user photo, name
- Value (weight, count, etc.)
- Tap to view their profile
- If current user is on board, highlight and show "You"

#### My Rankings

- Section showing user's current ranks across boards
- "X away from Top 10" motivation

### 3.7 Privacy & Fuzzy Locations

#### Location Fuzzing Algorithm

```typescript
function fuzzyLocation(
  exactLat: number,
  exactLng: number,
): { lat: number; lng: number } {
  // Add random offset within ~1 mile (1.6km) radius
  const radiusKm = 1.6;
  const radiusLat = radiusKm / 111; // ~111km per degree latitude
  const radiusLng = radiusKm / (111 * Math.cos((exactLat * Math.PI) / 180));

  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusKm;

  return {
    lat: exactLat + (distance / 111) * Math.cos(angle),
    lng:
      exactLng +
      (distance / (111 * Math.cos((exactLat * Math.PI) / 180))) *
        Math.sin(angle),
  };
}
```

#### Privacy Controls

- **Profile visibility**: Public or Private
  - Private: only followers can see catches in feed
  - Public: catches appear in Discover
- **Per-catch**: Not exposed in UI (v1), all catches follow profile setting
- **Exact location**: NEVER exposed to other users, only fuzzy

#### Data Retention

- Exact GPS stored locally only
- Cloud only receives fuzzy coordinates
- User can delete account and all cloud data

### 3.8 Notifications

#### In-App Notifications (`/notifications`)

- New follower
- Like on your catch
- Comment on your catch
- Leaderboard rank change (entered top 10, lost position)
- Weekly summary (your stats this week)

#### Push Notifications (Optional)

- User opts in per category in settings
- Badge count on app icon
- Tap notification -> deep link to relevant screen

### 3.9 Cloud Sync & Migration

#### First Sign-In Migration

1. Detect existing local catches (IndexedDB)
2. Show migration prompt: "Sync X existing catches to cloud?"
3. On confirm:
   - Add `syncStatus: 'pending'` to all local catches
   - Mark all as `isPublic: false` (private by default)
   - Queue for batch upload
4. Background upload with progress indicator
5. User can later make catches public individually or in bulk

#### Ongoing Sync

- New catches sync immediately when online
- Offline catches queued with retry logic
- Sync status indicator in UI (checkmark synced, arrow syncing, warning failed)
- Manual "Sync Now" button in settings

#### Conflict Resolution

- Server timestamp wins for same catch edited on multiple devices
- Merge non-conflicting fields
- Log conflicts for debugging

---

## 4. User Flows

### 4.1 First-Time User (New Account)

```
Open App -> See onboarding -> Sign up ->
Create profile (name, photo) ->
Suggested users to follow ->
Empty feed with "Log your first catch!" CTA
```

### 4.2 Returning User (Has Local Data)

```
Open App -> Sign in ->
Migration prompt ("Sync 47 catches?") -> Confirm ->
Background sync starts -> Progress toast ->
Feed with followed users' catches
```

### 4.3 Logging a Catch (Logged In)

```
Tap Quick Capture -> Auto GPS + timestamp ->
Add details (species, size, photo) -> Save ->
Catch saved locally + sync queued ->
Toast: "Catch synced" ->
Optional: "Share to feed?" prompt
```

### 4.4 Discovering & Following

```
Go to Discover -> Browse recent public catches ->
See interesting angler -> Tap profile ->
View their stats & catches -> Tap "Follow" ->
Their catches now appear in Home Feed
```

### 4.5 Interacting with Catches

```
Scrolling feed -> See friend's catch ->
Tap heart to like -> Tap comments ->
Type "Nice bass!" -> Send ->
Friend gets notification
```

---

## 5. UI/UX Requirements

### 5.1 New Screens

| Screen                | Route                        | Priority |
| --------------------- | ---------------------------- | -------- |
| Sign In / Sign Up     | `/auth`                      | P0       |
| Profile (own)         | `/profile`                   | P0       |
| Profile (other)       | `/profile/:userId`           | P0       |
| Edit Profile          | `/profile/edit`              | P0       |
| Home Feed             | `/feed`                      | P0       |
| Discover              | `/discover`                  | P0       |
| Catch Detail (social) | `/catch/:id`                 | P0       |
| Leaderboards          | `/leaderboards`              | P1       |
| Messages List         | `/messages`                  | P1       |
| Chat                  | `/messages/:conversationId`  | P1       |
| Notifications         | `/notifications`             | P1       |
| Followers/Following   | `/profile/:userId/followers` | P2       |

### 5.2 Modified Screens

| Screen       | Changes                                                  |
| ------------ | -------------------------------------------------------- |
| Home         | Add "Sign in to sync" banner if logged out               |
| Settings     | Add account section, sync status, notification settings  |
| Catch Detail | Add like, comment, share buttons if viewing shared catch |
| Log          | Add sync status indicators on catch cards                |
| Bottom Nav   | Add Feed tab (when logged in), badge for notifications   |

### 5.3 Components

- `AuthGate` - Wrapper for protected routes
- `UserAvatar` - Profile photo with fallback
- `FollowButton` - Follow/Unfollow with loading state
- `CatchFeedCard` - Social catch card for feed
- `LikeButton` - Animated heart
- `CommentSection` - Comments list + input
- `NotificationBadge` - Unread count badge
- `SyncStatusIndicator` - Per-catch sync status
- `LeaderboardRow` - Ranking entry
- `MessageBubble` - Chat message

### 5.4 Design Considerations

- Existing catch cards should work in feed with minimal changes
- Dark mode must work for all new screens
- Loading skeletons for feed, profiles, etc.
- Empty states for new users (no catches, no followers)
- Error states with retry actions

---

## 6. Security & Rules

### 6.1 Firestore Security Rules (Summary)

```javascript
// Users: Read public or own, write own
// Catches: Read public or own or follower's, write own
// Follows: Read any, write own
// Likes: Read any, write own
// Comments: Read if can read parent catch, write own
// Messages: Read/write only participants
```

### 6.2 Cloud Functions

| Function                  | Trigger            | Purpose                         |
| ------------------------- | ------------------ | ------------------------------- |
| `onUserCreate`            | Auth create        | Initialize user document        |
| `onCatchCreate`           | Firestore create   | Update user stats, leaderboards |
| `onCatchDelete`           | Firestore delete   | Update user stats, leaderboards |
| `onFollow`                | Firestore create   | Notify user, update counts      |
| `onLike`                  | Firestore create   | Notify catch owner              |
| `onComment`               | Firestore create   | Notify catch owner              |
| `updateLeaderboards`      | Scheduled (hourly) | Recalculate rankings            |
| `cleanupOldNotifications` | Scheduled (daily)  | Delete notifications > 30 days  |

---

## 7. Implementation Phases

Given the choice of full feature set for v1, here's the recommended implementation order:

### Phase 1: Foundation (Week 1-2)

1. Firebase project setup
2. Authentication (all providers)
3. User profile CRUD
4. Basic Firestore structure
5. Security rules (draft)

### Phase 2: Core Sync (Week 2-3)

6. Catch sync service
7. Migration flow for existing catches
8. Sync status UI
9. Photo upload to Cloud Storage
10. Fuzzy location processing

### Phase 3: Social Graph (Week 3-4)

11. Follow/unfollow
12. Home feed (following)
13. User search
14. Discover feed (public)
15. Profile pages

### Phase 4: Interactions (Week 4-5)

16. Likes
17. Comments
18. Share functionality
19. Direct messages
20. Notifications (in-app)

### Phase 5: Competitions (Week 5-6)

21. Leaderboard data structure
22. Cloud functions for rankings
23. Leaderboard UI
24. Regional detection
25. Time-based challenges

### Phase 6: Polish (Week 6-7)

26. Push notifications
27. Security rules audit
28. Performance optimization
29. Error handling & edge cases
30. Testing & QA

---

## 8. Dependencies & Costs

### 8.1 Firebase Pricing (Blaze Plan Estimates)

| Service   | Free Tier      | Estimated Monthly (1K users) |
| --------- | -------------- | ---------------------------- |
| Auth      | 50K MAU        | $0                           |
| Firestore | 50K reads/day  | ~$5-15                       |
| Storage   | 5GB            | ~$2-5                        |
| Functions | 2M invocations | ~$0-5                        |
| FCM       | Unlimited      | $0                           |
| **Total** | -              | **~$10-25/month**            |

### 8.2 Required API Keys (New)

- Firebase config (public, in app)
- Firebase Admin SDK (server/functions only)

### 8.3 Client Dependencies (New)

```json
{
  "firebase": "^10.x",
  "react-firebase-hooks": "^5.x"
}
```

---

## 9. Open Questions

1. **Moderation**: How to handle inappropriate content/spam? (Future: reporting, admin tools)
2. **Verification**: Any way to verify catches aren't fake? (Community flagging?)
3. **Monetization**: Premium features later? (Ad-free, extended stats, custom challenges)
4. **Data export**: Should users be able to export all their cloud data?

---

## 10. Acceptance Criteria

### Must Have (Launch Blockers)

- [ ] Users can sign up/in with email or social
- [ ] Existing catches migrate to cloud on first sign-in
- [ ] New catches sync automatically when online
- [ ] Users can follow others and see their catches in feed
- [ ] Fuzzy locations work correctly (~1 mile offset)
- [ ] Private profiles hide catches from non-followers
- [ ] Leaderboards show accurate rankings
- [ ] App works fully offline (degrades gracefully when signed in)

### Should Have

- [ ] Push notifications for important events
- [ ] Direct messaging between users
- [ ] All auth providers working (Google, Apple, Facebook)
- [ ] Smooth migration UX with progress

### Nice to Have

- [ ] Typing indicators in chat
- [ ] Read receipts
- [ ] User blocking
- [ ] Content reporting

---

## Appendix: Fuzzy Location Visualization

```
Exact Location: *
Fuzzy Location: o (somewhere in circle)

         ~1 mile radius
        +-------------+
       /               \
      |        *        |
      |     o           |
       \               /
        +-------------+

Other users see: o
Owner sees: * (on their own catches only)
```
