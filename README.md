# Group Travel Matcher (LogoKaSangam)

A full-stack web application designed for solo travellers to discover compatible travel companions, form groups, search and compare real available hotel rooms, collaborate in real time, and finalize consensus bookings with dynamic per-person cost splits.

Built for the **Intern Hackathon: Group Travel Matcher (Problem 3)**.

---

## Quick Start (1–2 Commands)

### 1. Install dependencies
```sh
npm run install:all
```

### 2. Start Backend & Frontend
In Terminal 1 (Backend):
```sh
node server.js
```
*(Backend runs on port `5001`. On first startup, it automatically seeds the 24 mock travellers and 12 open groups if the database is fresh).*

In Terminal 2 (Frontend):
```sh
npm run dev
```
*(Open http://localhost:5173)*

### Manual Seeding / Reset (Optional)
To re-seed or refresh the data pack into MongoDB at any time:
```sh
npm run seed
```

---

## 12-Minute Demo Walkthrough

### Scenario A: Group Creator (Sarah Thomas)
1. Navigate to http://localhost:5173.
2. Sign up as **Sarah Thomas** from Bengaluru (Age: 27, Female, Travel with: Women only, Interests: Temples, Street food, Photography, Budget stays).
3. Click **Create a group** (`/groups/new`):
   - Destination: **Kyoto**
   - Dates: **2027-04-10** to **2027-04-15** (5 nights)
   - Travellers wanted: **3** (including owner)
   - Budget: **₹60,000**
   - Interests: Temples and shrines, Street food and markets, Photography, Budget stays
   - Itinerary: Fushimi Inari at sunrise, Nishiki Market lunch, Gion walk, Arashiyama bamboo grove.
4. Sarah's post appears under **My trips** with Sarah as the host (member 1 of 3).

### Scenario B: Group Seeker (Priya Shah)
1. In another browser or incognito window (or after signing out), open http://localhost:5173.
2. Sign up as **Priya Shah** from Mumbai (Age: 26, Female, Travel with: Women only, Interests: Temples, Street food, Adventure).
3. Click **Find your travel crew** (`/search`):
   - Destination: **Kyoto**
   - Dates: **2027-04-09** to **2027-04-16** (7 nights, 5 nights overlap)
   - Budget: **₹62,000**
   - Travel with: **Women only**
   - Interests: Temples and shrines, Street food and markets, Adventure sports
4. Click **Search**:
   - Matches list displays Sarah's group as the top recommendation with clear matching reasons checkmarks:
     - ✓ Same destination: Kyoto
     - ✓ 5 overlapping nights (2027-04-10 to 2027-04-15)
     - ✓ Budget within 40% (difference: ₹2,000 <= ₹24,000 threshold)
     - ✓ 2 shared interests with host (`TEMPLES`, `STREET_FOOD`)
     - ✓ Mutual travel companion preferences compatible (Female only)
     - ✓ 2 seats available
5. **View group details** (Flow 2): Click "View details" or the group title to view the full itinerary, host profile, and current members.
6. Click **Express Interest to Join**: join request is submitted; button updates to **Request Pending Approval**.

### Approval & Common Group Page Collaboration
1. In Sarah's session, an alert badge appears in the top navigation and directly on the Common Group Page: **🔔 1 pending join request**.
2. Click **Review Requests**: Sarah inspects Priya's profile, home city (Mumbai), and shared interests, then clicks **Approve**.
3. Both Sarah and Priya now access the **Common Group Page**:
   - Members count updates to **2/3**.
   - Hotel search runs using group dates & destination (**Kyoto**, 10–15 April 2027).
   - Each hotel room option automatically displays:
     - Total price for the entire group
     - **Per-person cost split** (`totalPrice ÷ membersCount`)
   - Members click **Save option** to curate shared hotel preferences with member attribution (*"Suggested by Sarah"*).
   - Members use the built-in **Group Discussion Chat** to align on choices.
   - Any member clicks **Finalize Booking**: a confirmation modal summarizes the final room and per-person cost.
   - Upon confirmation, **ONE unique booking reference** is generated (e.g. `BOOK-XXXXXX`), locked permanently against edits, and cost splits are updated for all members.

---

## Features & Acceptance Criteria Matrix

| ID | Feature | Specification | Status |
|---|---|---|:---:|
| **M1** | Sign up flow | Passwordless profile: name, gender, origin city, age, interests, companion preference; persists across refresh & restart | Complete |
| **M2** | Group owner | Create group: 5 cities, April 1–20 2027, 1–4 members, budget, proposed itinerary, tags | Complete |
| **M3** | Traveller search | Search: home city, destination, check-in/out, interests, budget, gender preference | Complete |
| **M4** | See matches | Evaluates all 6 matching rules; displays group name, dates, city, members count, host name, compatibility reasons | Complete |
| **M5** | Accept or decline | Seekers submit interest; creator sees pending requests with notification badges; approve/reject persists | Complete |
| **M6** | Common Group Page | Shared hotel search, per-member cost display (`price ÷ memberCount`), room saving & comparison, booking modal confirmation | Complete |
| **G1** | Interests & Composition Filter | Filter search results by shared interests and group gender composition (Female only, Male only, Mixed) | Complete |
| **G2** | Member profile pages | Profile view with interests, home city, age, companion preferences, and group memberships | Complete |
| **S1** | Group chat | Real-time chat messaging on common group page for trip coordination | Complete |

---

## Group Matching Engine (6 Rules)

Every candidate group must satisfy all 6 rules:
1. **Dates Overlap**: Shared stay >= 2 nights (`overlappingNights >= 2`).
2. **Same Destination**: Exact city match among the 5 supported cities.
3. **Budget Compatibility**: Difference between budgets is <= 40% of the lower budget (`|b1 - b2| <= 0.40 * min(b1, b2)`).
4. **Shared Interests**: Seeker shares at least 2 interests with the group owner.
5. **Gender Preference**: Mutual allowance — seeker's preference allows owner's gender, and owner's preference allows seeker's gender.
6. **Group Size**: Current members + 1 <= group size (`currentMembers + 1 <= groupSize`).

### Ranking & Tie-Breaking Logic
Matches are ranked deterministically:
$$\text{Score} = (\text{sharedInterests} \times 100) + (\text{overlapNights} \times 10) + \left(1 - \frac{\text{budgetDiff}}{\text{lowerBudget}}\right) \times 10$$
- **Primary**: Higher overall compatibility score.
- **Tie-breaker 1**: Earliest check-in date (`checkIn.localeCompare`).
- **Tie-breaker 2**: Larger target group size (accommodates more companions).

---

## API Contract

All endpoints are prefixed with `/api`:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/catalog/cities` | Supported destinations (Tokyo, Kyoto, Osaka, Dubai, Abu Dhabi) |
| `GET` | `/api/catalog/interests` | All 16 interest IDs and labels |
| `POST` | `/api/users` | Register a new traveller profile |
| `GET` | `/api/users/:userId` | Profile details, interests, and joined groups |
| `GET` | `/api/users/:userId/groups` | Groups where user is owner or approved member |
| `GET` | `/api/users/:userId/pending-count` | Aggregate count of pending requests for owner |
| `POST` | `/api/groups` | Create a new group trip |
| `GET` | `/api/groups/:groupId?userId=...` | Group details & itinerary (accessible to seekers and members) |
| `POST` | `/api/matches/search` | Search and score matching groups using all 6 rules |
| `POST` | `/api/groups/:groupId/interest` | Express interest to join a group |
| `GET` | `/api/groups/:groupId/requests?userId=...` | Owner view of pending applicant requests |
| `POST` | `/api/groups/:groupId/requests/:requestId/:action` | Owner approves or rejects a request (`approve`/`reject`) |
| `GET` | `/api/groups/:groupId/hotels?checkIn=...&checkOut=...&userId=...` | Hotel availability and room prices for group size |
| `POST` | `/api/groups/:groupId/saved-options` | Save a room option to group shortlist |
| `DELETE` | `/api/groups/:groupId/saved-options/:optionId?userId=...` | Remove a shortlisted room option |
| `POST` | `/api/groups/:groupId/book` | Finalize group consensus booking & lock group |
| `GET` | `/api/groups/:groupId/messages?userId=...` | Chat messages for the group |
| `POST` | `/api/groups/:groupId/messages` | Post a chat message |

---

## Testing

Run unit and integration tests:
```sh
npm test
```
Verifies date window validation, exclusive checkout night math, lower-budget 40% thresholds, mutual gender preference enforcement, group size limits, and edge case matching.

---

## Known Limitations

- Real payment gateway integrations are omitted per hackathon scope; bookings are confirmed as mock reservations with unique reference IDs.
- Hotel catalog and city transfer networks are fixed to the April 1–20, 2027 window across the 5 provided destinations.
