# Catch Detail Specification

## Overview
The Catch Detail screen allows users to view the full details of a recorded catch, 
edit information, manage photos, and delete the record.

## User Story
**As a** fisher  
**I want to** view and edit details of my catch  
**So that** I can add missing information like weight/length or correct mistakes

## Screen Layout

```
┌─────────────────────────────────────┐
│ ← Back                     [Save]   │
├─────────────────────────────────────┤
│ [ Photo Area (Tap to add/edit)    ] │
│ [                                 ] │
├─────────────────────────────────────┤
│ SPECIES                             │
│ [ Largemouth Bass               ▼ ] │
├─────────────────────────────────────┤
│ MEASUREMENTS                        │
│ Weight          Length              │
│ [ 5.2 ] lbs     [ 18.5 ] in         │
├─────────────────────────────────────┤
│ DETAILS                             │
│ Date: Jan 10, 2026, 2:30 PM         │
│ Location: 37.73°N, 122.45°W         │
│ Weather: ☀️ Sunny, 72°F             │
├─────────────────────────────────────┤
│ NOTES                               │
│ [ Caught on a green pumpkin jig...  │
│                                   ] │
├─────────────────────────────────────┤
│ [ Delete Catch                    ] │
└─────────────────────────────────────┘
```

## Requirements

### Data Presentation
- Display all fields from the Catch schema (see `quick-capture.md`)
- Format date/time based on locale
- Format coordinates (decimal degrees)
- Display weather icon and description if available

### Editing Capabilities
- **Species**: Autocomplete dropdown (using `src/data/species.ts`)
- **Weight**: Number input (respects user unit preference)
- **Length**: Number input (respects user unit preference)
- **Notes**: Multiline text area
- **Photo**:
  - Tap photo to change/add
  - Support taking new photo or picking from gallery
  - Store as Blob in IndexedDB

### Validation
- Weight/Length must be positive numbers
- Notes limited to 2000 chars (optional)

### Persistence
- "Save" button commits changes to IndexedDB
- Updates `updatedAt` timestamp
- Navigates back on success
- Show toast/snackbar confirmation

### Deletion
- "Delete Catch" button at bottom (red text)
- Requires confirmation dialog:
  > "Are you sure you want to delete this catch? This action cannot be undone."
- On confirm: delete from IndexedDB + navigate back

## Technical Considerations

### Species Autocomplete
- Source: `src/data/species.ts`
- Filter as user types
- Show common names in results
- Allow custom values (if species not in list)

### Photo Handling
- Use `<input type="file" accept="image/*" capture="environment">` for mobile camera access
- Resize/compress image before saving to avoid hitting storage quotas
- Max dimensions: 1920x1920
- Max size: ~500KB

### Unit Conversion
- Store values in base units (lbs, inches)
- Convert for display based on `settingsStore`
- Convert back to base units on save

```typescript
// Example: Display logic
const displayWeight = unit === 'kg' ? toKg(catch.weight) : catch.weight;

// Example: Save logic
const saveWeight = unit === 'kg' ? toLbs(inputValue) : inputValue;
```

## Acceptance Criteria
- [ ] Loads catch data correctly from ID
- [ ] Species autocomplete works
- [ ] Photo upload/change works
- [ ] Photo persists
- [ ] Unit conversions work correctly (display & save)
- [ ] Delete flow with confirmation works
- [ ] Weather data is read-only (displayed)
- [ ] Location data is read-only (displayed)

## Related Specs
- `catch-log.md` - Entry point to this screen
- `quick-capture.md` - Schema definition
- `settings.md` - Unit preferences
