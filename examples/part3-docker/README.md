# Part 3: Docker Example

This is the complete working code for Part 3 of the distributed systems tutorial.

## What This Does

Containerized versions of:
- Blender rendering server (with Blender pre-installed)
- Orchestrator

Both run in Docker containers with custom networking.

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- A `.blend` file to render
- Basic understanding of Docker concepts

## Project Structure

```
part3-docker/
├── server/
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
├── orchestrator/
│   ├── Dockerfile
│   ├── orchestrator.js
│   └── package.json
└── README.md
```

## Setup

### 1. Create Docker Network

```bash
docker network create blender-network
```

This allows containers to communicate using container names as hostnames.

### 2. Build the Server Image

```bash
cd server
docker build -t blender-server .
```

### 3. Build the Orchestrator Image

```bash
cd ../orchestrator
docker build -t orchestrator .
```

## Running

### Start the Blender Server

```bash
docker run -d \
  -p 3000:3000 \
  --network blender-network \
  --name blender-server \
  -v /path/to/blend/files:/app/blend/files \
  -v /path/to/output:/app/output \
  blender-server
```

**Replace `/path/to/blend/files` and `/path/to/output` with actual paths on your system.**

### Update Orchestrator Configuration

Edit `orchestrator/orchestrator.js` to use the container name:

```javascript
const NODES = [
    'http://blender-server:3000',
];
```

Then rebuild:
```bash
cd orchestrator
docker build -t orchestrator .
```

### Start the Orchestrator

```bash
docker run -d \
  -p 4000:4000 \
  --network blender-network \
  --name orchestrator \
  orchestrator
```

## Testing

### Submit a rendering job:

```bash
curl -X POST http://localhost:4000/render \
  -H "Content-Type: application/json" \
  -d '{"from": 1, "to": 5}' \
  -i
```

### Check logs:

```bash
# Orchestrator logs
docker logs orchestrator

# Server logs
docker logs blender-server
```

## Managing Containers

### View running containers:
```bash
docker ps
```

### Stop containers:
```bash
docker stop orchestrator blender-server
```

### Remove containers:
```bash
docker rm orchestrator blender-server
```

### Remove network:
```bash
docker network rm blender-network
```

## Dockerfile Breakdown

### Server Dockerfile
- **Base**: `linuxserver/blender:latest` (includes Blender)
- **Installs**: Node.js and npm
- **Overrides**: Entrypoint to run Node.js instead of GUI
- **Exposes**: Port 3000

### Orchestrator Dockerfile
- **Base**: `node:16` (lightweight Node.js image)
- **Installs**: Application dependencies
- **Exposes**: Port 4000

## Volume Mounts

The server container needs two volumes:
- **Blend files** (read): `-v /path/to/blend/files:/app/blend/files`
- **Output** (write): `-v /path/to/output:/app/output`

Ensure these directories exist and have proper permissions.

## Environment Variables

Both containers support the same environment variables as their non-Docker counterparts:

**Server:**
- `PORT` (default: 3000)
- `BLENDER_PATH` (default: /usr/bin/blender)
- `BLEND_FILE_PATH`
- `OUTPUT_DIR`

**Orchestrator:**
- `PORT` (default: 4000)
- `NODES`
- `BATCH_SIZE`

Pass them with `-e`:
```bash
docker run -e PORT=3001 -e BATCH_SIZE=10 ...
```

## Troubleshooting

### Container won't start
```bash
docker logs <container-name>
```

### Can't connect between containers
Verify both are on the same network:
```bash
docker network inspect blender-network
```

### Volume mount permission errors
Ensure the host directories are readable/writable:
```bash
chmod 755 /path/to/blend/files
chmod 755 /path/to/output
```

### Port already in use
Change the host port mapping:
```bash
docker run -p 3001:3000 ...  # Use host port 3001
```

## Next Steps

Continue to [Part 4: Docker Compose](../part4-docker-compose) to manage multiple containers with a single configuration file.

## Documentation

📚 [Full Tutorial](../../docs/03-docker.md)
