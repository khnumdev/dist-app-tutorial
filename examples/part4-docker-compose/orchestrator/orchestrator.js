const express = require('express');
const axios = require('axios'); // For making HTTP requests to the nodes
const app = express();

app.use(express.json());

const port = process.env.PORT || 4000;
const NODES = process.env.NODES 
    ? process.env.NODES.split(',')
    : [
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
    ]; // List of node endpoints
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 5;
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
            res.status(202)
                .header('Location', `/status/${jobId}`)
                .header('Retry-After', 5)
                .send('Job still running');
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
    try {
        const response = await axios.get(`${nodeUrl}/job/${pid}`);
        return response.status === 200 ? 'completed' : 'running';
    } catch (error) {
        console.error(`Error checking status for ${nodeUrl}/job/${pid}:`, error.message);
        return 'error';
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Start the orchestrator server
app.listen(port, () => {
    console.log(`Orchestrator running on port ${port}`);
    console.log(`Managing ${NODES.length} rendering nodes with batch size ${BATCH_SIZE}`);
});
