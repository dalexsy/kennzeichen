# Kennzeichen

A German license plate lookup tool for quickly identifying where license plates are from.

## Live Demo

https://dalexsy.github.io/kennzeichen

## What is this?

When you see a German license plate, the first few letters indicate which city or district it's registered in. This app lets you search and explore over 700 license plate codes to find out where they're from.

Features:

- **Fast search**: Type any letters to filter and find matching codes
- **Interactive map**: View locations on a map of Germany
- **Area codes**: The number placeholder (123) shows approximate area codes for each region
- **Track progress**: Mark codes you've seen to keep track of which ones you recognize
- **Cloud sync**: Optional Firebase sync to keep your sightings across all devices (setup required)

The area codes are mapped from multiple datasets and may not be 100% accurate, but they add a bit of authenticity to the license plate display.

## Cloud Sync Setup

To enable automatic syncing of your license plate sightings across devices:

### Option 1: Automated Setup (Recommended)

```bash
cd kennzeichen-app
npm run create-firebase  # Creates Firebase project and configures services
npm run setup-firebase   # Adds your Firebase config to the app
```

### Option 2: Manual Setup

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed manual instructions.

## Development

```bash
npm install  # installs dependencies in kennzeichen-app/
npm start    # runs ng serve from kennzeichen-app/
```

Or from the kennzeichen-app directory:

```bash
cd kennzeichen-app
npm install
npm start
```

## Build

```bash
npm run build
```
