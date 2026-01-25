# Part 1: Rendering Node Example

This is the complete working code for Part 1 of the distributed systems tutorial.

## What This Does

A Node.js/Express server that:
- Accepts Blender rendering jobs via HTTP API
- Manages background Blender processes
- Reports job status via polling

## Prerequisites

- Node.js (v14+)
- Blender installed and accessible from command line
- A `.blend` file to render

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file or export these variables:
   ```bash
   export BLENDER_PATH="/usr/bin/blender"
   export BLEND_FILE_PATH="/path/to/your/file.blend"
   export OUTPUT_DIR="/path/to/output"
   ```

3. **Create output directory:**
   ```bash
   mkdir -p /path/to/output
   ```

## Running the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

You should see:
```
Server running on port 3000
```

## Testing

### Submit a rendering job:

```bash
curl -X POST http://localhost:3000/job \
  -H "Content-Type: application/json" \
  -d '{"from": 1, "to": 5}' \
  -i
```

**Response:**
```
HTTP/1.1 202 Accepted
Location: /job/12345
Retry-After: 5

{"pid":12345}
```

### Check job status:

```bash
curl -X GET http://localhost:3000/job/12345 -i
```

**While running:**
```
HTTP/1.1 202 Accepted
Location: /job/12345
Retry-After: 5

Job still running
```

**When complete:**
```
HTTP/1.1 200 OK

Job completed
```

## Endpoints

- `POST /job` - Submit a new rendering job
  - Body: `{"from": <start_frame>, "to": <end_frame>}`
  - Returns: `{"pid": <process_id>}`
  
- `GET /job/:jobId` - Check job status
  - Returns: Status message with appropriate HTTP code

- `GET /health` - Health check endpoint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `BLENDER_PATH` | Path to Blender executable | `/usr/bin/blender` |
| `BLEND_FILE_PATH` | Path to .blend file | `/app/blend/files/splash-pokedstudio.blend` |
| `OUTPUT_DIR` | Directory for rendered frames | `/app/output` |

## Troubleshooting

### "Job not found" error
Make sure you're using the PID returned from the POST request.

### Blender not found
Verify your `BLENDER_PATH` is correct:
```bash
which blender  # On macOS/Linux
where blender  # On Windows
```

### Permission denied
Ensure the output directory is writable:
```bash
chmod 755 /path/to/output
```

## Next Steps

Continue to [Part 2: Orchestrator](../part2-orchestrator) to build a system that distributes work across multiple rendering nodes.

## Documentation

📚 [Full Tutorial](../../docs/01-rendering-node.md)
