
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

## **Step 2: Creating the API**

### **1. Initialize the NodeJS Project**
Set up a new NodeJS project and install the necessary dependencies:

```bash
mkdir blender-job-api
cd blender-job-api
npm init -y
npm install express
```

### **2. Create the Server**
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

## **Step 3: Implementing the Endpoints**

### **1. Constants for Blender Paths**
Define constants for `blenderPath`, `blendFilePath`, and `outputDir`:

```javascript
const blenderPath = '{PUT HERE THE BLENDER PATH}'; // Populate with actual Blender path
const blendFilePath = '{PUT HERE THE BLEND FILE PATH}'; // Populate with actual blend file path
const outputDir = '{PUT HERE THE OUTPUT DIR}'; // Populate with desired output directory
```

### **2. `/job` POST Endpoint with Headers**
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

    const command = `${blenderPath} -b ${blendFilePath} -o ${outputDir}\\blender-render_#### -E \"CYCLES\" -s ${from} -e ${to} -t 0 -a`;
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

### **3. `/job/:jobId` GET Endpoint with Headers**
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

### **4. Handling Multiple Concurrent Jobs**
The API is designed to handle multiple jobs concurrently by storing PIDs in memory and allowing multiple requests simultaneously. For this tutorial, the configuration is left as is, but it should be defined based on the machines where this will be executed.

### **5. Blender Command Explanation**
The Blender command used in the API is structured as follows:

```javascript
const command = `${blenderPath} -b ${blendFilePath} -o ${outputDir}\\blender-render_#### -E \"CYCLES\" -s ${from} -e ${to} -t 0 -a`;
```

- **`-b`**: Runs Blender in background (no GUI).
- **`${blendFilePath}`**: Path to the Blender file to be rendered.
- **`-o ${outputDir}\\blender-render_####`**: Specifies the output directory and file pattern.
- **`-E "CYCLES"`**: Sets the rendering engine to Cycles.
- **`-s ${from}`**: Start frame.
- **`-e ${to}`**: End frame.
- **`-t 0`**: Use all available threads.
- **`-a`**: Render animation.

For more details on Blender command-line arguments, refer to the [Blender documentation](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html).

## **Step 4: Managing Processes**

### **Killing a Process from the Terminal**
To kill a Blender process manually, use the `kill` command followed by the process ID:

```bash
kill {processId}
```
Replace `{processId}` with the actual PID of the Blender process you want to terminate.

## **Step 5: Understanding Response Codes and Headers**

### **Why Use Status Code 202, 200, and Headers?**

- **202 Accepted**: This status code indicates that the request has been accepted for processing, but the processing is not yet complete. According to [RFC 7231, Section 6.3.3](https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.3), it allows the server to provide information about when the client should check back for the status.

- **200 OK**: This status code indicates that the request was successful and the processing is complete. According to [RFC 7231, Section 6.3.1](https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.1), it is the standard response for successful HTTP requests.

- **Headers**:
  - **Location**: Indicates the URL to check the status of the job.
  - **Retry-After**: Suggests how long (in seconds) the client should wait before retrying the request to check the job status.

### **Polling and Its Intention**
Polling is a technique where the client repeatedly requests the status of a job at regular intervals until the job is complete. This is useful when the client needs to know the result of a long-running process without holding the connection open.

The `Retry-After` header guides the client on when to make the next request, balancing the load on the server and ensuring timely updates to the client.

## **Conclusion**
In this tutorial, we've created a web app to submit and monitor Blender rendering jobs. We set up a NodeJS and Express API with endpoints for job submission and status checking. We've also included instructions on how to manage Blender processes manually and explained the use of HTTP status codes and headers.