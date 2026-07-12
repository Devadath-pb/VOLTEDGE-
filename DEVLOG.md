# ⚡ VoltEdge Development Log

> This document tracks the development progress of VoltEdge.
> Every completed feature is recorded here along with major decisions,
> challenges, and the next planned task.

---

# Project Timeline

## v0.1.0 - Project Foundation

### Date
2026-07-12

### Completed

- Created GitHub repository
- Configured Python virtual environment
- Installed PostgreSQL
- Connected FastAPI to PostgreSQL
- Configured SQLAlchemy
- Created project folder structure
- Created Battery SQLAlchemy model
- Generated `batteries` table
- Fixed nested Git repository issue
- Published initial repository

### Decisions

- Python 3.11 selected for compatibility.
- PostgreSQL chosen over SQLite.
- FastAPI selected as backend framework.
- SQLAlchemy 2.0 style adopted.
- Feature-first development approach.
- Build folders only when required.
- Every feature ends with Test → Commit → Push.

### Challenges

- `.env` loading issue
- Nested Git repository (`backend/.git`)
- SQLAlchemy table registration

### Lessons Learned

- Always verify the working directory before running Git commands.
- Import models before calling `Base.metadata.create_all()`.
- Use absolute paths for configuration when appropriate.

### Next Sprint

- Battery Registration API
- GET /batteries
- GET /batteries/{id}

---
