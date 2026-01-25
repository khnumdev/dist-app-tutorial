# Part 4: Docker Compose Example

This is the complete working code for Part 4 of the distributed systems tutorial.

## What This Does

Deploy the entire distributed rendering system with a single command:
- 3 Blender rendering servers
- 1 orchestrator
- Custom network
- Volume mounts for blend files and output

## Prerequisites

- Docker and Docker Compose installed
- A `.blend` file to render

## Project Structure

```
part4-docker-compose/
├── server/
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
├── orchestrator/
│   ├── Dockerfile
│   ├── orchestrator.js
│   └── package.json
├── blend/
│   └── files/
│       └── your-file.blend
├── output/
│   └── (rendered frames appear here)
├── docker-compose.yml
└── README.md
```

## Setup

### 1. Create Required Directories

```bash
mkdir -p blend/files output
```

### 2. Add Your Blend File

Place your `.blend` file in `blend/files/`:
```bash
cp /path/to/your/file.blend blend/files/splash-pokedstudio.blend
```

## Running

### Start All Services

```bash
docker-compose up --build
```

**What happens:**
1. Builds images for server and orchestrator
2. Creates `blender-network` network
3. Starts 3 blender-server instances
4. Starts orchestrator (waits for servers via `depends_on`)
5. Shows logs from all containers

### Run in Background

```bash
docker-compose up -d --build
```

### View Logs

```bash
# All services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Specific service
docker-compose logs orchestrator
docker-compose logs blender-server-1
```

### Check Status

```bash
docker-compose ps
```

Expected output:
```
NAME                          COMMAND                  STATUS    PORTS
orchestrator                  "node orchestrator.js"   Up        0.0.0.0:4000->4000/tcp
blender-server-1              "node server.js"         Up        0.0.0.0:3001->3000/tcp
blender-server-2              "node server.js"         Up        0.0.0.0:3002->3000/tcp
blender-server-3              "node server.js"         Up        0.0.0.0:3003->3000/tcp
```

## Testing

### Submit a Render Job

```bash
curl -X POST http://localhost:4000/render \
  -H "Content-Type: application/json" \
  -d '{"from": 1, "to": 20}' \
  -i
```

**Response:**
```
HTTP/1.1 202 Accepted
Location: /status/abc123

{"jobId":"abc123"}
```

### Watch the Distribution

In the logs (`docker-compose logs -f`), you'll see:
- **Orchestrator**: Distributing batches
- **blender-server-1**: Processing frames 1-5, 16-20
- **blender-server-2**: Processing frames 6-10
- **blender-server-3**: Processing frames 11-15

### Check Job Status

```bash
curl -X GET http://localhost:4000/status/abc123 -i
```

### View Rendered Frames

```bash
ls -l output/
```

You should see rendered frame files appearing as jobs complete.

## Managing Services

### Stop All Services

```bash
docker-compose down
```

This stops and removes containers and networks (but preserves volumes).

### Stop Without Removing

```bash
docker-compose stop
```

Resume with:
```bash
docker-compose start
```

### Rebuild After Code Changes

```bash
docker-compose up --build
```

### Remove Everything Including Volumes

```bash
docker-compose down -v
```

**⚠️ Warning:** This deletes all data in volumes!

## Configuration

### Environment Variables

Edit `docker-compose.yml` to customize:

**Server:**
```yaml
environment:
  - BLENDER_PATH=/usr/bin/blender
  - BLEND_FILE_PATH=/app/blend/files/your-file.blend
  - OUTPUT_DIR=/app/output
```

**Orchestrator:**
```yaml
environment:
  - BATCH_SIZE=10  # Change batch size
```

### Scaling

To run more servers, add another service in `docker-compose.yml`:

```yaml
  blender-server-4:
    build:
      context: ./server
    ports:
      - "3004:3000"
    # ... same configuration ...
```

Update orchestrator `NODES`:
```yaml
- NODES=http://blender-server-1:3000,http://blender-server-2:3000,http://blender-server-3:3000,http://blender-server-4:3000
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start all services |
| `docker-compose up -d` | Start in detached mode |
| `docker-compose up --build` | Rebuild images before starting |
| `docker-compose down` | Stop and remove containers |
| `docker-compose ps` | List running services |
| `docker-compose logs` | View logs |
| `docker-compose logs -f` | Follow logs |
| `docker-compose restart` | Restart all services |
| `docker-compose stop` | Stop services (keep containers) |
| `docker-compose start` | Start stopped services |
| `docker-compose exec <service> <cmd>` | Run command in service |

## Troubleshooting

### Port Already in Use

Change ports in `docker-compose.yml`:
```yaml
ports:
  - "3101:3000"  # Use 3101 on host instead of 3001
```

### Services Can't Communicate

```bash
# Verify network
docker network inspect part4-docker-compose_blender-network
```

### Volume Mount Issues

Ensure directories exist:
```bash
mkdir -p blend/files output
```

Paths in `docker-compose.yml` are relative to the docker-compose.yml file location.

### Build Cache Issues

```bash
docker-compose build --no-cache
docker-compose up
```

### View Individual Container

```bash
docker-compose exec blender-server-1 /bin/bash
```

## Performance

With 3 servers and batch size of 5:
- **20 frames** = 4 batches
- Distributed across 3 servers
- **~3x faster** than single server!

## Next Steps

Continue to [Part 5: Enhancements](../../docs/05-enhancements.md) to learn about:
- Rate limiting
- Message queues
- Kubernetes deployment
- Monitoring and logging
- Production best practices

## Documentation

📚 [Full Tutorial](../../docs/04-docker-compose.md)

## Quick Start (TL;DR)

```bash
# Setup
mkdir -p blend/files output
cp /path/to/your/file.blend blend/files/splash-pokedstudio.blend

# Run
docker-compose up -d --build

# Test
curl -X POST http://localhost:4000/render \
  -H "Content-Type: application/json" \
  -d '{"from": 1, "to": 20}'

# Check status
docker-compose logs -f

# Clean up
docker-compose down
```
