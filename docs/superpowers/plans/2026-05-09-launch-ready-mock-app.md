# Launch-Ready Mock App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or direct autonomous execution under AGENTS.md. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the current guided demo into a polished, launch-ready workspace-data Second Brain app aligned to PRD.md and DESIGN.md.

**Architecture:** Keep the existing React/Vite stage flow and JSON/API seam, but enrich data models and replace the generic cyan visual system with DESIGN.md tokens and launch-grade screens. Avoid new dependencies.

**Tech Stack:** React, TypeScript, Vite, Vitest, CSS, JSON/mock data.

---

## Tasks

### Task 1: Product data coverage
- [ ] Extend persona data with caregiver, consent tier, scenario, risk and mock source metadata.
- [ ] Extend demo signals with evidence metrics, capability inflation examples, companion boundary data, and richer validation readiness.
- [ ] Keep trend engine tests passing.

### Task 2: Launch UI surfaces
- [ ] Update Landing to feel like a launch page with proof cards, loop preview, and trust boundary.
- [ ] Update PersonaSelector and ConsentBoundary to read like production workspace-data screens.
- [ ] Update CompanionDemo to show voice-first status, cue ladder, structured signals, and safer interaction state.
- [ ] Update Dashboard to show care plan metrics, capability examples, social/companion boundary, validation mapping, and JSON queue.

### Task 3: Theme revamp
- [ ] Replace CSS tokens with DESIGN.md Porcelain/Mist/Sage/Coral/Graphite/Deep Lake palette.
- [ ] Improve responsive grids, card hierarchy, focus states, chart readability, and reduced-motion behavior.
- [ ] Remove harsh cyan/green generic-health feel.

### Task 4: Verification
- [ ] Run unit tests.
- [ ] Run TypeScript/Vite build.
- [ ] Run existing smoke script; fix expected text if needed while preserving PRD assertions.
- [ ] Run a quick local browser or screenshot pass if server starts cleanly.
