# How to Build Your First Distributed System

> **A practical tutorial on building a distributed Blender rendering system with Node.js, Docker, and Docker Compose**

[![Deploy Docs](https://github.com/khnumdev/dist-app-tutorial/actions/workflows/deploy-docs.yml/badge.svg)](https://github.com/khnumdev/dist-app-tutorial/actions/workflows/deploy-docs.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

![Distributed Rendering System](img/image.png)

> **Note:** This is a tutorial to start building an example of a distributed system and is not intended for a production deployment.

## 🚀 [Start Tutorial →](https://khnumdev.github.io/dist-app-tutorial/)

## 📚 What You'll Learn

This hands-on tutorial teaches you how to build a **distributed Blender rendering system** from scratch. You'll learn:

- **RESTful API Development** with Node.js and Express
- **Process Management** for long-running background tasks
- **Distributed Orchestration** to split workloads across multiple nodes
- **Containerization** with Docker
- **Multi-container Deployment** with Docker Compose
- **Production Patterns** like rate limiting, service discovery, and monitoring

By the end, you'll have a working distributed system that can render Blender animations in parallel across multiple servers!

## 🏗️ Repository Structure

```
dist-app-tutorial/
├── docs/                          # Tutorial documentation (GitHub Pages)
│   ├── index.md                   # Landing page
│   ├── 00-setup.md                # Environment setup
│   ├── 01-rendering-node.md       # Part 1: Rendering Node
│   ├── 02-orchestrator.md         # Part 2: Orchestrator
│   ├── 03-docker.md               # Part 3: Docker
│   ├── 04-docker-compose.md       # Part 4: Docker Compose
│   ├── 05-enhancements.md         # Future improvements
│   └── _config.yml                # Jekyll configuration
│
├── examples/                      # Working code for each part
│   ├── part1-rendering-node/      # Express server with job management
│   ├── part2-orchestrator/        # Work distribution system
│   ├── part3-docker/              # Dockerfiles for containerization
│   └── part4-docker-compose/      # Complete Docker Compose setup
│
├── img/                           # Images and assets
├── .github/workflows/             # GitHub Actions for auto-deployment
├── CONTRIBUTING.md                # Contribution guidelines
├── CODE_OF_CONDUCT.md             # Code of conduct
└── README.md                      # This file
```

## 🎯 Tutorial Overview

### [Part 0: Setup](https://khnumdev.github.io/dist-app-tutorial/00-setup.html)
Install Node.js, Blender, and prepare your development environment.

### [Part 1: Rendering Node](https://khnumdev.github.io/dist-app-tutorial/01-rendering-node.html)
Build a web API that accepts Blender rendering jobs and manages background processes.

**Key Concepts:**
- Express.js server setup
- HTTP status codes (202 Accepted, 200 OK)
- Process management with child_process
- Polling patterns

### [Part 2: Orchestrator](https://khnumdev.github.io/dist-app-tutorial/02-orchestrator.html)
Create an orchestrator to distribute rendering workloads across multiple nodes.

**Key Concepts:**
- Work distribution and batching
- Parallel execution with Promise.all()
- Round-robin scheduling
- Status aggregation

### [Part 3: Docker](https://khnumdev.github.io/dist-app-tutorial/03-docker.html)
Containerize the rendering node and orchestrator for consistent deployment.

**Key Concepts:**
- Writing Dockerfiles
- Docker networking
- Volume mounts
- Container orchestration

### [Part 4: Docker Compose](https://khnumdev.github.io/dist-app-tutorial/04-docker-compose.html)
Deploy the entire distributed system with a single command.

**Key Concepts:**
- Multi-container applications
- Service dependencies
- Scaling services
- Production-ready deployment

### [Part 5: Enhancements](https://khnumdev.github.io/dist-app-tutorial/05-enhancements.html)
Explore production-ready improvements and advanced patterns.

**Topics:**
- Rate limiting (429 Too Many Requests)
- Message queues (RabbitMQ, Kafka)
- Service discovery
- Kubernetes deployment (AKS)
- Monitoring and logging
- Security best practices

## 🚦 Quick Start

### Option 1: Follow the Tutorial

Visit the [full tutorial](https://khnumdev.github.io/dist-app-tutorial/) for step-by-step instructions.

### Option 2: Run the Examples

Each `examples/` folder contains complete, working code:

```bash
# Part 1: Single rendering node
cd examples/part1-rendering-node
npm install
npm start

# Part 4: Complete system with Docker Compose
cd examples/part4-docker-compose
docker-compose up --build
```

See individual README files in each example folder for detailed instructions.

## 📋 Prerequisites

- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **Blender** ([Download](https://www.blender.org/download/))
- **Docker** (for Parts 3-4) ([Get Docker](https://docs.docker.com/get-docker/))
- Basic knowledge of:
  - JavaScript/Node.js
  - REST APIs
  - Command line

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Bug fixes
- 📝 Documentation improvements
- ✨ New features or examples
- 💡 Suggestions for enhancements

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📖 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Docker Documentation](https://docs.docker.com/)
- [Blender Command Line](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)
- [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/)

## 📜 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Blender Foundation for the amazing open-source 3D software
- The Node.js and Express.js communities
- All contributors to this tutorial

## 💬 Support

- **Documentation Issues:** [Open an issue](https://github.com/khnumdev/dist-app-tutorial/issues)
- **Questions:** Start a [discussion](https://github.com/khnumdev/dist-app-tutorial/discussions)
- **Tutorial Website:** [khnumdev.github.io/dist-app-tutorial](https://khnumdev.github.io/dist-app-tutorial/)

---

**Ready to get started?** 👉 [Begin the tutorial](https://khnumdev.github.io/dist-app-tutorial/)

**Star this repo** ⭐ if you find it helpful!
