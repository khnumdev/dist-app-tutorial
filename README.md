
# **How to build your first distributed system**

> **Note:** This is a tutorial to start building an example of a distributed system and is not intended for a production deployment.


![img](img/image.png)

## Contributing

We welcome contributions! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

# **Index**

[Introduction](#introduction)

0. [Setting Up the Environment](#setting-up-the-environment)

1. [Part 1: Rendering node](#part-1-creating-a-web-app-to-submit-blender-jobs)
   - [Step 1: Creating the API](#step-1-creating-the-api)
   - [Step 2: Implementing the Endpoints](#step-2-implementing-the-endpoints)
   - [Step 3: Managing Processes](#step-3-managing-processes)
   - [Step 4: Understanding Response Codes and Headers](#step-4-understanding-response-codes-and-headers)
   - [Conclusion](#conclusion)

2. [Part 2: Creating a render Orchestrator](#part-2-creating-an-orchestrator-for-blender-jobs)
   - [Introduction](#introduction-1)
   - [Why Use an Orchestrator?](#why-use-an-orchestrator)
   - [Step 1: Setting Up the Orchestrator Environment](#step-1-setting-up-the-orchestrator-environment)
   - [Step 2: Creating the Orchestrator API](#step-2-creating-the-orchestrator-api)
   - [Step 3: Running the Orchestrator Server](#step-3-running-the-orchestrator-server)
   - [Step 4: Using the Orchestrator API](#step-4-using-the-orchestrator-api)
   - [Conclusion](#conclusion-1)

3. [Part 3: Dockerizing the Blender Server and Orchestrator](#part-3-dockerizing-the-blender-server-and-orchestrator)
   - [Introduction](#introduction-2)
   - [Why Docker?](#why-docker)
   - [Limitations and Considerations](#limitations-and-considerations)
   - [Warning: Limited CPU/GPU Resources in Docker](#warning-limited-cpugpu-resources-in-docker)
   - [Step 1: Installing Docker](#step-1-installing-docker)
   - [Step 2: Changes Required in `server.js` for Supporting Docker](#step-2-changes-required-in-serverjs-for-supporting-docker)
   - [Step 3: Dockerfile for the Blender Server](#step-3-dockerfile-for-the-blender-server)
   - [Step 4: Docker Network](#step-4-docker-network)
   - [Step 5: Changes Required in `orchestrator.js` for Supporting Docker Network](#step-5-changes-required-in-orchestratorjs-for-supporting-docker-network)
   - [Dockerfile for the Orchestrator](#dockerfile-for-the-orchestrator)
   - [Test the Orchestrator](#test-the-orchestrator)
   - [Conclusion](#conclusion-2)

4. [Part 4: Using Docker Compose for Deployment](#part-4-using-docker-compose-for-deployment)
   - [Introduction](#introduction-3)
   - [Why Docker Compose?](#why-docker-compose)
   - [Step 1: Creating the `docker-compose.yml` File](#step-1-creating-the-docker-composeyml-file)
   - [Directory Structure](#directory-structure)
   - [Step 2: Updating the Orchestrator to Reference Three Servers](#step-2-updating-the-orchestrator-to-reference-three-servers)
   - [Step 3: Building and Running the Docker Compose Services](#step-3-building-and-running-the-docker-compose-services)
   - [Step 4: Testing the Orchestrator](#step-4-testing-the-orchestrator)
   - [Conclusion](#conclusion-3)

5. [Enhancements and Future Improvements](#enhancements-and-future-improvements)
   - [Introduction](#introduction-4)
   - [Support for 429 Response (Too Many Requests)](#support-for-429-response-too-many-requests)
   - [Limit Server to Receive a Single Request](#limit-server-to-receive-a-single-request)
   - [Strategies to Deploy in Production (e.g., AKS)](#strategies-to-deploy-in-production-eg-aks)
   - [Discovery System](#discovery-system)
   - [Using Queues Instead of Direct HTTP Calls](#using-queues-instead-of-direct-http-calls)
   - [Logging Improvements for Traceability](#logging-improvements-for-traceability)
   - [Other Potential Improvements](#other-potential-improvements)
     - [Load Balancing](#load-balancing)
     - [Fault Tolerance and High Availability](#fault-tolerance-and-high-availability)
     - [Security Enhancements](#security-enhancements)
     - [Performance Optimization](#performance-optimization)
   - [Conclusion](#conclusion-4)

## **Introduction**
In this tutorial, we will create a web app that allows users to submit Blender jobs. The app will consist of a NodeJS and Express API with endpoints to submit and check the status of rendering jobs. We'll use a hardcoded Blender example file for demonstration purposes.

## **Setting Up the Environment**

### **Install NodeJS**
First, make sure you have NodeJS and NPM installed. You can download it from [here](https://nodejs.org/).

### **Install Blender**
Ensure Blender is installed on your system and accessible via the command line. You can download Blender from [here](https://www.blender.org/download/).

The image used in this example is [Racing car sample](https://www.blender.org/download/demo/test/splash-pokedstudio.blend.zip).

**NOTE ABOUT BLENDER**: Blender rendering is an intensive resource consumption process. In this tutorial, some examples suggests to render up to 5 frames or to have multiple render processes working in parallel in your machine. In case of your computer face issues doing this, please adjust these numbers to a reasonable value in order to follow the tutorial.

### **Main folder**

We are going to create our working folder for this tutorial:

```bash
mkdir distributed-system-tutorial
cd distributed-system-tutorial
```

## Part 1: Rendering node
### **Step 1: Creating the API**

#### **1. Initialize the NodeJS Project**
Set up a new NodeJS project and install the necessary dependencies:

```bash
mkdir server
cd server
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

           +---------+
           | Client  |
           +---------+
                |
                | Render Request (frames 1-20)
                v
         +-----------------+
         |  Orchestrator   |
         | (Split & Assign)|
         +-----------------+
                |    \
        Batch 1 |     \  Batch 2,3,...
                v      \
         +---------------+    +---------------+
         | Blender       |    | Blender       |
         | Server        |    | Server        |
         +---------------+    +---------------+
                ^      \
                |       \
                +--------+
                     |
         (Status Updates, Aggregation)
                     |
                     v
               +----------+
               | Client   |
               +----------+


## **Part 3: Dockerizing the Blender Server and Orchestrator**

### **Introduction**
In this part of the tutorial, we'll create Docker images for both the Blender server (from Part 1) and the orchestrator (from Part 2). We'll use the `linuxserver/blender` Docker image as a base for the server and build custom Docker images for both components. This process will help ensure consistency, portability, and ease of deployment.

### **Why Docker?**
Docker provides a way to package and run applications in isolated environments called containers. This approach offers several benefits:
- **Consistency**: Ensures that the application runs the same way in any environment.
- **Portability**: Containers can be easily shared and deployed across different systems.
- **Isolation**: Keeps applications and their dependencies separate from the host system.
- **Scalability**: Simplifies scaling applications by running multiple containers.

### **Limitations and Considerations**
- **Image Size**: Blender is a large application, so the Docker image may be substantial in size.
- **Resource Management**: Running Blender inside a container may require careful tuning of resource limits to avoid overwhelming the host system.
- **Storage**: Ensure that the Blender files and output directories are properly mounted to access them outside the container.

### **Warning: Limited CPU/GPU Resources in Docker**
It's important to note that Docker has limited access to CPU and GPU resources, which may not be ideal for resource-intensive applications like Blender. For more information on Docker's limitations with CPU and GPU resources, refer to the following links:
- **[Docker CPU Limitations](https://docs.docker.com/config/containers/resource_constraints/#cpu)**
- **[Docker GPU Limitations](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/overview.html)**

However, for the purpose of this tutorial, Docker is used to demonstrate the basics of containerization and orchestration.

### **Step 1: Installing Docker**

To get started with Docker, you'll need to install it on your machine. Follow the instructions for your operating system:

- **[Docker for Windows](https://docs.docker.com/docker-for-windows/install/)**
- **[Docker for Mac](https://docs.docker.com/docker-for-mac/install/)**
- **[Docker for Linux](https://docs.docker.com/engine/install/)**

### **Step 2: Changes Required in `server.js` for Supporting Docker**

Update the `server.js` file with the following changes to support running inside a Docker container:

```javascript
const port = 3000; // Port to match Dockerfile

const blenderPath = '/usr/bin/blender'; // Blender path inside the container
const blendFilePath = '/app/blend/files/splash-pokedstudio.blend'; // Adjust to your mounted volume path
const outputDir = '/app/output/blender-render_####'; // Adjust to your mounted volume path
```

### **Step 3: Dockerfile for the Blender Server**

Create a `Dockerfile` for the Blender server in the project directory:

```dockerfile
# Use the linuxserver/blender Docker image as the base
FROM linuxserver/blender:latest

# Install NodeJS and npm
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy application files into the container
COPY . .

# Install NodeJS dependencies
RUN npm install

# Expose the port that your API will run on
EXPOSE 3000

# Override the entrypoint to bypass starting Xvnc and Openbox
ENTRYPOINT []

# Start the NodeJS application
CMD ["node", "server.js"]
```

### **Building and Running the Docker Image**

1. **Build the Docker image:**
   ```bash
   docker build -t blender-server .
   ```

2. **Run the container, ensuring that the Blender files and output directories are properly mounted:**
   ```bash
   docker run -p 3000:3000 --network blender-network --name blender-server -v /path/to/blend/files:/app/blend/files -v /path/to/output:/app/output blender-server
   ```

Replace `/path/to/blend/files` and `/path/to/output` with the actual paths on your host system.

### **Step 4: Docker Network**

To allow communication between the Blender server and the orchestrator, create a custom Docker network:

```bash
docker network create blender-network
```

### **Step 5: Changes Required in `orchestrator.js` for Supporting Docker Network**

Update the `orchestrator.js` file with the following changes to use the container name as the hostname:

```javascript
const NODES = [
    'http://blender-server:3000', // Use the container name as the hostname
];
```

### **Dockerfile for the Orchestrator**

Create a `Dockerfile` for the orchestrator in its project directory:

```dockerfile
# Use the official NodeJS image as the base
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy application files into the container
COPY . .

# Install NodeJS dependencies
RUN npm install

# Expose the port that your API will run on
EXPOSE 4000

# Start the NodeJS application
CMD ["node", "orchestrator.js"]
```

### **Building and Running the Docker Image**

1. **Build the Docker image:**
   ```bash
   docker build -t orchestrator .
   ```

2. **Run the container on the custom network:**
   ```bash
   docker run -p 4000:4000 --network blender-network orchestrator
   ```

### **Test the Orchestrator**

Submit a render request for 20 frames (split into batches of 5 frames) using `curl`:

```bash
curl -X POST http://localhost:4000/render -H "Content-Type: application/json" -d '{"from": 1, "to": 20}' -i
```

This is the same `curl` command used in the regular case.

### **Conclusion**

Dockerizing the Blender server and orchestrator ensures consistent, portable, and isolated environments for running these applications.

## **Part 4: Using Docker Compose for Deployment**

### **Introduction**
In this part of the tutorial, we'll use Docker Compose to manage and run multiple containers for the Blender server and the orchestrator.

### **Why Docker Compose?**
Docker Compose simplifies the process of managing multi-container Docker applications. It allows you to define and run multiple services in a single file (`docker-compose.yml`), making it easier to manage dependencies, networking, and configuration.

### **Step 1: Creating the `docker-compose.yml` File**

Create a `docker-compose.yml` file in the project directory to define the three Blender server instances and the orchestrator:

```yaml
version: '3.8'
services:
  blender-server-1:
    build:
      context: ./server
    ports:
      - "3001:3000"
    volumes:
      - ./blend/files:/app/blend/files
      - ./output:/app/output
    networks:
      - blender-network

  blender-server-2:
    build:
      context: ./server
    ports:
      - "3002:3000"
    volumes:
      - ./blend/files:/app/blend/files
      - ./output:/app/output
    networks:
      - blender-network

  blender-server-3:
    build:
      context: ./server
    ports:
      - "3003:3000"
    volumes:
      - ./blend/files:/app/blend/files
      - ./output:/app/output
    networks:
      - blender-network

  orchestrator:
    build:
      context: ./orchestrator
    ports:
      - "4000:4000"
    depends_on:
      - blender-server-1
      - blender-server-2
      - blender-server-3
    networks:
      - blender-network

networks:
  blender-network:
    driver: bridge
```

### **Directory Structure**

Ensure your `distributed-system-tutorial` directory is structured as follows:

```
distributed-system-tutorial/
│
├── server/
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   └── blend/
│       └── files/
├── orchestrator/
│   ├── Dockerfile
│   ├── orchestrator.js
│   ├── package.json
└── docker-compose.yml
```

### **Step 2: Updating the Orchestrator to Reference Three Servers**

Update the `NODES` in `orchestrator.js` file to reference the three Blender servers:

```javascript
const NODES = [
    'http://blender-server-1:3000', // First server
    'http://blender-server-2:3000', // Second server
    'http://blender-server-3:3000', // Third server
]; // List of node endpoints
```

### **Step 3: Building and Running the Docker Compose Services**

Navigate to the project directory and run the following command to build and start the services:

```bash
docker-compose up --build
```

This command will build the Docker images for the three Blender servers and the orchestrator, mount the volumes, and start the containers.

### **Step 4: Testing the Orchestrator**

Submit a render request for 20 frames (split into batches of 5 frames) using `curl`:

```bash
curl -X POST http://localhost:4000/render -H "Content-Type: application/json" -d '{"from": 1, "to": 20}' -i
```

This is the same `curl` command used in the regular case.

### **Conclusion**

Using Docker Compose simplifies the management and deployment of multi-container applications like the Blender server and orchestrator. By setting up three Blender server instances, you can distribute rendering tasks more efficiently. This setup can be easily extended for deployment to other environments.

                      +---------+
                      | Client  |
                      +---------+
                           |
                           | Render Request (frames 1-20)
                           v
                    +------------------+
                    |  Orchestrator    |
                    | (Split job into  |
                    |     batches)     |
                    +------------------+
                          / |  \   ...  
                         /  |   \
               +----------+ +---------+ +----------+  
               | Blender  | | Blender | | Blender  | 
               | Server 1 | | Server 2| | Server 3 |
               +----------+ +---------+ +----------+
                   ^            ^            ^
                   |            |            |
                   +----Status Updates-------+
                           |
                           v
                      +---------+
                      | Client  |
                      +---------+


## **Enhancements and Future Improvements**

### **Introduction**
In this chapter, we'll explore potential enhancements and improvements to optimize the Blender server and orchestrator setup. These suggestions aim to improve performance, scalability, reliability, and ease of deployment in production environments.

### **Support for 429 Response (Too Many Requests)**
To handle scenarios where too many requests are made to the server, we can implement rate limiting. When the rate limit is exceeded, the server should respond with a `429 Too Many Requests` status code. Rate limiting can help prevent overloading the server and ensure fair usage.

**Key Points:**
- **Implement Rate Limiting**: Use libraries like `express-rate-limit` in Node.js to limit the number of requests.
- **Return 429 Status Code**: Configure the rate limiter to return a `429 Too Many Requests` status code when the limit is exceeded.
- **Documentation**: [RFC 6585 - Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585)

### **Limit Server to Receive a Single Request**
To ensure that the Blender server processes one job at a time, we can implement a check to reject new jobs if a process is already running. The orchestrator should handle this by queuing pending requests and assigning them to available servers when they become free.

**Key Points:**
- **Single Job Processing**: Modify the server to check if a job is already running and reject new jobs with an appropriate status code (e.g., `503 Service Unavailable`).
- **Job Queueing in Orchestrator**: Implement a job queue in the orchestrator to manage pending requests and assign them to available servers.
- **Handling Job Rejections**: Orchestrator should retry rejected jobs until they are successfully assigned.

### **Strategies to Deploy in Production (e.g., AKS)**
Deploying the Blender server and orchestrator in a production environment requires careful planning to ensure scalability, reliability, and security. Azure Kubernetes Service (AKS) is a robust platform for managing containerized applications in production.

**Key Points:**
- **Cluster Autoscaler**: Configure AKS to automatically scale the number of nodes based on resource demands.
- **Horizontal Pod Autoscaler**: Set up the Horizontal Pod Autoscaler to scale the number of pods based on CPU utilization or other metrics.
- **Rolling Updates**: Use rolling updates to deploy changes without downtime.
- **Monitoring and Logging**: Integrate with Azure Monitor and Azure Log Analytics to monitor and log application performance and issues.
- **Documentation**: [Azure Kubernetes Service (AKS) Documentation](https://learn.microsoft.com/en-us/azure/aks/)

### **Discovery System**
Implementing a discovery system can automatically detect how many nodes (Blender servers) are available. This can help dynamically adjust the load distribution and optimize resource utilization.

**Key Points:**
- **Service Discovery**: Use tools like Consul, etcd, or Kubernetes built-in service discovery to detect available nodes.
- **AKS Integration**: When using AKS, service discovery is automatically handled by Kubernetes, which maintains an updated list of available pods.
- **Documentation**: [Kubernetes Service Discovery](https://kubernetes.io/docs/concepts/services-networking/service/#discovering-services)

### **Using Queues Instead of Direct HTTP Calls**
Consider using message queues to decouple the orchestrator from the Blender servers. Queues can improve reliability and scalability by buffering requests and ensuring they are processed even if some servers are temporarily unavailable.

**Key Points:**
- **Message Queues**: Use systems like RabbitMQ, Kafka, or Azure Service Bus to manage job requests.
- **Decoupling**: Queues help decouple the orchestrator from the Blender servers, enabling asynchronous processing.
- **Retry Mechanism**: Queues can automatically retry failed jobs, improving reliability.
- **Documentation**: [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html), [Apache Kafka Documentation](https://kafka.apache.org/documentation/), [Azure Service Bus Documentation](https://docs.microsoft.com/en-us/azure/service-bus/)

### **Logging Improvements for Traceability**
Implement comprehensive logging to ensure traceability of the entire process. Logs should capture key events, errors, and performance metrics to help monitor and debug the system.

**Key Points:**
- **Structured Logging**: Use structured logging to capture detailed information about each event.
- **Centralized Logging**: Aggregate logs in a centralized system like Elasticsearch, Logstash, and Kibana (ELK stack) or Azure Monitor.
- **Tracing**: Implement distributed tracing to follow the flow of requests across services and identify performance bottlenecks.
- **Documentation**: [ELK Stack Documentation](https://www.elastic.co/what-is/elk-stack), [Azure Monitor Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/)

### **Other Potential Improvements**

1. **Load Balancing**
   - **Description**: Implement load balancing to distribute incoming requests evenly across multiple Blender server instances.
   - **Documentation**: [Kubernetes Services and Load Balancing](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)

2. **Fault Tolerance and High Availability**
   - **Description**: Ensure high availability by deploying multiple replicas of the Blender server and orchestrator, and configuring Kubernetes to handle pod failures and restarts.
   - **Documentation**: [Kubernetes High Availability](https://kubernetes.io/docs/concepts/cluster-administration/high-availability/)

3. **Security Enhancements**
   - **Description**: Implement security best practices, such as network policies, role-based access control (RBAC), and secret management to protect sensitive data.
   - **Documentation**: [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/overview/)

4. **Performance Optimization**
   - **Description**: Optimize the performance of the Blender server and orchestrator by tuning resource limits and requests, and profiling the application to identify bottlenecks.
   - **Documentation**: [Kubernetes Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)

### **Conclusion**
By implementing these enhancements and improvements, you can optimize the Blender server and orchestrator setup for better performance, scalability, reliability, and security in production environments. These suggestions provide a roadmap for future development and deployment strategies.