# PawSafe

A community-driven dangerous stray animal reporting platform built for BIL 481 — Software Engineering.

**Team:** Yusuf Yanki Utgun, Eren Can Donertaş, Enes Kerem Goksu, Yigit Eren Yilmaz

---

## What it does

Users drop pins on an interactive Leaflet map to report dangerous stray animals.  Others can validate or dispute reports, upload photo evidence, track trust scores on a leaderboard, and toggle a heatmap view of report density.

---

## Installation

```bash
npm install
```

---

## Running

```bash
# Development (builds client bundles then starts the server)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000`.

**Default credentials**

| User | Email | Password |
|------|-------|----------|
| Regular user | `mehmet@example.com` | `1234` |
| Admin | `admin@pawsafe.com` | `admin123` |

---

## Running tests

```bash
npm test
```

Tests are split into:

- `tests/unit/` — business-layer unit tests (ValidationService, ImageUploadService, NotificationObserver)
- `tests/integration/` — API integration tests using supertest (markers, validations)

---

## How image upload works

1. **Client side** — The add-marker form contains a file input (`#marker-image`).  
   MapView performs pre-flight validation: only `image/jpeg` or `image/png`, max 5 MB.  
   On submit, a `FormData` object is built and POSTed to `/api/markers`.

2. **API layer** — `multer` middleware (memory storage, 6 MB hard cap) parses the multipart request.  
   The file buffer is passed to `ImageUploadService.processUpload()`.

3. **Business layer** — `ImageUploadService` re-validates MIME type and size (business rule), generates a safe filename (`<markerId>_<timestamp>.jpg/png`), and writes the file to `public/uploads/`.

4. **Data layer** — `ImageRepository` (implementing `IImageStorage`) stores the path-to-URL mapping in memory.

5. **Retrieval** — `GET /api/markers` and `GET /api/markers/:id` enrich each marker response with its `imageUrl`.  The popup card renders the image if present.

Image upload is **optional** — markers can be created without a photo.  If the image fails post-creation, the marker is still saved and `imageWarning` is included in the response.

---

## How heatmap mode works

The heatmap toggle button (🌡️) switches between two map rendering **strategies**:

| Mode | Strategy class | What it shows |
|------|----------------|---------------|
| Normal | `MarkerViewStrategy` | Colour-coded paw pins with popups |
| Heatmap | `HeatmapViewStrategy` | Density overlay (blue → orange → red) |

Switching hides the current representation and activates the other.  Heat intensity is weighted by each marker's `validationCount`.

The toggle calls `MapView.toggleMapMode()` which delegates to the active `IMapViewStrategy`.  The underlying Leaflet heat layer is managed inside `MapFacade` (Facade Pattern), keeping Leaflet details out of the strategy classes.

---

## Project structure

```
src/
  interfaces/     – TypeScript types and design-pattern interfaces
  data/           – In-memory repositories (Data Access Layer)
  business/       – Services and Observer implementations (Business Logic Layer)
  facade/         – MapFacade (Facade Pattern over Leaflet)
  api/            – Express route handlers (thin controllers)
  presentation/   – Client-side TypeScript bundled with esbuild
public/
  css/style.css
  uploads/        – Uploaded images (served statically)
tests/
  unit/
  integration/
.github/workflows/ci.yml
```
