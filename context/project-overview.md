# The Signal

## Overview

**The Signal** is an automated information refinery system designed to strip away emotional bias and hyperbolic language from news and articles. By transforming raw financial reports (initially from Yahoo Finance) into structured, fact-based "Signal Cards," it serves as a noise-filtering terminal for users who need to grasp the objective truth and raw data of a situation in under 15 seconds.

## Goals

1. Information De-noising: Effectively eliminate clickbait, repetitive phrasing, and emotional adjectives from news content.
2. Objective Summary: Restore the core facts and data of an event using AI-driven structural extraction.
3. High-Speed Consumption: Enable users to process and understand the implications of a major news event within half a minute.
4. Actionable Intelligence: Provide clear, emotion-free trend analysis that focuses on factual impact rather than market hype.

## Core User Flow

1. Authentication: User signs in using Google or GitHub (via Supabase Auth).
2. Discovery & Exploration: Users browse the "Global Fact Stream" filtered by pre-defined categories (e.g., Tech, Economic).
3. Search & Track: Users use the **Semantic Command Palette** to search for specific entities (e.g., "NVIDIA"). From the search results or Signal Cards, users can directly "Follow" AI-generated tags to build their personalized tracking list.
4. Fact Scanning: Users scan structured Signal Cards in their personalized feed, focusing on core facts and data points without emotional guidance.
5. Context-Preserving Deep Dive: User taps a card to open a bottom-sheet (Mobile) or side-pane (Desktop) to read the full de-noised content and AI analysis.
6. Retention: User receives a daily "Morning Pulse" email summarizing the most significant objective shifts in their tracked categories.

## Features

### Intelligence Refinery (AI Pipeline)

- Sentiment Stripping: AI-powered removal of sensationalist, biased, and hyperbolic language.
- Structural Extraction: Automatic identification of key figures, dates, and named entities.
- Bilingual Fact-Mapping: Preservation of original English factual data alongside its objective Traditional Chinese translation for data integrity.
- Impact Analysis: Fact-based logical deduction of potential consequences based on objective data.

### The Signal Feed (UI/UX)

- Objective Truth Interface: A minimalist UI using OKLCH colors, strictly excluding emotional indicators like Bullish/Bearish.
- Scan-First Cards: Signal Cards designed for data density, featuring inline AI-generated entity tags for secondary navigation.
- Master-Detail Layout: A seamless desktop experience that updates details in the "Intelligence Pane" instantly.
- Unified Command Palette: A central interface for both searching facts and managing personalized tracking tags.

## Scope

### In Scope

- Automated scraping and processing of Yahoo Finance news feeds.
- AI Pipeline for de-noising, translation, and structured summarization.
- Nuxt 4-based full-stack web application with a focus on Mobile-first responsive design.
- Supabase integration for Auth, PostgreSQL storage, and Image hosting.
- Daily automated email digests via Resend.

### Out of Scope

- Real-time stock price charts or live trading capabilities.
- Social features (comments, likes, markets moods).
- Manual article creation or community-generated content.
- Sentiment indicators (Red/Green/Yellow market moods).
- Coverage of non-financial news categories (e.g., celebrity gossip, sports).

## Success Criteria

1. A signed-in user can follow/unfollow an AI-generated entity (e.g., $NVDA), and see their personalized feed update in the next session.
2. The AI successfully reduces raw article word counts by at least 50% while retaining all critical objective data.
3. User can understand the core signal of the article in 15 seconds.
4. AI Analysis must be based on facts and macro trends, and strictly prohibit false fantasies or emotional.
5. Users can toggle between categories and have the feed update instantly without full page refreshes.
6. A user can subscribe to a daily digest email with the most significant objective shifts in their tracked categories.
