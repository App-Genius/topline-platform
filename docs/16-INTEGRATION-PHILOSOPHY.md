# Topline: Integration Philosophy

## Overview

This document defines the guiding principles for all integrations in the Topline system. The core philosophy: **Integrations exist ONLY to ingest data. They must NEVER bloat the core system.**

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Data Ingestion Strategy](#2-data-ingestion-strategy)
3. [Integration Patterns](#3-integration-patterns)
4. [Approved Integration Types](#4-approved-integration-types)
5. [Integration Architecture](#5-integration-architecture)
6. [Adding New Integrations](#6-adding-new-integrations)
7. [Anti-Patterns to Avoid](#7-anti-patterns-to-avoid)

---

## 1. Core Principles

### 1.1 The Golden Rule

> **Integrations ingest data. They don't add features.**

Every integration decision should answer this question:
- Does this integration bring data INTO Topline that helps measure behaviors or KPIs?

If the answer is no, the integration doesn't belong.

### 1.2 Guiding Principles

| Principle | Description |
|-----------|-------------|
| **Ingest Only** | Integrations pull data in; they don't push features out |
| **Core Independence** | The core system must function without any integration |
| **Data Normalization** | All ingested data is normalized to Topline's data model |
| **Graceful Degradation** | Integration failures don't break core functionality |
| **User Transparency** | Users always know where data came from |

### 1.3 What This Means in Practice

**DO:**
- Pull sales data from POS systems
- Import staff schedules from scheduling software
- Fetch review scores from Google Business
- Sync cost data from accounting systems

**DON'T:**
- Add POS features to Topline
- Build scheduling functionality
- Create review response tools
- Duplicate accounting features

---

## 2. Data Ingestion Strategy

### 2.1 Data Flow Direction

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EXTERNAL SYSTEMS              TOPLINE CORE                      │
│                                                                  │
│  ┌─────────────┐                                                │
│  │ POS System  │ ──────┐                                        │
│  └─────────────┘       │                                        │
│                        │      ┌─────────────────┐               │
│  ┌─────────────┐       │      │                 │               │
│  │ Scheduling  │ ──────┼─────▶│  Ingestion      │               │
│  └─────────────┘       │      │  Layer          │               │
│                        │      │                 │               │
│  ┌─────────────┐       │      └────────┬────────┘               │
│  │ Accounting  │ ──────┤               │                        │
│  └─────────────┘       │               ▼                        │
│                        │      ┌─────────────────┐               │
│  ┌─────────────┐       │      │                 │               │
│  │ Reviews     │ ──────┘      │  Normalized     │               │
│  └─────────────┘              │  Data Store     │               │
│                               │                 │               │
│  ┌─────────────┐              └────────┬────────┘               │
│  │ Excel/CSV   │ ──────────────────────┘                        │
│  └─────────────┘                       │                        │
│                                        ▼                        │
│  ┌─────────────┐              ┌─────────────────┐               │
│  │ Manual      │ ─────────────▶│  Core Engine   │               │
│  │ Entry       │              │  (Calculations, │               │
│  └─────────────┘              │   Correlations) │               │
│                               └─────────────────┘               │
│                                                                  │
│  NOTE: Data only flows INTO Topline, never out to integrations  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Ingestion Priority Hierarchy

When multiple methods are available for the same data, use this priority:

```
1. Direct API Integration (cleanest, most reliable)
   └── Automatic sync, structured data, real-time or scheduled

2. Webhook/Push (near real-time)
   └── External system pushes data to Topline endpoints

3. File Import (Excel, CSV)
   └── Batch upload, user-initiated, flexible format

4. Document Parsing (OCR/AI)
   └── Invoices, receipts, printed reports
   └── Use AI to extract structured data

5. Manual Entry (always available)
   └── Fallback when no other method exists
   └── Simple forms, minimal friction
```

### 2.3 Data Normalization

All ingested data is normalized to Topline's internal model:

```typescript
// Example: Revenue data normalization
interface NormalizedRevenue {
  date: Date;
  amount: number;
  currency: 'USD'; // Always normalize to USD
  source: 'pos' | 'manual' | 'import' | 'api';
  sourceId?: string; // Original ID from source system
  breakdown?: {
    food?: number;
    beverage?: number;
    other?: number;
  };
  metadata?: {
    covers?: number;
    transactions?: number;
    avgCheck?: number;
  };
}

// From Square POS
function normalizeSquareData(squareTransaction: SquareTransaction): NormalizedRevenue {
  return {
    date: new Date(squareTransaction.created_at),
    amount: squareTransaction.total_money.amount / 100, // Convert cents
    currency: 'USD',
    source: 'pos',
    sourceId: squareTransaction.id,
    breakdown: categorizeLineItems(squareTransaction.line_items),
    metadata: {
      transactions: 1,
    }
  };
}

// From CSV upload
function normalizeCSVRow(row: CSVRow): NormalizedRevenue {
  return {
    date: parseDate(row.date),
    amount: parseFloat(row.revenue),
    currency: 'USD',
    source: 'import',
    metadata: {
      covers: row.covers ? parseInt(row.covers) : undefined,
    }
  };
}
```

---

## 3. Integration Patterns

### 3.1 Pattern: Scheduled Sync

For batch data that updates periodically:

```typescript
// lib/integrations/patterns/scheduled-sync.ts
interface ScheduledSyncConfig {
  integrationId: string;
  schedule: string; // Cron expression
  fetchFunction: () => Promise<unknown[]>;
  transformFunction: (data: unknown) => NormalizedData;
  onSuccess?: (count: number) => void;
  onError?: (error: Error) => void;
}

async function runScheduledSync(config: ScheduledSyncConfig) {
  const startTime = Date.now();

  try {
    // Fetch data from external system
    const rawData = await config.fetchFunction();

    // Transform to normalized format
    const normalized = rawData.map(config.transformFunction);

    // Upsert to database
    const result = await upsertNormalizedData(normalized);

    // Log success
    await logIntegrationSync({
      integrationId: config.integrationId,
      status: 'success',
      recordsProcessed: normalized.length,
      durationMs: Date.now() - startTime
    });

    config.onSuccess?.(normalized.length);
    return result;

  } catch (error) {
    await logIntegrationSync({
      integrationId: config.integrationId,
      status: 'error',
      error: error.message,
      durationMs: Date.now() - startTime
    });

    config.onError?.(error);
    throw error;
  }
}
```

### 3.2 Pattern: Webhook Receiver

For real-time data pushes:

```typescript
// lib/integrations/patterns/webhook-receiver.ts
interface WebhookConfig {
  integrationId: string;
  secretKey: string;
  eventHandlers: Record<string, (payload: unknown) => Promise<void>>;
}

function createWebhookHandler(config: WebhookConfig) {
  return async (req: Request) => {
    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature');
    if (!verifySignature(req.body, signature, config.secretKey)) {
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = await req.json();
    const eventType = payload.type || payload.event;

    const handler = config.eventHandlers[eventType];
    if (!handler) {
      // Log unknown event but don't fail
      await logUnknownWebhookEvent(config.integrationId, eventType);
      return new Response('OK', { status: 200 });
    }

    try {
      await handler(payload);
      await logWebhookReceived(config.integrationId, eventType, 'success');
      return new Response('OK', { status: 200 });
    } catch (error) {
      await logWebhookReceived(config.integrationId, eventType, 'error', error);
      return new Response('Processing error', { status: 500 });
    }
  };
}
```

### 3.3 Pattern: File Import

For user-uploaded files:

```typescript
// lib/integrations/patterns/file-import.ts
interface FileImportConfig {
  integrationId: string;
  acceptedFormats: ('csv' | 'xlsx' | 'json')[];
  columnMappings: Record<string, string>; // externalCol -> internalField
  transformFunction: (row: Record<string, unknown>) => NormalizedData;
  validationRules: ValidationRule[];
}

async function processFileImport(
  config: FileImportConfig,
  file: File,
  organizationId: string
): Promise<ImportResult> {
  const format = getFileFormat(file);

  if (!config.acceptedFormats.includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }

  // Parse file
  const rawRows = await parseFile(file, format);

  // Map columns
  const mappedRows = rawRows.map(row =>
    mapColumns(row, config.columnMappings)
  );

  // Validate
  const { valid, invalid } = validateRows(mappedRows, config.validationRules);

  // Transform valid rows
  const normalized = valid.map(config.transformFunction);

  // Save with organization context
  const saved = await saveNormalizedData(normalized, organizationId);

  return {
    totalRows: rawRows.length,
    successfulRows: saved.length,
    failedRows: invalid.length,
    errors: invalid.map(i => ({
      row: i.rowNumber,
      errors: i.errors
    }))
  };
}
```

### 3.4 Pattern: AI Document Parsing

For unstructured documents:

```typescript
// lib/integrations/patterns/ai-document-parser.ts
interface DocumentParseConfig {
  documentType: 'invoice' | 'receipt' | 'report';
  extractionSchema: z.ZodSchema;
  confidence_threshold: number;
}

async function parseDocument(
  config: DocumentParseConfig,
  document: File | Buffer
): Promise<ParseResult> {
  // Convert to base64 for vision API
  const base64 = await toBase64(document);

  // Use AI to extract structured data
  const prompt = buildExtractionPrompt(config.documentType, config.extractionSchema);

  const result = await aiClient.generate({
    prompt,
    images: [{ type: 'base64', data: base64 }],
    schema: z.object({
      data: config.extractionSchema,
      confidence: z.number().min(0).max(1),
      extractedFields: z.array(z.string()),
      uncertainFields: z.array(z.string())
    })
  });

  if (result.confidence < config.confidence_threshold) {
    return {
      success: false,
      requiresReview: true,
      extractedData: result.data,
      confidence: result.confidence,
      uncertainFields: result.uncertainFields
    };
  }

  return {
    success: true,
    requiresReview: false,
    extractedData: result.data,
    confidence: result.confidence
  };
}
```

---

## 4. Approved Integration Types

### 4.1 Revenue Data Sources

| Source Type | Data Extracted | Use Case |
|-------------|----------------|----------|
| POS Systems | Transactions, items, covers | Daily revenue tracking |
| Payment Processors | Settlement amounts | Revenue verification |
| Reservation Systems | Covers, spend per head | Forecasting |
| E-commerce | Online orders | Multi-channel revenue |

**Approved POS Integrations:**
- Square
- Toast
- Clover
- Lightspeed
- Generic POS API (configurable)

### 4.2 Cost Data Sources

| Source Type | Data Extracted | Use Case |
|-------------|----------------|----------|
| Accounting Software | Invoices, expenses | Cost tracking |
| Inventory Systems | COGS, waste | Cost of sales % |
| Payroll Systems | Labor costs | Labor % |
| Utility Providers | Utility bills | Operating costs |

**Approved Accounting Integrations:**
- QuickBooks
- Xero
- FreshBooks
- Generic invoice import

### 4.3 Scheduling Data Sources

| Source Type | Data Extracted | Use Case |
|-------------|----------------|----------|
| Scheduling Apps | Shifts, hours | Labor cost calc |
| Time Clocks | Clock in/out | Actual hours |
| HR Systems | Employee data | Role assignment |

**Approved Scheduling Integrations:**
- 7shifts
- HotSchedules
- When I Work
- Deputy

### 4.4 Quality/Review Data Sources

| Source Type | Data Extracted | Use Case |
|-------------|----------------|----------|
| Google Business | Ratings, reviews | Quality KPI |
| TripAdvisor | Ratings, reviews | Hospitality KPI |
| Yelp | Ratings, reviews | Restaurant KPI |
| Survey Tools | CSAT scores | Quality tracking |

### 4.5 Manual/File Import Sources

Always available as fallback:

| Method | Best For |
|--------|----------|
| Excel/CSV Upload | Bulk historical data |
| PDF/Image OCR | Invoices, receipts |
| Manual Forms | Daily entry, corrections |

---

## 5. Integration Architecture

### 5.1 Integration Service Structure

```typescript
// lib/integrations/base.ts
interface IntegrationProvider {
  id: string;
  name: string;
  category: 'pos' | 'accounting' | 'scheduling' | 'reviews' | 'custom';
  capabilities: ('revenue' | 'costs' | 'labor' | 'reviews')[];

  // Connection management
  connect(credentials: unknown): Promise<ConnectionResult>;
  disconnect(connectionId: string): Promise<void>;
  validateConnection(connectionId: string): Promise<boolean>;

  // Data fetching
  fetchData(connectionId: string, options: FetchOptions): Promise<RawData[]>;

  // Webhooks (if supported)
  setupWebhook?(connectionId: string, webhookUrl: string): Promise<void>;
  handleWebhook?(payload: unknown): Promise<NormalizedData[]>;
}

// Example: Square POS Integration
class SquareIntegration implements IntegrationProvider {
  id = 'square';
  name = 'Square POS';
  category = 'pos' as const;
  capabilities = ['revenue'] as const;

  async connect(credentials: SquareCredentials) {
    // OAuth flow or API key validation
    const client = new SquareClient(credentials);
    const merchant = await client.getMerchant();

    return {
      connectionId: crypto.randomUUID(),
      merchantId: merchant.id,
      merchantName: merchant.business_name
    };
  }

  async fetchData(connectionId: string, options: FetchOptions) {
    const client = await this.getClient(connectionId);

    const transactions = await client.listTransactions({
      begin_time: options.startDate.toISOString(),
      end_time: options.endDate.toISOString()
    });

    return transactions.map(this.normalizeTransaction);
  }

  private normalizeTransaction(tx: SquareTransaction): NormalizedRevenue {
    return {
      date: new Date(tx.created_at),
      amount: tx.total_money.amount / 100,
      currency: 'USD',
      source: 'pos',
      sourceId: tx.id,
      metadata: {
        transactions: 1,
        covers: tx.covers || 1
      }
    };
  }
}
```

### 5.2 Integration Registry

```typescript
// lib/integrations/registry.ts
const integrationRegistry = new Map<string, IntegrationProvider>();

export function registerIntegration(provider: IntegrationProvider) {
  integrationRegistry.set(provider.id, provider);
}

export function getIntegration(id: string): IntegrationProvider | undefined {
  return integrationRegistry.get(id);
}

export function listIntegrations(category?: string): IntegrationProvider[] {
  const all = Array.from(integrationRegistry.values());
  return category
    ? all.filter(i => i.category === category)
    : all;
}

// Register all providers
registerIntegration(new SquareIntegration());
registerIntegration(new ToastIntegration());
registerIntegration(new QuickBooksIntegration());
// ... etc
```

### 5.3 Connection Management

```typescript
// Database model for integration connections
interface IntegrationConnection {
  id: string;
  organizationId: string;
  integrationId: string; // References IntegrationProvider.id
  status: 'active' | 'disconnected' | 'error';
  credentials: EncryptedJSON; // Encrypted at rest
  lastSync?: Date;
  syncSchedule?: string; // Cron expression
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 6. Adding New Integrations

### 6.1 Decision Checklist

Before adding a new integration, answer these questions:

| Question | Required Answer |
|----------|-----------------|
| Does it ingest data into Topline? | Yes |
| Does it add features to Topline? | No |
| Is the data useful for KPI tracking? | Yes |
| Can the data be normalized to our model? | Yes |
| Is there demand from multiple users? | Yes |
| Is the external API stable? | Yes |

### 6.2 Implementation Steps

1. **Define the data model**
   - What data will be ingested?
   - How does it map to our normalized models?

2. **Create the integration provider**
   - Implement `IntegrationProvider` interface
   - Handle authentication
   - Implement data fetching

3. **Add normalization functions**
   - Transform external data to internal format
   - Handle edge cases and data quality issues

4. **Set up sync mechanism**
   - Scheduled sync, webhook, or manual trigger
   - Error handling and retry logic

5. **Create UI components**
   - Connection setup flow
   - Sync status display
   - Data preview

6. **Test thoroughly**
   - Unit tests for normalization
   - Integration tests with mock API
   - Manual testing with real accounts

### 6.3 Integration Testing Template

```typescript
// tests/integrations/[integration-name].test.ts
describe('Integration: [Name]', () => {
  describe('Connection', () => {
    it('connects with valid credentials');
    it('rejects invalid credentials');
    it('handles connection timeout');
  });

  describe('Data Fetching', () => {
    it('fetches data for date range');
    it('handles empty results');
    it('handles pagination');
    it('handles API errors gracefully');
  });

  describe('Normalization', () => {
    it('normalizes transaction to NormalizedRevenue');
    it('handles missing optional fields');
    it('handles currency conversion');
    it('preserves source identifiers');
  });

  describe('Webhook Handling', () => {
    it('validates webhook signature');
    it('processes valid events');
    it('ignores unknown events');
  });
});
```

---

## 7. Anti-Patterns to Avoid

### 7.1 Feature Creep

**DON'T** add features to compete with integrated systems:

```
BAD:
"Let's add table management since we integrate with OpenTable"

GOOD:
"We pull reservation data from OpenTable to forecast covers"
```

### 7.2 Bidirectional Sync

**DON'T** push data back to external systems:

```
BAD:
"Update the POS when a behavior is logged"

GOOD:
"Pull transaction data from POS to calculate KPIs"
```

### 7.3 Integration Dependency

**DON'T** require integrations for core functionality:

```
BAD:
if (!posIntegration.isConnected) {
  throw new Error("Cannot calculate KPIs without POS");
}

GOOD:
const revenue = posIntegration.isConnected
  ? await fetchFromPOS()
  : await getManualEntry();
```

### 7.4 Duplicate Functionality

**DON'T** rebuild what integrated systems do well:

```
BAD:
"Let's add a reservation booking system"

GOOD:
"Let's pull reservation counts to predict busy periods"
```

### 7.5 Over-Integration

**DON'T** integrate just because you can:

```
BAD:
"Let's integrate with Spotify to know what music was playing"

GOOD:
(Don't. This data doesn't help track behaviors or KPIs.)
```

---

## Summary

The integration philosophy can be summarized in one sentence:

> **Pull data in, transform it, use it for KPIs. Don't do anything else.**

Every integration should make Topline's core functionality stronger by providing more accurate data. No integration should add complexity or features that distract from the core mission of connecting behaviors to business outcomes.

---

*This document is part of the Topline documentation suite. See [00-INDEX.md](./00-INDEX.md) for the complete list.*
