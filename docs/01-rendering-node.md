---
title: "Part 1: Rendering Node"
---

# Part 1: Rendering Node

In this section, we'll create a web API that accepts Blender rendering jobs and manages background processes. This will be the foundation of our distributed system.

<div class="learning-objectives">
<strong>🎯 Learning Objectives</strong>
<ul>
<li>Set up an Express.js server with RESTful endpoints</li>
<li>Handle job submission with POST requests</li>
<li>Manage background processes with Node.js child_process</li>
<li>Implement proper HTTP status codes (202 Accepted, 200 OK)</li>
<li>Use HTTP headers for asynchronous job management</li>
<li>Check process status and implement polling patterns</li>
</ul>
</div>

## Step 1: Creating the API

### 1. Initialize the Node.js Project

Set up a new Node.js project and install the necessary dependencies:

```bash
mkdir server
cd server
npm init -y
npm install express
```

### 2. Create the Server

Create a file named `server.js` and set up a basic Express server:

```javascript
const express = require('express');
const app = express();
app.use(express.json());

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
```

You can run the following command to start the server:

```bash
node server.js
```

You should see: `Server running on port 3000`

## Step 2: Implementing the Endpoints

### 1. Constants for Blender Paths

Define constants for `blenderPath`, `blendFilePath`, and `outputDir`:

```javascript
const blenderPath = '{PUT HERE THE BLENDER PATH}'; // e.g., /usr/bin/blender or C:\\Program Files\\Blender Foundation\\Blender\\blender.exe
const blendFilePath = '/blend/files/splash-pokedstudio.blend'; // Path to your .blend file
const outputDir = '{PUT HERE THE OUTPUT DIR}'; // e.g., /tmp/renders or C:\\renders
```

Create a directory for storing the blend file:

```bash 
mkdir blend
cd blend
mkdir files
```

Place your downloaded `.blend` file in the `blend/files/` directory.

### 2. `/job` POST Endpoint

This endpoint accepts a JSON payload with `from` and `to` properties, invokes Blender with the specified frame interval, and returns the PID of the process.

```javascript
const { exec } = require('child_process');
const express = require('express');
const app = express();

app.use(express.json());

const port = 3000;
const jobs = {}; // Store job processes by their PIDs

const blenderPath = '{PUT HERE THE BLENDER PATH}';
const blendFilePath = '/blend/files/splash-pokedstudio.blend';
const outputDir = '{PUT HERE THE OUTPUT DIR}';

// POST /job endpoint with headers
app.post('/job', (req, res) => {
    const { from, to } = req.body;
    if (from === undefined || to === undefined) {
        return res.status(400).send('Invalid input');
    }

    const command = `${blenderPath} -b ${blendFilePath} -o ${outputDir}/blender-render_#### -E "CYCLES" -s ${from} -e ${to} -t 0 -a`;
    const jobProcess = exec(command);

    const pid = jobProcess.pid;
    jobs[pid] = jobProcess;

    // Capture and log output
    jobProcess.stdout.on('data', (data) => {
        console.log(`Job ${pid} stdout: ${data}`);
    });

    jobProcess.stderr.on('data', (data) => {
        console.error(`Job ${pid} stderr: ${data}`);
    });

    jobProcess.on('close', (code) => {
        console.log(`Job ${pid} exited with code ${code}`);
    });

    // Return 202 Accepted with Location header
    const retryAfter = 5; // seconds
    res.status(202)
        .header('Location', `/job/${pid}`)
        .header('Retry-After', retryAfter)
        .send({ pid });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
```

### 3. `/job/:jobId` GET Endpoint

This endpoint checks the status of a job by its PID and returns the appropriate status code:

```javascript
const { spawnSync } = require('child_process');

app.get('/job/:jobId', (req, res) => {
    const jobId = parseInt(req.params.jobId);
    const jobProcess = jobs[jobId];

    if (!jobProcess) {
        return res.status(400).send('Job not found');
    }

    // Check if process is still running
    const result = spawnSync('ps', ['-p', jobId.toString()]);
    if (result.status !== 0) {
        res.status(200).send('Job completed');
    } else {
        const retryAfter = 5; // Suggest retry after 5 seconds
        res.status(202)
            .header('Location', `/job/${jobId}`)
            .header('Retry-After', retryAfter)
            .send('Job still running');
    }
});
```

### 4. Handling Multiple Concurrent Jobs

The API is designed to handle multiple jobs concurrently by storing PIDs in memory. Multiple requests can be processed simultaneously.

> **Note:** For production use, you'd want to limit concurrent jobs based on available CPU/GPU resources.

### 5. Blender Command Explanation

The Blender command used in the API:

```javascript
const command = `${blenderPath} -b ${blendFilePath} -o ${outputDir}/blender-render_#### -E "CYCLES" -s ${from} -e ${to} -t 0 -a`;
```

**Command-line arguments:**
- **`-b`**: Run Blender in background (no GUI)
- **`${blendFilePath}`**: Path to the Blender file to render
- **`-o ${outputDir}/blender-render_####`**: Output directory and file pattern (#### is replaced with frame number)
- **`-E "CYCLES"`**: Use Cycles rendering engine
- **`-s ${from}`**: Start frame
- **`-e ${to}`**: End frame
- **`-t 0`**: Use all available CPU threads
- **`-a`**: Render animation

📚 [Blender Command-line Documentation](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

## Step 3: Testing the API

### Submitting a Job

Submit a request to render frames 1 to 5:

```bash
curl -X POST http://localhost:3000/job \
  -H "Content-Type: application/json" \
  -d '{"from": 1, "to": 5}'
```

**Response:**
```json
HTTP/1.1 202 Accepted
Location: /job/12345
Retry-After: 5

{"pid": 12345}
```

### Checking Job Status

Use the PID returned from the POST request:

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

### Killing a Process Manually

If you need to stop a rendering job:

**macOS/Linux:**
```bash
kill {processId}
```

**Windows:**
```bash
taskkill /PID {processId} /T /F
```

## Understanding HTTP Status Codes and Headers

### Why Use 202 Accepted and 200 OK?

**202 Accepted** - According to [RFC 7231, Section 6.3.3](https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.3):
- Indicates the request has been accepted for processing
- Processing is not yet complete
- Appropriate for asynchronous, long-running operations

**200 OK** - According to [RFC 7231, Section 6.3.1](https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.1):
- Indicates successful request and processing is complete
- Standard response for successful HTTP requests

### HTTP Headers

**Location**: Indicates the URL to check the job status  
**Retry-After**: Suggests how long (in seconds) the client should wait before polling again

### The Polling Pattern

**Polling** is a technique where the client repeatedly requests the status of a job at regular intervals until completion. This is useful for:
- Long-running processes
- Avoiding keeping connections open
- Providing progress updates to users

The `Retry-After` header helps balance server load by guiding clients on appropriate polling intervals.

## Conclusion

You've built a working rendering node! This server can:
- ✅ Accept rendering jobs via POST requests
- ✅ Manage background Blender processes
- ✅ Report job status via GET requests
- ✅ Handle multiple concurrent jobs
- ✅ Use proper HTTP status codes and headers

### Next Steps

In the next section, we'll build an **orchestrator** that distributes work across multiple rendering nodes for parallel processing.

---

<div class="nav-links">
  <a href="00-setup.html">← Setup</a>
  <a href="02-orchestrator.html">Part 2: Orchestrator →</a>
</div>

---

**💡 See the complete code:** [examples/part1-rendering-node](../examples/part1-rendering-node)

**Having issues?** [Open an issue on GitHub](https://github.com/khnumdev/dist-app-tutorial/issues)
