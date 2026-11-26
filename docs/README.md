# Sketchly Documentation Suite

Welcome to the comprehensive technical documentation for **Sketchly**, a server-authoritative real-time multiplayer drawing and guessing game.

---

## 📚 Documentation Index

| Document | Topic | Description |
|---|---|---|
| [**System Architecture**](./ARCHITECTURE.md) | High-Level Design | Two-tier client/server architecture, authoritative state machine, REST vs WebSocket boundaries, and security model. |
| [**Socket.IO Specification**](./SOCKET_SPECIFICATION.md) | Protocols & Events | Complete typed WebSocket event dictionary, payloads, directions, callbacks, and normalized coordinate calculations. |
| [**Game Engine & Rules**](./GAME_ENGINE.md) | OOP Logic & Mechanics | `GameManager`, `Room`, `Player`, `Game` entities, turn rotation queue, scoring formulas, progressive hint system, and Levenshtein proximity detection. |
| [**Canvas & Audio Engine**](./FRONTEND_CANVAS.md) | Frontend Core | HTML5 Canvas vector streaming, Bézier curve interpolation, 20ms delta batching, zero-React-state loop, Web Audio synthesizer, and the arcade design system. |
| [**Setup & Testing Guide**](./SETUP_AND_TESTING.md) | Operations & QA | Environment configuration, running dev & production servers, Vitest automated testing, and multi-tab manual QA scenarios. |
| [**Deployment Guide**](./DEPLOYMENT_GUIDE.md) | Production Hosting | Step-by-step deployment on Vercel (Frontend) and Render (Backend) with live MongoDB Atlas connection. |

---

## 🚀 Quick Reference: Key Technical Highlights

1. **Two-Tier Architecture:** No `shared/` package. Type ownership is cleanly separated between `client/src/types/` and `server/src/types/`.
2. **Server Authoritative:** The client cannot forge word selections, declare itself the drawer, award itself points, or advance turns.
3. **Secret Word Security:** The backend masks words (`_ _ _ _`) dynamically in `getSnapshot()`. Non-drawers never receive the answer over the network until the turn ends.
4. **Vector Stroke Synchronization:** Canvas coordinates are normalized to `[0.0, 1.0]`, allowing seamless cross-device play between 4K desktops and mobile screens at 60fps with $<1\text{KB/s}$ bandwidth.
5. **Procedural Web Audio API:** Zero external sound asset dependencies. Sounds (pops, correct dings, countdown ticks, fanfares) are synthesized live in the browser.
