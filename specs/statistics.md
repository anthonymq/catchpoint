# Statistics Dashboard Specification

## Overview
Visual analytics dashboard showing fishing patterns, trends, and achievements.
Helps fishers understand when, where, and what they catch best.

## User Story
**As a** fisher  
**I want to** see my fishing statistics and trends  
**So that** I can identify patterns and improve my fishing success

## Screen Layout

### Header
- Screen title: "Statistics"
- Time range filter (7D, 30D, 1Y, All)

### Overview Section
Four stat cards in 2x2 grid:
```
┌─────────────┬─────────────┐
│ Total       │ Avg Weight  │
│ Catches     │             │
│    42       │   3.2 lbs   │
├─────────────┼─────────────┤
│ Biggest     │ Best Day    │
│ Catch       │             │
│   8.5 lbs   │   Jan 5     │
└─────────────┴─────────────┘
```

### Charts Section
Scrollable section with multiple charts:

1. **Catches Over Time** (Line Chart)
   - X: Date
   - Y: Number of catches
   - Grouped by day/week/month based on range

2. **Top Species** (Pie/Donut Chart)
   - Show top 5 species by count
   - "Other" category for rest
   - Click for breakdown

3. **Best Fishing Hours** (Bar Chart)
   - X: Hour of day (6AM-9PM typically)
   - Y: Catch count
   - Highlight peak hours

### Empty State
When no catches exist:
```
┌─────────────────────────────────────┐
│                                     │
│         📊                          │
│                                     │
│    No data yet!                     │
│                                     │
│    Start logging catches to        │
│    see your fishing stats.          │
│                                     │
│    [Load Test Data] (dev only)      │
│                                     │
└─────────────────────────────────────┘
```

## Requirements

### Time Range Filter

| Range | Behavior |
|-------|----------|
| 7D | Last 7 days |
| 30D | Last 30 days |
| 1Y | Last 365 days |
| All | All time |

Filter applies to all charts and stat cards.
Persist selection during session (sessionStorage).

### Stat Cards

| Stat | Calculation | Format |
|------|-------------|--------|
| Total Catches | Count in range | "42" |
| Avg Weight | Mean weight (non-null) | "3.2 lbs" |
| Biggest Catch | Max weight | "8.5 lbs" |
| Best Day | Date with most catches | "Jan 5" |

Handle edge cases:
- No data: show "—"
- Single catch: show that catch's data
- No weights recorded: show "—" for weight stats

### Charts

**Technology**: 
- **Recharts** (recommended for React) OR
- **Chart.js** with react-chartjs-2 OR
- **D3.js** for custom visualizations

**Line Chart (Catches Over Time)**:
- Smooth curve interpolation
- Data points visible
- Hover/touch to see exact value
- Adaptive grouping based on range

**Pie Chart (Top Species)**:
- Top 5 species + "Other"
- Percentage labels
- Legend below chart
- Click slice for details

**Bar Chart (Fishing Hours)**:
- 24 bars (or just active hours)
- Color gradient based on count
- Highlight best hour

### Data Aggregation

```typescript
interface Statistics {
  totalCatches: number;
  avgWeight: number | null;
  maxWeight: number | null;
  bestDay: { date: Date; count: number } | null;
  
  catchesByDate: Array<{ date: Date; count: number }>;
  catchesBySpecies: Array<{ species: string; count: number }>;
  catchesByHour: Array<{ hour: number; count: number }>;
}
```

Calculate from filtered catches using `src/utils/statistics.ts`.

## Acceptance Criteria

- [ ] Time range filter updates all visualizations
- [ ] Stat cards show correct aggregated values
- [ ] Line chart shows catches over time
- [ ] Pie chart shows species distribution
- [ ] Bar chart shows best fishing hours
- [ ] Empty state when no catches
- [ ] Charts render smoothly (60fps)
- [ ] Hover/touch interactions work on charts
- [ ] Unit preferences respected (lbs/kg)
- [ ] Responsive layout for mobile/desktop

## Performance Considerations

- Memoize calculations with useMemo
- Debounce range filter changes
- Lazy render charts below fold
- Use Web Workers for heavy aggregations if needed
- Cache aggregated data in store if needed

## Accessibility

- Charts include aria-labels
- Color combinations meet WCAG contrast requirements
- Alternative text/table view for screen readers
- Keyboard navigable chart elements

## Related Specs
- `catch-log.md` - Source of catch data
- `settings.md` - Unit preferences
