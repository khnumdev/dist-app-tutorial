---
title: "Setting Up the Environment"
---

# Setting Up the Environment

Before we begin building our distributed rendering system, let's set up the necessary tools and dependencies.

<div class="learning-objectives">
<strong>📋 Prerequisites</strong>
<ul>
<li>Node.js and NPM for running JavaScript servers</li>
<li>Blender for rendering tasks</li>
<li>A terminal/command line interface</li>
<li>Basic familiarity with command line operations</li>
</ul>
</div>

## Install Node.js

First, make sure you have Node.js and NPM installed. You can download it from [nodejs.org](https://nodejs.org/).

**Verify installation:**
```bash
node --version
npm --version
```

You should see version numbers for both commands. This tutorial works with Node.js v14 or higher.

## Install Blender

Ensure Blender is installed on your system and accessible via the command line. You can download Blender from [blender.org](https://www.blender.org/download/).

**Verify installation:**
```bash
blender --version
```

You should see Blender version information printed to the console.

### Download Sample Blend File

For this tutorial, we'll use the **Racing Car** sample from Blender:

🔗 [Download Racing Car Sample](https://www.blender.org/download/demo/test/splash-pokedstudio.blend.zip)

After downloading:
1. Extract the `.blend` file
2. Note the path to this file - you'll need it in Part 1

> **Note about Blender Performance:** Blender rendering is resource-intensive. This tutorial suggests rendering up to 5 frames or running multiple render processes in parallel. If your computer struggles with these workloads, reduce the frame count to a value that works for your system.

## Create Working Directory

Set up a folder structure for the tutorial:

```bash
mkdir distributed-system-tutorial
cd distributed-system-tutorial
```

All code examples and files will be created within this directory.

## Platform Support

This tutorial has been tested on **macOS and Linux**. 

**Windows Users:** When working with file paths, ensure you:
- Use proper path separators (`\` or escaped `\\`)
- Handle spaces in paths correctly (use quotes)
- Adjust Blender installation paths as needed

Common Windows Blender path: `C:\Program Files\Blender Foundation\Blender\blender.exe`

## Verify Your Setup

Before proceeding, verify you have:

- ✅ Node.js installed (v14+)
- ✅ NPM installed
- ✅ Blender installed and accessible from command line
- ✅ Sample `.blend` file downloaded
- ✅ Working directory created

## What's Next?

Now that your environment is ready, let's build the first component: a rendering node that accepts Blender jobs via HTTP API.

---

<div class="nav-links">
  <a href="index.html">← Back to Overview</a>
  <a href="01-rendering-node.html">Part 1: Rendering Node →</a>
</div>

---

**Having issues?** [Open an issue on GitHub](https://github.com/khnumdev/dist-app-tutorial/issues)
