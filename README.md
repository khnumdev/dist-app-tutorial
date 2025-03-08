
# **How to build your first distributed app**

> **Note:** This is a tutorial to start building an example of a distributed app and is not intended for production deployment.


![img](img/image.png)

## **Introduction**
In this tutorial, we will create a web app that allows users to submit Blender jobs. The app will consist of a NodeJS and Express API with endpoints to submit and check the status of rendering jobs. We'll use a hardcoded Blender example file for demonstration purposes.

## **Step 1: Setting Up the Environment**

### **Install NodeJS and Express**
First, make sure you have NodeJS installed. You can download it from [here](https://nodejs.org/). Then, install the Express framework by running:

```bash
npm install express
```

### **Install Blender**
Ensure Blender is installed on your system and accessible via the command line. You can download Blender from [here](https://www.blender.org/download/).

## Part 1: Rendering node
### **Step 2: Creating the API**

#### **1. Initialize the NodeJS Project**
Set up a new NodeJS project and install the necessary dependencies:

```bash
mkdir blender-job-api
cd blender-job-api
npm init -y
npm install express
```

#### **2. Create the Server**
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

You can run the following command to start the server listening:

```bash
node server.js
```

### **Step 3: Implementing the Endpoints**

#### **1. Constants for Blender Paths**
Define constants for `blenderPath`, `blendFilePath`, and `outputDir`:

```javascript
const blenderPath = '{PUT HERE THE BLENDER PATH}'; // Populate with actual Blender path
const blendFilePath = '{PUT HERE THE BLEND FILE PATH}'; // Populate with actual blend file path
const outputDir = '{PUT HERE THE OUTPUT DIR}'; // Populate with desired output directory
```

#### **2. `/job` POST Endpoint with Headers**
This endpoint will accept a JSON payload with "from" and "to" properties, invoke Blender with the specified frames interval, and return the PID of the process.

```javascript
const { exec } = require('child_process');
const express = require('express');
const app = express();

app.use(express.json());

const port = 3000;
const jobs = {}; // Store job processes by their PIDs

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// POST /job endpoint with headers
app.post('/job', (req, res) => {
    const { from, to } = req.body;
    if (from === undefined || to === undefined) {
        return res.status(400).send('Invalid input');
    }

    const command = `${blenderPath} -b ${blendFilePath} -o ${outputDir}/blender-render_#### -E \"CYCLES\" -s ${from} -e ${to} -t 0 -a`;
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

    // Calculate a suggested retry-after time (e.g., 5 seconds)
    const retryAfter = 5; // seconds

    res.status(202)
        .header('Location', `/job/${pid}`)
        .header('Retry-After', retryAfter)
        .send({ pid });
});
```

#### **3. `/job/:jobId` GET Endpoint with Headers**
This endpoint will check the status of the given PID and return the appropriate status code based on the job status.

```javascript
const { spawnSync } = require('child_process');

app.get('/job/:jobId', (req, res) => {
    const jobId = parseInt(req.params.jobId);
    const jobProcess = jobs[jobId];

    if (!jobProcess) {
        return res.status(400).send('Job not found');
    }

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

#### **4. Handling Multiple Concurrent Jobs**
The API is designed to handle multiple jobs concurrently by storing PIDs in memory and allowing multiple requests simultaneously. For this tutorial, the configuration is left as is, but it should be defined based on the machines where this will be executed.

#### **5. Blender Command Explanation**
The Blender command used in the API is structured as follows:

```javascript
const command = `${blenderPath} -b ${blendFilePath} -o ${outputDir}/blender-render_#### -E \"CYCLES\" -s ${from} -e ${to} -t 0 -a`;
```

- **`-b`**: Runs Blender in background (no GUI).
- **`${blendFilePath}`**: Path to the Blender file to be rendered.
- **`-o ${outputDir}/blender-render_####`**: Specifies the output directory and file pattern.
- **`-E "CYCLES"`**: Sets the rendering engine to Cycles.
- **`-s ${from}`**: Start frame.
- **`-e ${to}`**: End frame.
- **`-t 0`**: Use all available threads.
- **`-a`**: Render animation.

For more details on Blender command-line arguments, refer to the [Blender documentation](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html).

### **Step 4: Managing Processes**

#### **Killing a Process from the Terminal**
To kill a Blender process manually, use the `kill` command followed by the process ID:

```bash
kill {processId}
```
Replace `{processId}` with the actual PID of the Blender process you want to terminate.

### **Step 5: Understanding Response Codes and Headers**

#### **Why Use Status Code 202, 200, and Headers?**

- **202 Accepted**: This status code indicates that the request has been accepted for processing, but the processing is not yet complete. According to [RFC 7231, Section 6.3.3](https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.3), it allows the server to provide information about when the client should check back for the status.

- **200 OK**: This status code indicates that the request was successful and the processing is complete. According to [RFC 7231, Section 6.3.1](https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.1), it is the standard response for successful HTTP requests.

- **Headers**:
  - **Location**: Indicates the URL to check the status of the job.
  - **Retry-After**: Suggests how long (in seconds) the client should wait before retrying the request to check the job status.

#### **Polling and Its Intention**
Polling is a technique where the client repeatedly requests the status of a job at regular intervals until the job is complete. This is useful when the client needs to know the result of a long-running process without holding the connection open.

The `Retry-After` header guides the client on when to make the next request, balancing the load on the server and ensuring timely updates to the client.

### **Conclusion**
In this tutorial, we've created a web app to submit and monitor Blender rendering jobs. We set up a NodeJS and Express API with endpoints for job submission and status checking. We've also included instructions on how to manage Blender processes manually and explained the use of HTTP status codes and headers.

# **Part 2: Creating an Orchestrator for Blender Jobs**

## **Introduction**
In this part of the tutorial, we will create an orchestrator to manage and distribute Blender rendering jobs across multiple nodes. The orchestrator will be a NodeJS and Express API that communicates with the API from Part 1 to submit and monitor rendering jobs. This example is designed to demonstrate the basics of building a distributed application and is not intended for production deployment.

## **Why Use an Orchestrator?**
An orchestrator helps manage and distribute workloads across multiple nodes, ensuring efficient use of resources and parallel processing. It can split a large task into smaller batches, distribute these batches to different nodes, and monitor their progress. This approach improves scalability, fault tolerance, and resource utilization.

## **Step 1: Setting Up the Orchestrator Environment**

### **Install NodeJS and Express**
First, make sure you have NodeJS installed. You can download it from [here](https://nodejs.org/). Then, install the Express framework and Axios by running:

```bash
npm install express axios
```

## **Step 2: Creating the Orchestrator API**

### **1. Initialize the NodeJS Project**
Set up a new NodeJS project for the orchestrator:

```bash
mkdir orchestrator
cd orchestrator
npm init -y
npm install express axios
```

### **2. Create the Server**
Create a file named `orchestrator.js` and set up the orchestrator server:

```javascript
const express = require('express');
const axios = require('axios'); // For making HTTP requests to the nodes
const app = express();

app.use(express.json());

const port = 4000;
const NODES = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005'
]; // List of node endpoints
const BATCH_SIZE = 5; // Define batch size as a constant
let jobs = {}; // Store all jobs

// POST /render endpoint to start rendering a movie
app.post('/render', async (req, res) => {
    const { from, to } = req.body;
    if (from === undefined || to === undefined) {
        return res.status(400).send('Invalid input');
    }

    const jobId = generateJobId();
    jobs[jobId] = { status: 'pending', batches: [] };
    const frameChunks = splitFramesIntoChunks(from, to, BATCH_SIZE);
    const jobPromises = frameChunks.map((chunk, index) =>
        assignJobToNode(NODES[index % NODES.length], chunk.from, chunk.to, jobId)
    );

    try {
        const results = await Promise.all(jobPromises);
        jobs[jobId].batches.push(...results); // Save batch info
        res.status(202).header('Location', `/status/${jobId}`).send({ jobId });
    } catch (error) {
        console.error('Error assigning jobs:', error);
        jobs[jobId].status = 'failed';
        res.status(500).send('Failed to distribute jobs');
    }
});

// GET /status/:jobId endpoint to check overall job status
app.get('/status/:jobId', async (req, res) => {
    const jobId = req.params.jobId;
    const job = jobs[jobId];

    if (!job) {
        return res.status(404).send('Job not found');
    }

    try {
        const statusPromises = job.batches.map(batch =>
            checkJobStatus(batch.node, batch.pid)
        );
        const statuses = await Promise.all(statusPromises);
        const allCompleted = statuses.every(status => status === 'completed');

        if (allCompleted) {
            job.status = 'completed';
            res.status(200).send('Job completed');
        } else {
            job.status = 'in-progress';
            res.status(202).header('Location', `/status/${jobId}`).header('Retry-After', 5).send('Job still running');
        }
    } catch (error) {
        console.error('Error checking job statuses:', error);
        res.status(500).send('Failed to fetch statuses');
    }
});

// Utility function to generate a unique job ID
function generateJobId() {
    return Math.random().toString(36).substring(2, 15);
}

// Utility function to split frames into chunks
function splitFramesIntoChunks(from, to, batchSize) {
    const chunks = [];
    for (let i = from; i <= to; i += batchSize) {
        chunks.push({ from: i, to: Math.min(i + batchSize - 1, to) });
    }
    return chunks;
}

// Utility function to assign a job to a node
async function assignJobToNode(nodeUrl, from, to, jobId) {
    console.log(`Invoking URL: ${nodeUrl}/job with frames ${from} to ${to}`);
    try {
        const response = await axios.post(`${nodeUrl}/job`, { from, to });
        console.log(`Job assigned to ${nodeUrl} with PID: ${response.data.pid}`);
        return { node: nodeUrl, pid: response.data.pid };
    } catch (error) {
        console.error(`Failed to assign job to ${nodeUrl}:`, error.message);
        throw error;
    }
}

// Utility function to check job status
async function checkJobStatus(nodeUrl, pid) {
    const response = await axios.get(`${nodeUrl}/job/${pid}`);
    return response.data.status === 'Job completed' ? 'completed' : 'running';
}

// Start the orchestrator server
app.listen(port, () => {
    console.log(`Orchestrator running on port ${port}`);
});
```

### **Note:**
The node URLs in the `NODES` array are based on Part 1 of this tutorial. They can be the same (e.g., `http://localhost:3000` if you run multiple instances of the node API) or different, depending on your setup. This is a tutorial example, and the configuration may need to be adjusted for your specific environment.

Once the POST request is made, you can see in the terminal of the `server.js` (from Part 1) how Blender is running.

## **Step 3: Running the Orchestrator Server**

Navigate to the `orchestrator` directory and start the server:

```bash
node orchestrator.js
```

You should see a message indicating that the server is running on port 4000:

```
Orchestrator running on port 4000
```

## **Step 4: Using the Orchestrator API**

### **Submitting a Render Job**

To submit a request to render frames 1 to 20, use the following `curl` command:

```bash
curl -X POST http://localhost:4000/render -H "Content-Type: application/json" -d '{"from": 1, "to": 20}' -i
```

### **Example Output:**

```
HTTP/1.1 202 Accepted
Location: /status/abcd1234
Content-Type: application/json
Content-Length: 20

{"jobId":"abcd1234"}
```

### **Checking the Status of a Job**

To check the status of the job, use the following `curl` command, replacing `abcd1234` with the actual job ID returned by the POST request:

```bash
curl -X GET http://localhost:4000/status/abcd1234 -i
```

### **Example Response when Job is Still Running:**

```
HTTP/1.1 202 Accepted
Location: /status/abcd1234
Retry-After: 5
Content-Type: text/plain
Content-Length: 17

Job still running
```

### **Example Response when Job is Completed:**

```
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 13

Job completed
```

### **Example Response when Job is Not Found:**

```
HTTP/1.1 404 Not Found
Content-Type: text/plain
Content-Length: 13

Job not found
```

### **Understanding Promises in JavaScript**

A **promise** in JavaScript represents the eventual completion (or failure) of an asynchronous operation and its resulting value. Promises are used to handle asynchronous tasks in a more manageable way compared to callbacks. In the orchestrator, we use promises to handle HTTP requests to nodes and check job statuses.

For more information on promises, refer to the [MDN Web Docs on Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

## **Conclusion**
In Part 2 of this tutorial, we've created an orchestrator to manage and distribute Blender rendering jobs across multiple nodes. The orchestrator API splits the frame range into smaller batches, submits them to the nodes, and monitors their progress. We used NodeJS and Express to build the orchestrator and provided `curl` examples for submitting and checking the status of jobs.