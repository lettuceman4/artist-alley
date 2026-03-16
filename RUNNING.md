# Running the App

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Java 17+
- Node.js 18+

## Steps

### 1. Verify Docker is running

```bash
docker info
```

If you get `Cannot connect to the Docker daemon`, open Docker Desktop and wait for it to fully start.

### 2. Start the database

```bash
docker-compose up -d
```

### 3. Start the backend

```bash
cd backend
mvn spring-boot:run
```

> If you don't have Maven installed: `brew install maven`

Runs on `http://localhost:8080`

### 4. Start the frontend

```bash
cd frontend
npm install   # first time only
npm run dev
```

Runs on `http://localhost:5173`

## Stopping

To stop the database container:

```bash
docker-compose down
```
