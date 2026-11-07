# AI Lecture Intelligence

A Chrome extension for extracting and analysing university lecture transcripts, with a focus on making recorded lectures easier to navigate, review and study.

## Project Overview

AI Lecture Intelligence is an ongoing software development project designed to transform lecture transcripts into useful, structured study material.

The initial version focuses on extracting timestamped captions from Panopto lecture recordings, including Hebrew-language lectures.

## Current Features

- Extract timestamped lecture captions from Panopto.
- Support Hebrew-language transcripts.
- Clean and organise extracted caption lines.
- Export transcripts as UTF-8 text files.

## Technology Stack

- JavaScript
- HTML
- Chrome Extensions (Manifest V3)
- Chrome Scripting API
- Git and GitHub

## Installation

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the `extension` folder.
6. Open a supported Panopto lecture with captions available.
7. Click the extension's extraction button.

## Development Roadmap

- [x] Build the initial Chrome extension.
- [x] Extract timestamped Hebrew transcripts.
- [x] Export transcripts to text files.
- [ ] Complete and validate important-moment detection.
- [ ] Develop a Python/FastAPI backend.
- [ ] Integrate an AI model for lecture analysis.
- [ ] Generate summaries and study notes.
- [ ] Explore retrieval-augmented generation (RAG) for lecture questions.

## Known Limitations

- Important-moment detection is implemented experimentally but is not yet producing reliable results.
- Transcript extraction depends on the Panopto page structure and the availability of captions.
- AI-powered analysis has not yet been implemented.

## Project Status

**In active development — initial transcript extraction prototype.**

The long-term goal is to build a practical AI-assisted learning tool that combines browser automation, backend development and natural-language processing.