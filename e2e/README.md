# Maestro E2E Tests for CatchPoint

This directory contains end-to-end tests using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

Install Maestro CLI:

```bash
# macOS
curl -Ls "https://get.maestro.mobile.dev" | bash

# Or via Homebrew
brew tap mobile-dev-inc/tap
brew install maestro
```

## Running Tests

### Run a single test
```bash
maestro test e2e/home.yaml
```

### Run all tests
```bash
maestro test e2e/
```

### Run with a specific device
```bash
maestro test --device emulator-5554 e2e/home.yaml
```

### Run full flow test
```bash
maestro test e2e/full-flow.yaml
```

## Test Files

| File | Description |
|------|-------------|
| `home.yaml` | Tests home screen and FISH ON! button |
| `map.yaml` | Tests map display and navigation |
| `log.yaml` | Tests catch log list and swipe actions |
| `settings.yaml` | Tests settings screen and unit toggles |
| `catch-details.yaml` | Tests catch detail view and edit |
| `delete-catch.yaml` | Tests swipe-to-delete functionality |
| `full-flow.yaml` | Complete user journey test with screenshots |

## Screenshots

Screenshots from `full-flow.yaml` are saved to:
```
~/.maestro/tests/<timestamp>/screenshots/
```

## CI Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    brew install maestro
    maestro test e2e/
```

## Tips

- Ensure the app is built with `npx expo run:android` (not Expo Go)
- Start an emulator before running tests
- Use `maestro studio` for interactive test development
- Use `maestro record` to generate test flows from interactions
