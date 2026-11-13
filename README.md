# CricLively 🏏

A full-stack cricket match management platform — live scoring, tournament dashboards, player profiles, and ball-by-ball scorecards.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Java 17 · Spring Boot 4 · Spring Security · MongoDB |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer Motion |
| Auth | Session-based (cookie) · Role-based access control |
| Storage | MongoDB GridFS (player photos, team logos, tournament covers) |

---

## Features

### 🔐 Auth & Roles
- Register / Login / Logout (session cookies)
- Three roles: **PLAYER** (base) → **ORGANIZER** → **ADMIN**
- Route guards on both frontend (`RequireRole`) and backend (`@PreAuthorize`)

### 🏆 Tournament Management
- Create tournaments with cover image, format (T20 / ODI / Test / Custom), dates, venue, and multiple organizers
- Duplicate-check on (name + venue + dates)
- Auto-status: `UPCOMING` or `LIVE` based on start date
- Points table per tournament (P/W/L/T/NR/Pts/NRR)

### 🏟️ Match Management
- 19 match types: League, Group, Quarter-Final, Semi-Final, Final, Super Over, Friendly, and more
- Standalone or tournament-linked matches
- Configurable overs (1–50), venue, date/time
- Status lifecycle: `UPCOMING → LIVE → FINISHED / ABANDONED`

### 🧢 Team & Player Management
- Create teams with logo, captain, and squad (occupation filter — no double-signing)
- Register players individually or in bulk (admin)
- Player profiles: batting style, bowling style, playing role, photo
- Career stats: runs, average, SR, wickets, economy, 5-wicket hauls, catches, MVP points

### 📊 Live Scoring (core feature)
- **Toss** → **Innings setup** → **Ball-by-ball entry**
- Runs (0–6), extras (Wide / No Ball / Bye / Leg Bye), wickets (8 dismissal types)
- Proper cricket rules: Wides/No Balls don't count as legal deliveries, strike rotates on odd runs and end of over, Run Out doesn't credit the bowler
- **Undo** last ball — server recomputes all totals from ball log
- Innings auto-completes: 10 wickets, overs up, or chase reached
- Finish or Abandon a match at any time

### 📺 Live Scoreboard (viewer)
- Auto-refreshes every 10 seconds
- Hero card: score, overs, run rate, required run rate (2nd innings)
- Scorecard tab: batting (R/B/4s/6s/SR/dismissal) + bowling (O/R/W/Econ)
- Timeline tab: colour-coded ball-by-ball log (last 12 balls)
- Result display: won by runs / wickets / tied

### 👤 Profiles & Gallery
- Self-edit profile; admin can edit any user and change roles
- Photo gallery with year-tagged images (GridFS)
- All images served from a single public endpoint

---

## Project Structure

```
CricLively/
├── Backend/CricLively/        # Spring Boot app
│   ├── Entities/              # MongoDB documents
│   ├── RestController/        # REST endpoints
│   ├── Service/               # Business logic
│   └── Security/              # Spring Security config
└── Frontend/CricLively/       # Vite + React app
    ├── src/components/        # UI components
    ├── src/API/               # Axios API layer
    ├── src/lib/               # Auth helpers, reducers
    └── src/pages/             # Route pages
```

---

## Running Locally

**Backend**
```bash
cd Backend/CricLively
# Requires MongoDB running on localhost:27017
./mvnw spring-boot:run
# Runs on http://localhost:8080
```

**Frontend**
```bash
cd Frontend/CricLively
npm install
npm run dev
# Runs on http://localhost:5173
```

> Copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:8080` before starting the frontend.

---

## API Overview

| Domain | Endpoints |
|---|---|
| Auth | `POST /profile/login` · `POST /profile/logout` · `GET /profile/me` |
| Players | `POST /player/register` · `PUT /player/{id}/playerInfo` |
| Teams | `POST /team/addTeam` · `GET /team/getTeamsList` |
| Tournaments | `POST /tournaments` · `GET /tournaments` |
| Matches | `POST /matches` · `GET /matches` |
| Scoring | `POST /matches/{id}/toss` · `POST /matches/{id}/balls` · `DELETE /matches/{id}/balls/last` |
| Scoreboard | `GET /matches/{id}/scoreboard` |
| Images | `GET /images/{imageId}` · `POST /images/upload` |

---

## Known Limitations
- Passwords stored as plain text (`NoOpPasswordEncoder`) — replace with BCrypt before any deployment
- No WebSocket — scoreboard polls every 10 seconds
- Stats leaderboard page uses hardcoded dummy data (not wired to DB)
- Career stats not auto-updated after match completion yet

---

## Images
<img width="1917" height="872" alt="image" src="https://github.com/user-attachments/assets/df39f9e0-8765-41dd-9b6d-e617ee6014ec" />
<img width="1915" height="866" alt="image" src="https://github.com/user-attachments/assets/95f1a47e-9b29-4095-a6d6-9a2a661b821b" />
<img width="1908" height="867" alt="image" src="https://github.com/user-attachments/assets/37fd2e7a-2ca2-4ad8-ab42-ca09cfecf512" />
<img width="1917" height="862" alt="image" src="https://github.com/user-attachments/assets/fc0398d9-3e11-4a6c-a072-ea93e83c04be" />
<img width="1905" height="857" alt="image" src="https://github.com/user-attachments/assets/067b5adc-ec30-44dc-a9d6-e9ba6b41341b" />


## Author

**Chetan Sanjay Chopade** · Java Backend Developer  
[GitHub](https://github.com/Chetan-1-hash)
