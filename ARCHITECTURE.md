# PawSafe — Architecture Notes

## Layered Architecture

```
┌─────────────────────────────────────────┐
│  Presentation Layer                     │
│  (src/presentation/, public/)           │
│  MapView, MarkerViewStrategy,           │
│  HeatmapViewStrategy, mapPage, authPage │
├─────────────────────────────────────────┤
│  API / Controller Layer                 │
│  (src/api/)                             │
│  markers.ts, validations.ts,            │
│  users.ts, admin.ts                     │
├─────────────────────────────────────────┤
│  Business Logic Layer                   │
│  (src/business/, src/facade/)           │
│  ValidationService, ImageUploadService, │
│  MarkerService, AuthService,            │
│  Observer implementations, MapFacade   │
├─────────────────────────────────────────┤
│  Data Access Layer                      │
│  (src/data/)                            │
│  MarkerRepository, UserRepository,      │
│  ValidationRepository, ImageRepository  │
└─────────────────────────────────────────┘
```

---

## Design Patterns

### Observer Pattern

**Location:** `src/business/ValidationService.ts` (Subject) and three observer classes.

**Problem solved:** When a user validates or disputes a marker, three separate subsystems need to react — trust scores must be updated, a notification must be created, and the leaderboard needs to know the last-update timestamp.  Without Observer, `ValidationService` would have to import and call each subsystem directly (tight coupling, OCP violation).

**Structure:**

```
ISubject (src/interfaces/ISubject.ts)
  └── ValidationService      [subscribe / unsubscribe / notify(event)]
        │  notifies ──►  TrustScoreObserver    → increments reporter trust score
        │  notifies ──►  NotificationObserver   → creates in-app notification
        └  notifies ──►  LeaderboardObserver    → records lastUpdate timestamp
```

**Wiring:** `src/server.ts` creates all three observers and subscribes them once at startup.

**Extension point:** Adding a new reaction to validation/dispute events (e.g., email notifications, badge system) requires only implementing `IObserver` and calling `validationService.subscribe(newObserver)` — no change to `ValidationService`.

---

### Facade Pattern

**Location:** `src/facade/MapFacade.ts`

**Problem solved:** Leaflet's API is verbose and version-sensitive.  Presentation code would become tightly coupled to Leaflet specifics (layer management, icon configuration, heat plugin quirks) if called directly from every component.

**What it hides:**
- `L.divIcon` configuration and paw pin HTML
- Leaflet marker lifecycle (add / remove / popup)
- `leaflet.heat` CDN compatibility fix (`window.L.heatLayer` vs bundled `L.heatLayer`)
- Heat layer visibility state

**Interface offered to callers:**
`addMarker()`, `removeMarker()`, `clearMarkers()`, `updateHeatmap()`, `showHeatmap()`, `hideHeatmap()`, `toggleHeatmap()`, `onMapClick()`, `fitBounds()`, `getMap()`

---

### Strategy Pattern  *(added in this iteration)*

**Location:** `src/interfaces/IMapViewStrategy.ts`, `src/presentation/MarkerViewStrategy.ts`, `src/presentation/HeatmapViewStrategy.ts`

**Problem solved:** The map can show reports either as individual pins or as a heatmap overlay.  Without Strategy, `MapView` would contain `if (heatmapMode) { ... } else { ... }` branching throughout `loadMarkers()` and the toggle handler.  Every new rendering mode (cluster view, timeline view) would require modifying `MapView` (OCP violation).

**Structure:**

```
IMapViewStrategy
  └── MarkerViewStrategy   → calls facade.addMarker() for each report
  └── HeatmapViewStrategy  → calls facade.updateHeatmap() + showHeatmap()

MapView holds:
  - currentStrategy: IMapViewStrategy
  - toggleMapMode() swaps the strategy and re-renders
```

**Extension point:** A new view mode (e.g., cluster view) requires only a new class implementing `IMapViewStrategy` — no modification to `MapView`.

---

## SOLID Improvements

| Principle | Where applied |
|-----------|---------------|
| **SRP** | `ImageUploadService` handles only upload validation + disk write. Storage metadata is delegated to `IImageStorage`. Route handlers only extract request data and delegate to the service. |
| **OCP** | Observer wiring: new reactions need only a new `IObserver` class, not edits to `ValidationService`. Strategy wiring: new map modes need only a new `IMapViewStrategy` class, not edits to `MapView`. |
| **DIP** | `ImageUploadService` depends on `IImageStorage`, not `ImageRepository` directly. `ValidationService` depends on `ISubject` / `IObserver` interfaces. |
| **ISP** | Interfaces are small and role-specific: `IObserver`, `ISubject`, `IImageStorage`, `IMapViewStrategy`. |

---

## UML-oriented Class Summary (new components)

### `IImageStorage` (interface)
- `saveImage(markerId, filename, url): void`
- `getUrl(markerId): string | undefined`
- `getImage(markerId): StoredImage | undefined`
- Implemented by: `ImageRepository`

### `ImageUploadService` (business)
- Depends on: `IImageStorage`
- `validate(mimeType, sizeBytes): { valid, error? }`
- `processUpload(markerId, mimeType, sizeBytes, buffer): { success, url?, error? }`
- `getForMarker(markerId): string | undefined`

### `IMapViewStrategy` (interface)
- `render(markers: Marker[]): void`
- `clear(): void`
- `getName(): 'markers' | 'heatmap'`

### `MarkerViewStrategy` (presentation)
- Depends on: `MapFacade`
- Renders individual paw pins with popup HTML (includes image if present)
- Dispute button now opens `openDisputeModal()` instead of voting directly

### `HeatmapViewStrategy` (presentation)
- Depends on: `MapFacade`
- Clears pins, feeds weighted coordinate array to `MapFacade.updateHeatmap()`
- Intensity = `min(1.0, validationCount / 10)`

### `DisputeReason` (type)
- `'inappropriate' | 'irrelevant' | 'false_report' | 'duplicate' | 'spam' | 'other'`
- Added to `Validation` and `ValidationEvent` as optional fields

---

## Key Relationships

```
MapView
  ├── uses ──► IMapViewStrategy (Strategy)
  │              ├── MarkerViewStrategy → MapFacade
  │              └── HeatmapViewStrategy → MapFacade
  └── calls ──► /api/validations/:id/dispute  (with reason + explanation)

markers POST route
  └── uses ──► multer (multipart) → ImageUploadService → IImageStorage ← ImageRepository

ValidationService (ISubject)
  ├── dispute(markerId, userId, reason, explanation?)
  └── notify(ValidationEvent with reason/explanation)
        ├── TrustScoreObserver
        ├── NotificationObserver  (reason label in message)
        └── LeaderboardObserver
```
