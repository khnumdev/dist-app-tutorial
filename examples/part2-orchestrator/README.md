# Part 2: Orchestrator Example

This is the complete working code for Part 2 of the distributed systems tutorial.

## What This Does

An orchestrator that:
- Splits rendering jobs into batches
- Distributes batches across multiple rendering nodes
- Aggregates status from all nodes
- Uses Promise.all() for parallel execution

## Prerequisites

- Node.js (v14+)
- **3 rendering servers running** (from Part 1)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start rendering servers:**
   
   In separate terminals, start 3 instances of the Part 1 server on different ports:
   
   **Terminal 1:**
   ```bash
   cd ../part1-rendering-node
   PORT=3001 npm start
   ```
   
   **Terminal 2:**
   ```bash
   cd ../part1-rendering-node
   PORT=3002 npm start
   ```
   
   **Terminal 3:**
   ```bash
   cd ../part1-rendering-node
   PORT=3003 npm start
   ```

3. **Configure environment variables (optional):**
   ```bash
   export NODES="http://localhost:3001,http://localhost:3002,http://localhost:3003"
   export BATCH_SIZE=5
   ```

## Running the Orchestrator

```bash
npm start
```

You should see:
```
Orchestrator running on port 4000
Managing 3 rendering nodes with batch size 5
```

## Testing

### Submit a rendering job (20 frames):

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

**What happens:**
- Frames 1-20 split into 4 batches (5 frames each)
- Batch 1 (frames 1-5) → Server on port 3001
- Batch 2 (frames 6-10) → Server on port 3002
- Batch 3 (frames 11-15) → Server on port 3003
- Batch 4 (frames 16-20) → Server on port 3001 (round-robin)

### Check job status:

```bash
curl -X GET http://localhost:4000/status/abc123 -i
```

**While running:**
```
HTTP/1.1 202 Accepted
Location: /status/abc123
Retry-After: 5

Job still running
```

**When all batches complete:**
```
HTTP/1.1 200 OK

Job completed
```

## Endpoints

- `POST /render` - Submit a rendering job
  - Body: `{"from": <start_frame>, "to": <end_frame>}`
  - Returns: `{"jobId": "<unique_id>"}`
  
- `GET /status/:jobId` - Check job status
  - Returns: Aggregated status from all nodes

- `GET /health` - Health check endpoint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Orchestrator port | `4000` |
| `NODES` | Comma-separated list of rendering node URLs | `http://localhost:3001,http://localhost:3002,http://localhost:3003` |
| `BATCH_SIZE` | Number of frames per batch | `5` |

## How It Works

### 1. Frame Splitting
```javascript
splitFramesIntoChunks(1, 20, 5) 
// Returns: [{from:1, to:5}, {from:6, to:10}, {from:11, to:15}, {from:16, to:20}]
```

### 2. Round-Robin Distribution
Uses modulo to cycle through available nodes:
```javascript
NODES[index % NODES.length]
// index 0 → node 0
// index 1 → node 1
// index 2 → node 2
// index 3 → node 0 (wraps around)
```

### 3. Parallel Execution
```javascript
await Promise.all(jobPromises)
// Waits for all HTTP requests to complete
```

## Troubleshooting

### "Failed to distribute jobs"
- Ensure all rendering servers are running
- Check server URLs are correct
- Verify network connectivity

### Connection refused
One or more rendering servers aren't running. Start all 3 servers before running the orchestrator.

### Batches not distributing evenly
Check that `BATCH_SIZE` divides your frame range appropriately. For example:
- 20 frames ÷ 5 batch size = 4 batches ✓
- 22 frames ÷ 5 batch size = 4 batches + 1 batch of 2 frames

## Expected Output

When you submit a job, you should see in the orchestrator logs:
```
Invoking URL: http://localhost:3001/job with frames 1 to 5
Invoking URL: http://localhost:3002/job with frames 6 to 10
Invoking URL: http://localhost:3003/job with frames 11 to 15
Invoking URL: http://localhost:3001/job with frames 16 to 20
Job assigned to http://localhost:3001 with PID: 12345
Job assigned to http://localhost:3002 with PID: 12346
Job assigned to http://localhost:3003 with PID: 12347
Job assigned to http://localhost:3001 with PID: 12348
```

## Next Steps

Continue to [Part 3: Docker](../part3-docker) to containerize the rendering nodes and orchestrator.

## Documentation

📚 [Full Tutorial](../../docs/02-orchestrator.md)
