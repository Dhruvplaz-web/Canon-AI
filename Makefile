.PHONY: help install lint test dev dev-backend dev-frontend clean

help:
	@echo "Canon Monorepo Command Center"
	@echo "  make install       Install dependencies"
	@echo "  make lint          Run linter checks"
	@echo "  make test          Run test suite"
	@echo "  make dev-backend   Run FastAPI backend server"
	@echo "  make dev-frontend  Run Next.js frontend server"

lint:
	cd backend && .venv/Scripts/ruff check app tests

test:
	cd backend && .venv/Scripts/pytest tests

test-unit:
	cd backend && .venv/Scripts/pytest tests/unit

dev-backend:
	cd backend && .venv/Scripts/uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev
