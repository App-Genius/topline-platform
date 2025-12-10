# Topline Documentation Index

## Overview

This documentation suite provides comprehensive specifications for the Topline system - a behavior-driven business optimization platform built on the 4DX framework.

**Core Philosophy:** Topline is an **industry-agnostic** behavior-to-outcome system. It connects daily team member behaviors (lead measures) to business outcomes (lag measures) across ANY business type - restaurants, hotels, accounting firms, landscapers, dental practices, and more. The AI generates appropriate scaffolding for each industry while the core engine remains the same.

---

## Document Structure

### Foundation Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| [01-PRODUCT-VISION.md](./01-PRODUCT-VISION.md) | Core concepts, 4DX framework, business model | Everyone |
| [02-USER-PERSONAS.md](./02-USER-PERSONAS.md) | Detailed user types, day-in-the-life scenarios | Product, Design |
| [03-USER-FLOWS.md](./03-USER-FLOWS.md) | Every screen, interaction, and flow | Design, Frontend |

### Technical Specifications

| Document | Purpose | Audience |
|----------|---------|----------|
| [04-SYSTEM-ARCHITECTURE.md](./04-SYSTEM-ARCHITECTURE.md) | High-level architecture, tech stack, deployment | Engineering |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | Complete data model, relationships, indexes | Backend |
| [06-API-SPECIFICATION.md](./06-API-SPECIFICATION.md) | All endpoints, request/response formats | Backend, Frontend |
| [07-FRONTEND-ARCHITECTURE.md](./07-FRONTEND-ARCHITECTURE.md) | Components, state management, patterns | Frontend |

### Core Engine Specifications

| Document | Purpose | Audience |
|----------|---------|----------|
| [08-CALCULATION-ENGINE.md](./08-CALCULATION-ENGINE.md) | All formulas, algorithms, business logic | Backend |
| [09-AI-OPERATIONS.md](./09-AI-OPERATIONS.md) | AI integration, prompts, structured outputs | Backend, AI |
| [10-CORRELATION-ANALYSIS.md](./10-CORRELATION-ANALYSIS.md) | Statistical methods, fraud detection | Backend, AI |
| [11-REPORTING-ENGINE.md](./11-REPORTING-ENGINE.md) | Report generation, insights, exports | Backend |

### Implementation Guides

| Document | Purpose | Audience |
|----------|---------|----------|
| [12-IMPLEMENTATION-ROADMAP.md](./12-IMPLEMENTATION-ROADMAP.md) | Phased build plan, milestones | Engineering, Product |
| [13-TESTING-STRATEGY.md](./13-TESTING-STRATEGY.md) | Test plans, scenarios, automation | QA, Engineering |
| [14-SECURITY-COMPLIANCE.md](./14-SECURITY-COMPLIANCE.md) | Auth, authorization, data protection | Engineering, Security |

### Operational & Infrastructure Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| [15-ANALYTICS-LAYER.md](./15-ANALYTICS-LAYER.md) | Event tracking, analytics abstraction | Engineering, Product |
| [16-INTEGRATION-PHILOSOPHY.md](./16-INTEGRATION-PHILOSOPHY.md) | Data ingestion strategy, integration patterns | Engineering |
| [17-BEHAVIOR-TEMPLATES.md](./17-BEHAVIOR-TEMPLATES.md) | Role-specific behavior libraries, AI scaffolding | Product, Support |
| [18-PRODUCTION-CONCERNS.md](./18-PRODUCTION-CONCERNS.md) | Deferred items for production (rate limiting, caching, monitoring) | Engineering |
| [19-TRAINING-SYSTEM.md](./19-TRAINING-SYSTEM.md) | Guided walkthrough training system architecture | Engineering, Product |

---

## Document Status

| Document | Status | Last Updated | Recent Changes |
|----------|--------|--------------|----------------|
| 01-PRODUCT-VISION.md | ✅ Complete | Dec 2024 | Added core principles, industry-agnostic philosophy, AI scaffolding |
| 02-USER-PERSONAS.md | ✅ Complete | Dec 2024 | - |
| 03-USER-FLOWS.md | ✅ Complete | Dec 2024 | - |
| 04-SYSTEM-ARCHITECTURE.md | ✅ Complete | Dec 2024 | Added analytics abstraction layer (swappable MixPanel) |
| 05-DATABASE-SCHEMA.md | ✅ Complete | Dec 2024 | - |
| 06-API-SPECIFICATION.md | ✅ Complete | Dec 2024 | - |
| 07-FRONTEND-ARCHITECTURE.md | ✅ Complete | Dec 2024 | - |
| 08-CALCULATION-ENGINE.md | ✅ Complete | Dec 2024 | - |
| 09-AI-OPERATIONS.md | ✅ Complete | Dec 2024 | Added DSPy-style prompts, self-reflection, LLM-as-judge, token tracking, self-improvement loop |
| 10-CORRELATION-ANALYSIS.md | ✅ Complete | Dec 2024 | - |
| 11-REPORTING-ENGINE.md | ✅ Complete | Dec 2024 | - |
| 12-IMPLEMENTATION-ROADMAP.md | ✅ Complete | Dec 2024 | - |
| 13-TESTING-STRATEGY.md | ✅ Complete | Dec 2024 | **Major rewrite**: HTTP-first approach, multi-role scenario tests, test data generators, helper classes, 4-tier testing pyramid, agentic workflow loop |
| 14-SECURITY-COMPLIANCE.md | ✅ Complete | Dec 2024 | - |
| 15-ANALYTICS-LAYER.md | ✅ NEW | Dec 2024 | Event taxonomy, naming conventions, provider abstraction |
| 16-INTEGRATION-PHILOSOPHY.md | ✅ NEW | Dec 2024 | Data ingestion patterns, integration anti-patterns |
| 17-BEHAVIOR-TEMPLATES.md | ✅ Complete | Dec 2024 | Added AI-driven scaffolding generation for any industry |
| 18-PRODUCTION-CONCERNS.md | ✅ Complete | Dec 2024 | - |
| 19-TRAINING-SYSTEM.md | ✅ NEW | Dec 2024 | Guided walkthrough architecture, flow-documenter agent, multi-role training |

---

## Key Architectural Decisions

### Core System Principles

| Principle | Description | Reference |
|-----------|-------------|-----------|
| **Lag/Lead Focus** | System exists to connect behaviors to KPIs. Nothing else. | [01-PRODUCT-VISION](./01-PRODUCT-VISION.md#core-system-principles) |
| **Industry Agnostic** | AI generates scaffolding for any business type | [01-PRODUCT-VISION](./01-PRODUCT-VISION.md#appendix-c-ai-driven-industry-scaffolding) |
| **Integrations Ingest Only** | Integrations pull data in; never add features | [16-INTEGRATION-PHILOSOPHY](./16-INTEGRATION-PHILOSOPHY.md#1-core-principles) |
| **Hide Complexity** | Simple UX powered by sophisticated backend | [01-PRODUCT-VISION](./01-PRODUCT-VISION.md#core-system-principles) |

### AI Architecture

| Feature | Description | Reference |
|---------|-------------|-----------|
| **DSPy-Style Prompts** | Declarative signatures, modular design | [09-AI-OPERATIONS](./09-AI-OPERATIONS.md#13-dspy-style-prompt-engineering) |
| **Self-Reflection** | AI auto-corrects on validation failures | [09-AI-OPERATIONS](./09-AI-OPERATIONS.md#14-self-reflection--quality-assurance) |
| **LLM-as-Judge** | Second LLM evaluates output quality | [09-AI-OPERATIONS](./09-AI-OPERATIONS.md#141-llm-as-judge-pattern) |
| **Token Tracking** | Cost monitoring and budget limits | [09-AI-OPERATIONS](./09-AI-OPERATIONS.md#15-token-tracking--cost-management) |
| **Self-Improvement** | System learns from feedback | [09-AI-OPERATIONS](./09-AI-OPERATIONS.md#16-ai-self-improvement-loop) |

### Testing Architecture

| Feature | Description | Reference |
|---------|-------------|-----------|
| **HTTP-First** | Test through API endpoints with real test DB | [13-TESTING-STRATEGY](./13-TESTING-STRATEGY.md#4-tier-2-http-scenario-tests) |
| **Multi-Role Scenarios** | Test complete workflows across staff/manager/admin | [13-TESTING-STRATEGY](./13-TESTING-STRATEGY.md#8-multi-role-test-helpers) |
| **Test Data Generators** | Generate realistic data with constraints | [13-TESTING-STRATEGY](./13-TESTING-STRATEGY.md#7-test-data-generators) |
| **AI Testing** | Schema validation, quality assertions, real LLM tests | [13-TESTING-STRATEGY](./13-TESTING-STRATEGY.md#12-ai-operations-testing) |
| **Agentic Workflow** | Build-Test-Review-Fix development loop | [13-TESTING-STRATEGY](./13-TESTING-STRATEGY.md#11-agentic-development-workflow) |

### Analytics & Observability

| Feature | Description | Reference |
|---------|-------------|-----------|
| **Provider Agnostic** | Swap MixPanel/PostHog without code changes | [15-ANALYTICS-LAYER](./15-ANALYTICS-LAYER.md#6-provider-abstraction) |
| **Event Taxonomy** | Strict naming conventions | [15-ANALYTICS-LAYER](./15-ANALYTICS-LAYER.md#2-event-taxonomy) |
| **Server Analytics** | AI operation tracking | [04-SYSTEM-ARCHITECTURE](./04-SYSTEM-ARCHITECTURE.md#144-analytics-abstraction-layer) |

---

## How to Use This Documentation

### For Product Development
1. Start with **01-PRODUCT-VISION** to understand the core concepts
2. Review **02-USER-PERSONAS** and **03-USER-FLOWS** for user experience
3. Reference **12-IMPLEMENTATION-ROADMAP** for build sequence

### For Engineering
1. **04-SYSTEM-ARCHITECTURE** for high-level design
2. **05-DATABASE-SCHEMA** and **06-API-SPECIFICATION** for backend
3. **07-FRONTEND-ARCHITECTURE** for frontend patterns
4. **08-CALCULATION-ENGINE** and **09-AI-OPERATIONS** for business logic

### For Sales & Support
1. **01-PRODUCT-VISION** for value proposition
2. **15-ONBOARDING-PLAYBOOK** for customer setup
3. **17-BEHAVIOR-TEMPLATES** for customization options

---

## Key Concepts Quick Reference

### The Core Loop

```
BEHAVIOR LOGGED → VERIFICATION → KPI TRACKING → CORRELATION ANALYSIS → AI INSIGHTS
     ↑                                                                      │
     └──────────────────── FEEDBACK & TRAINING ←────────────────────────────┘
```

### User Hierarchy

```
OWNER/ADMIN
    │
    ├── Configures system
    ├── Views all data
    ├── Sets incentives
    │
    ▼
MANAGER/SUPERVISOR
    │
    ├── Daily briefings
    ├── Verifies behaviors
    ├── Enters lag measures
    │
    ▼
STAFF/TEAM MEMBERS
    │
    ├── Logs behaviors
    ├── Views own stats
    └── Receives coaching
```

### Data Flow

```
INPUT                      PROCESSING                   OUTPUT
───────────────────────────────────────────────────────────────
Staff logs behavior   →    Store in DB            →    Update scoreboard
Manager enters revenue →   Calculate avg check    →    Compare to benchmark
AI analyzes week      →    Find correlations      →    Generate insights
System detects anomaly →   Flag for review        →    Alert manager
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | Initial | Full documentation suite created |
| 1.1 | Dec 2024 | Engineer Update | Major expansion: Core principles, industry-agnostic philosophy, AI scaffolding, DSPy-style prompting, self-reflection patterns, LLM-as-judge, token tracking, agentic testing with Chrome MCP, analytics abstraction layer, integration philosophy. Added docs 15 (Analytics Layer) and 16 (Integration Philosophy). |

---

## Contributing

When updating documentation:
1. Update the specific document
2. Update the "Last Updated" date in this index
3. Note major changes in Revision History
