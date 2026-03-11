# Social Trading — Design Document

> **Status**: Ready for Implementation
> **Date**: 2026-03-11
> **Depends on**: social-trading.plan.md

---

## 1. Prisma Schema

```prisma
model Idea {
  id          String        @id @default(cuid())
  userId      String
  ticker      String
  market      String
  direction   String        // "LONG" | "SHORT"
  title       String
  content     String        @db.Text
  targetPrice Float?
  horizon     String?       // "단기" | "중기" | "장기"
  isPublic    Boolean       @default(true)
  viewCount   Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments    IdeaComment[]
  likes       IdeaLike[]
  @@index([userId])
  @@index([ticker, market])
  @@index([createdAt])
}

model IdeaComment {
  id        String   @id @default(cuid())
  ideaId    String
  userId    String
  content   String
  createdAt DateTime @default(now())
  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([ideaId])
}

model IdeaLike {
  ideaId    String
  userId    String
  createdAt DateTime @default(now())
  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([ideaId, userId])
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  follower    User     @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)
  @@id([followerId, followingId])
  @@index([followingId])
}
```

---

## 2. API Routes

| Method | Path | Body / Query | Response |
|--------|------|-------------|----------|
| GET | `/api/social/ideas` | `?ticker&horizon&page=1&limit=20` | `{ ideas, total }` |
| POST | `/api/social/ideas` | `{ ticker, market, direction, title, content, targetPrice?, horizon? }` | `Idea` |
| PUT | `/api/social/ideas/[id]` | partial fields | `Idea` |
| DELETE | `/api/social/ideas/[id]` | — | `{ success }` |
| POST | `/api/social/ideas/[id]/like` | — | `{ liked: boolean, count: number }` |
| GET | `/api/social/ideas/[id]/comments` | — | `IdeaComment[]` |
| POST | `/api/social/ideas/[id]/comments` | `{ content }` | `IdeaComment` |
| DELETE | `/api/social/comments/[id]` | — | `{ success }` |
| POST | `/api/social/follow/[userId]` | — | `{ following: boolean }` |
| GET | `/api/social/feed` | `?page=1&limit=20` | `Idea[]` (followed users only) |
| GET | `/api/social/leaderboard` | `?by=return\|sharpe\|followers` | `LeaderboardEntry[]` |

**Privacy rule** enforced in all GET handlers: `isPublic: true` filter unless `session.user.id === idea.userId`.

**Leaderboard entry shape**:
```ts
interface LeaderboardEntry {
  readonly userId: string
  readonly displayName: string        // nickname, never real name
  readonly returnPct: number | null   // null if not opted in
  readonly sharpe: number | null
  readonly followerCount: number
  readonly ideaCount: number
}
```

---

## 3. Component Hierarchy

```
src/app/social/
  ├── page.tsx                        # Feed (followed users)
  ├── ideas/page.tsx                  # Explore all ideas
  ├── ideas/new/page.tsx              # IdeaForm
  ├── ideas/[id]/page.tsx             # Idea detail + comments
  └── leaderboard/page.tsx

src/components/social/
  ├── IdeaCard.tsx                    # Ticker badge, thesis preview, likes, horizon
  ├── IdeaForm.tsx                    # Create/edit: ticker autocomplete, direction toggle, content, target
  ├── IdeaDetail.tsx                  # Full content + current price vs target
  ├── CommentList.tsx                 # Comments with delete for own
  ├── CommentForm.tsx                 # Single textarea + submit
  ├── ActivityFeed.tsx                # Paginated list of IdeaCard
  ├── LeaderboardTable.tsx            # Ranked rows with metrics
  └── FollowButton.tsx                # Toggle follow/unfollow, optimistic update
```

---

## 4. Data Flow

```
[/social page — Feed]
  → GET /api/social/feed → ActivityFeed → IdeaCard[]
  → POST /api/social/follow/[id] → optimistic FollowButton toggle

[/social/ideas — Explore]
  → GET /api/social/ideas?page → IdeaCard grid
  → filter bar: ticker / horizon / direction (client-side query params)

[/social/ideas/new]
  → IdeaForm: ticker from watchlist suggestion
  → POST /api/social/ideas → redirect to /social/ideas/[id]

[/social/ideas/[id]]
  → GET idea by id (SSR) + GET comments
  → POST like (optimistic counter update)
  → POST/DELETE comment

[/social/leaderboard]
  → GET /api/social/leaderboard?by=return
  → Tab switcher: return / sharpe / followers
  → anonymized: display nickname only
```

---

## 5. Privacy Design

- Portfolio `returnPct` shown only if user has opted in via profile settings
- Exact holdings (quantity/amount) never exposed in any public API
- `displayName` sourced from `User.name` with opt-in alias override
- Leaderboard scores show `null` with "—" display when not opted in

---

## 6. File Structure

```
src/
├── app/
│   ├── api/social/
│   │   ├── ideas/route.ts
│   │   ├── ideas/[id]/route.ts
│   │   ├── ideas/[id]/like/route.ts
│   │   ├── ideas/[id]/comments/route.ts
│   │   ├── comments/[id]/route.ts
│   │   ├── follow/[userId]/route.ts
│   │   ├── feed/route.ts
│   │   └── leaderboard/route.ts
│   └── social/
│       ├── page.tsx
│       ├── ideas/page.tsx
│       ├── ideas/new/page.tsx
│       ├── ideas/[id]/page.tsx
│       └── leaderboard/page.tsx
└── components/
    └── social/
        ├── IdeaCard.tsx
        ├── IdeaForm.tsx
        ├── IdeaDetail.tsx
        ├── CommentList.tsx
        ├── CommentForm.tsx
        ├── ActivityFeed.tsx
        ├── LeaderboardTable.tsx
        └── FollowButton.tsx
```

---

## 7. Implementation Order

1. Add `Idea`, `IdeaComment`, `IdeaLike`, `Follow` to Prisma schema, migrate
2. Implement `GET/POST /api/social/ideas` with Zod + auth + isPublic filter
3. Implement `PUT/DELETE /api/social/ideas/[id]` (owner check)
4. Implement `POST /api/social/ideas/[id]/like` (upsert/delete toggle)
5. Implement `GET/POST /api/social/ideas/[id]/comments`
6. Implement `DELETE /api/social/comments/[id]`
7. Implement `POST /api/social/follow/[userId]` toggle
8. Implement `GET /api/social/feed` (join Follow → Idea)
9. Implement `GET /api/social/leaderboard` (aggregate with privacy guard)
10. Build `IdeaCard` + `ActivityFeed` components
11. Build `IdeaForm` with watchlist ticker autocomplete
12. Build `IdeaDetail` + `CommentList` + `CommentForm`
13. Build `LeaderboardTable` + tab switcher
14. Build `FollowButton` with optimistic update
15. Wire all pages under `/social`
