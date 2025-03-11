dev_frontend:
	@cd frontend && npm run dev

dev_backend:
	@fastapi dev backend/main.py

install_backend:
	@pip install -r backend/requirements.txt