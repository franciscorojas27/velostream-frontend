Setup and run with Docker

Build the Docker image:

```bash
npm run docker:build
```

Run with docker-compose:

```bash
npm run docker:up
```

Or manually:

```bash
docker build -t velostream-frontend .
docker run -p 3000:3000 --env PORT=3000 --rm velostream-frontend
```
