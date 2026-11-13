# Group Travel Matcher

React frontend and Express/Mongoose backend for creating travel groups, discovering compatible travellers, reviewing join requests, comparing available hotel rooms, sharing trip suggestions, and making a mock group booking.

## Requirements

- Node.js 18 or newer
- MongoDB (local or hosted)

## Start the backend

```sh
cd backend
npm install
cp -n .env.example .env
# Set MONGO_URI in backend/.env to your MongoDB connection string.
npm run dev
```

The backend listens on port `5001` by default. `PORT` and `CORS_ORIGIN` can be set in `backend/.env`.

## Start the frontend

In another terminal:

```sh
cd FrontEnd
npm install
cp -n .env.example .env
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to `127.0.0.1:5001` by default; override this with `VITE_API_PROXY_TARGET`. For a separately hosted API, set `VITE_API_URL` and allow that frontend origin through `CORS_ORIGIN`.

## API contract

All endpoints are prefixed with `/api`. MongoDB user IDs are stored in localStorage as `userId`. User-scoped request examples include that ID explicitly.

| Method | Path | Purpose |
|---|---|---|
| GET | `/catalog/cities` | Supported destination names |
| GET | `/catalog/interests` | Interest IDs and display labels |
| POST | `/users` | Create a passwordless profile |
| GET | `/users/:userId` | Load a profile and its group summaries |
| GET | `/users/:userId/groups` | List the user's groups |
| GET | `/users/:userId/pending-count` | Count owner join requests |
| POST | `/groups` | Create a group with its owner as first member |
| GET | `/groups/:groupId?userId=...` | Member-only group details |
| POST | `/matches/search` | Apply all matching rules and rank groups |
| POST | `/groups/:groupId/interest` | Submit a match-qualified join request |
| GET | `/groups/:groupId/requests?userId=...` | Owner-only pending requests |
| POST | `/groups/:groupId/requests/:requestId/approve` | Approve and add a member |
| POST | `/groups/:groupId/requests/:requestId/reject` | Reject a request |
| GET | `/groups/:groupId/hotels?checkIn=...&checkOut=...&userId=...` | List available hotel-room options |
| POST | `/groups/:groupId/saved-options` | Save an available room option |
| DELETE | `/groups/:groupId/saved-options/:optionId?userId=...` | Remove a saved room option |
| POST | `/groups/:groupId/book` | Create the group's single mock booking |
| GET | `/groups/:groupId/messages?userId=...` | List member suggestions |
| POST | `/groups/:groupId/messages` | Post a suggestion |

Example signup:

```json
{
  "name": "Asha",
  "age": 27,
  "gender": "female",
  "homeCity": "Bengaluru",
  "interests": ["TEMPLES", "STREET_FOOD"],
  "genderPreference": "any"
}
```

Example group search:

```json
{
  "userId": "MongoDB-user-id",
  "homeCity": "Bengaluru",
  "city": "Kyoto",
  "checkIn": "2027-04-10",
  "checkOut": "2027-04-15",
  "budget": 60000,
  "interests": ["TEMPLES", "STREET_FOOD"],
  "genderPreference": "any"
}
```

Trips are restricted to April 1–20, 2027, and the five supported destinations. The data files under `backend/data/` are read-only inputs.

## Manual smoke test

1. Create a profile with at least two interests and note its MongoDB ID in browser localStorage (`userId`).
2. Create a group, then verify it appears under My trips with the owner as member 1.
3. Create a second profile with compatible gender preferences, interests, dates, and budget; search and request to join.
4. Sign in as the owner profile and approve the request; confirm the new member sees the trip page and the owner no longer sees a pending request.
5. As a member, search/save a room, post a suggestion, and book the saved option. Confirm the booking ID and cost split remain displayed and the group cannot book again.