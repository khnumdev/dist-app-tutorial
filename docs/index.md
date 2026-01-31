---
title: "Building Distributed Systems"
---

# How to Build Your First Distributed System

> **Note:** This is a tutorial to start building an example of a distributed system and is not intended for a production deployment.

![Distributed Rendering System]({{ site.baseurl }}/img/image.png)

<div class="learning-objectives">
<strong>🎯 What You'll Learn</strong>
<ul>
<li>Build a RESTful API with Node.js and Express</li>
<li>Manage long-running background processes</li>
<li>Orchestrate distributed workloads across multiple nodes</li>
<li>Containerize applications with Docker</li>
<li>Deploy multi-container applications with Docker Compose</li>
<li>Understand distributed systems concepts like polling, batching, and orchestration</li>
</ul>
</div>

## Overview

In this hands-on tutorial, we'll build a **distributed Blender rendering system** from scratch. You'll learn how to split a rendering workload across multiple nodes, manage concurrent jobs, and deploy the system using Docker.

By the end of this tutorial, you'll have:
- A **rendering node** that accepts Blender jobs via HTTP API
- An **orchestrator** that distributes work across multiple nodes
- A **fully containerized** deployment using Docker Compose
- Understanding of key distributed systems patterns

## Tutorial Structure

### [0. Setting Up the Environment](00-setup.md)
Install prerequisites and prepare your development environment.

### [1. Part 1: Rendering Node](01-rendering-node.md)
Create a web API that accepts Blender rendering jobs and manages background processes.

**You'll build:**
- Express.js server with RESTful endpoints
- Job submission and status checking
- Process management for Blender renders

### [2. Part 2: Orchestrator](02-orchestrator.md)
Build an orchestrator that distributes rendering workloads across multiple nodes.

**You'll learn:**
- Work distribution and batching
- Parallel job execution with Promise.all()
- Aggregating status from multiple nodes

### [3. Part 3: Docker](03-docker.md)
Containerize the rendering node and orchestrator for consistent deployment.

**You'll create:**
- Dockerfiles for server and orchestrator
- Docker networks for inter-container communication
- Container deployment strategies

### [4. Part 4: Docker Compose](04-docker-compose.md)
Deploy the entire distributed system with a single command.

**You'll configure:**
- Multi-container orchestration
- Service scaling (3 rendering nodes)
- Network isolation and service discovery

### [5. Enhancements and Future Improvements](05-enhancements.md)
Explore production-ready improvements and advanced patterns.

**Topics include:**
- Rate limiting and queue management
- Service discovery
- Production deployment strategies (Kubernetes)
- Monitoring and logging

## Architecture Overview

```mermaid
graph TB
    Client[Client Application]
    Orch[Orchestrator<br/>Port 4000]
    Server1[Blender Server 1<br/>Port 3001]
    Server2[Blender Server 2<br/>Port 3002]
    Server3[Blender Server 3<br/>Port 3003]
    
    Client -->|POST /render<br/>frames 1-20| Orch
    Orch -->|Batch 1: frames 1-5| Server1
    Orch -->|Batch 2: frames 6-10| Server2
    Orch -->|Batch 3: frames 11-15| Server3
    
    Server1 -.->|Status| Orch
    Server2 -.->|Status| Orch
    Server3 -.->|Status| Orch
    
    Orch -.->|Aggregated Status| Client
    
    style Client fill:#e1f5ff
    style Orch fill:#fff4e1
    style Server1 fill:#e8f5e9
    style Server2 fill:#e8f5e9
    style Server3 fill:#e8f5e9
```

## Prerequisites

- **Node.js** (v14 or higher)
- **Blender** (accessible via command line)
- **Docker** (for Parts 3 and 4)
- Basic knowledge of JavaScript and REST APIs

## Getting Started

Ready to begin? Start with [Setting Up the Environment →](00-setup.md)

---

<div class="nav-links">
  <a href="00-setup.md">Start Tutorial →</a>
</div>

---

**Having issues?** [Open an issue on GitHub](https://github.com/khnumdev/dist-app-tutorial/issues)
