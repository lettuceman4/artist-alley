# Artist Alley Booth Manager

Local app to manage inventory and sales at your artist alley booth.

## Requirements
- Java 17+
- Maven
- Node.js 18+
- Docker (for PostgreSQL)

## Setup & Run

### 1. Start the database
```bash
cd artist-alley-booth
docker-compose up -d
```

### 2. Start the backend
```bash
cd backend
mvn spring-boot:run
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features
- Inventory: add, edit, delete products with stock and pricing
- Sales: record sales, auto-decrements stock
- Dashboard: revenue totals, items sold, low stock alerts
