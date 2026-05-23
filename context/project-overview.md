# The Signal

## Overview

**The Signal** is an automated information refinery system designed to strip away emotional bias and hyperbolic language from news and articles. By transforming raw news reports (from Yahoo News — Tech, World, Science) into structured, fact-based "Signal Cards," it serves as a noise-filtering terminal for users who need to grasp the objective truth and raw data of a situation in under 15 seconds.

## Goals

1. Information De-noising: Effectively eliminate clickbait, repetitive phrasing, and emotional adjectives from news content.
2. Objective Summary: Restore the core facts and data of an event using AI-driven structural extraction.
3. High-Speed Consumption: Enable users to process and understand the implications of a major news event within half a minute.
4. Actionable Intelligence: Provide clear, emotion-free trend analysis that focuses on factual impact rather than market hype.

## Core User Flow

1. Authentication: User signs in using Google or GitHub (via Supabase Auth).
2. Discovery & Exploration: Users browse the Global Signal Feed. The default view shows all categories. Users can filter by a pre-defined category (Tech, World, Science) via the Category Filter Rail.
3. Search: Users use the **Semantic Command Palette** to search for specific entities or topics (e.g., "NVIDIA").
4. Fact Scanning: Users scan structured Signal Cards in the feed, focusing on core facts and data points without emotional guidance.
5. Context-Preserving Deep Dive: User taps a card to open a bottom drawer (Mobile) or right-side pane (Desktop) to read the full de-noised content and AI analysis.

## Features

### Intelligence Refinery (AI Pipeline)

- Sentiment Stripping: AI-powered removal of sensationalist, biased, and hyperbolic language.
- Structural Extraction: Automatic identification of key figures, dates, and named entities.
- Bilingual Fact-Mapping: Ingestion of original English sources translated to Traditional Chinese via LLM. Both language variants are stored in PostgreSQL for data integrity, while the UI strictly renders the Traditional Chinese content.
- Impact Analysis: Fact-based logical deduction of potential consequences based on objective data.

### The Signal Feed (UI/UX)

- Objective Truth Interface: A minimalist UI using OKLCH colors, strictly excluding emotional indicators.
- Scan-First Cards: Signal Cards designed for comfortable reading, featuring AI-generated entity tags and a 3-point structured summary.
- Two-Column Card Stream: A stable, rhythm-based two-column grid on desktop (single column on mobile) for effortless vertical scanning.
- Master-Detail Layout: A seamless desktop experience that loads the full article in the Right-side Pane without leaving the feed.
- Unified Command Palette: A central interface for searching facts and entities across all signals.

## Scope

### In Scope

- Automated scraping and processing of Yahoo News feeds (Tech, World, Science categories).
- AI Pipeline for de-noising, translation, and structured summarization.
- Nuxt 4-based full-stack web application with a focus on Mobile-first responsive design.
- Supabase integration for Auth, PostgreSQL storage, and image hosting.
- Automatic purging of signals older than 3 months to maintain database hygiene.

### Out of Scope

- Real-time stock price charts or live trading capabilities.
- Social features (comments, likes, market moods).
- Manual article creation or community-generated content.
- Sentiment indicators (Red/Green/Yellow market moods).
- User-specific features: tag following, saved/bookmarked signals, personalised feeds, email digests.

## Success Criteria

1. User can browse and filter the Signal Feed by category without a full page refresh.
2. The AI successfully reduces raw article word counts by at least 50% while retaining all critical objective data.
3. User can understand the core signal of an article within 15 seconds.
4. AI output must be strictly factual — no fabricated data, no emotional language.
5. Signals older than 3 months are automatically purged from the database.