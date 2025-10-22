Local Docker/dev for functions + Redis

Steps:

1. Build and run (root of repo):

   docker compose up -d --build

2. Check containers:

   docker ps --filter "name=guiatv"

3. Logs:

   docker logs -f guiatv-functions

4. The v2 server will be available at http://localhost:3000/v2/health

Notes:

- The Dockerfile builds production dependencies (npm ci --only=production) and runs the compiled JS at lib/v2/server.js.
- For iterative development you can mount the source into the container and run ts-node; uncomment the volume in docker-compose and change the command.
