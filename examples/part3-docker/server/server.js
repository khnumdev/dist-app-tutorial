const { exec, spawnSync } = require('child_process');
const express = require('express');
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;
const jobs = {}; // Store job processes by their PIDs

// Configuration - Update these paths for your system
const blenderPath = process.env.BLENDER_PATH || '/usr/bin/blender';
const blendFilePath = process.env.BLEND_FILE_PATH || '/app/blend/files/splash-pokedstudio.blend';
const outputDir = process.env.OUTPUT_DIR || '/app/output';

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

    // Calculate a suggested retry-after time (e.g., 5 seconds)
    const retryAfter = 5; // seconds

    res.status(202)
        .header('Location', `/job/${pid}`)
        .header('Retry-After', retryAfter)
        .send({ pid });
});

// GET /job/:jobId endpoint with headers
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
