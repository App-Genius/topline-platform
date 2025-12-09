# Topline: Reporting Engine Specification

## Overview

This document specifies the complete reporting system for Topline, including report types, generation logic, data aggregation, export formats, and delivery mechanisms.

---

## Table of Contents

1. [Report Types](#1-report-types)
2. [Report Generation Architecture](#2-report-generation-architecture)
3. [Data Aggregation](#3-data-aggregation)
4. [Report Templates](#4-report-templates)
5. [Export Formats](#5-export-formats)
6. [Scheduling & Delivery](#6-scheduling--delivery)
7. [API Endpoints](#7-api-endpoints)

---

## 1. Report Types

### 1.1 Report Categories

| Category | Purpose | Frequency | Audience |
|----------|---------|-----------|----------|
| **Operational** | Daily/shift performance | Real-time, Daily | Manager |
| **Performance** | Staff and behavior metrics | Weekly, Monthly | Manager, Owner |
| **Financial** | Revenue, costs, variance | Weekly, Monthly | Owner |
| **Insights** | AI-generated analysis | Weekly | Owner |
| **Compliance** | Training, attendance | Monthly | Owner, HR |

### 1.2 Report Inventory

#### Daily Reports

| Report | Description | Trigger |
|--------|-------------|---------|
| **Daily Summary** | Revenue, covers, avg check, behaviors | End of day entry |
| **Shift Report** | Per-shift breakdown | Shift end |
| **Verification Summary** | Pending, verified, rejected behaviors | End of day |

#### Weekly Reports

| Report | Description | Trigger |
|--------|-------------|---------|
| **Weekly Performance** | Week-over-week KPI comparison | Sunday midnight |
| **Behavior Adoption** | Adoption rates by staff, behavior | Sunday midnight |
| **Leaderboard Report** | Rankings and movements | Sunday midnight |
| **Correlation Report** | Behavior-KPI correlations | Sunday midnight |
| **AI Insights Digest** | Synthesized observations | Sunday midnight |

#### Monthly Reports

| Report | Description | Trigger |
|--------|-------------|---------|
| **Monthly Executive** | High-level KPI summary | 1st of month |
| **Budget Variance** | Actual vs budget analysis | 1st of month |
| **Staff Performance** | Individual performance reviews | 1st of month |
| **Training Compliance** | Briefing attendance, topics covered | 1st of month |
| **Trend Analysis** | 12-month rolling trends | 1st of month |

---

## 2. Report Generation Architecture

### 2.1 System Architecture

```
                     +-----------------+
                     |  Report Request |
                     |  (API/Schedule) |
                     +--------+--------+
                              |
                              v
                     +--------+--------+
                     |  Report Router  |
                     |  (Type, Period) |
                     +--------+--------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
       +------+------+ +------+------+ +------+------+
       | Data        | | Calculation | | Aggregation |
       | Fetcher     | | Engine      | | Service     |
       +------+------+ +------+------+ +------+------+
              |               |               |
              +---------------+---------------+
                              |
                              v
                     +--------+--------+
                     | Template Engine |
                     | (Handlebars)    |
                     +--------+--------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
       +------+------+ +------+------+ +------+------+
       | PDF         | | Excel       | | Email       |
       | Generator   | | Generator   | | Template    |
       +------+------+ +------+------+ +------+------+
                              |
                              v
                     +--------+--------+
                     | Delivery        |
                     | (Email/Storage) |
                     +-----------------+
```

### 2.2 Report Generator Interface

```typescript
interface ReportGenerator {
  type: ReportType;
  name: string;
  description: string;

  // Generate report data
  generate(params: ReportParams): Promise<ReportData>;

  // Render to specific format
  render(data: ReportData, format: ExportFormat): Promise<Buffer>;

  // Validate parameters
  validate(params: ReportParams): ValidationResult;
}

interface ReportParams {
  organizationId: string;
  locationId?: string;
  startDate: Date;
  endDate: Date;
  userId?: string;        // For individual reports
  roleId?: string;        // For role-filtered reports
  includeAI?: boolean;    // Include AI insights
  format?: ExportFormat;
}

interface ReportData {
  metadata: {
    reportType: ReportType;
    generatedAt: Date;
    period: { start: Date; end: Date };
    organization: string;
    location?: string;
  };
  sections: ReportSection[];
  summary?: ReportSummary;
  insights?: AIInsight[];
}
```

### 2.3 Report Types Enum

```typescript
enum ReportType {
  // Daily
  DAILY_SUMMARY = 'daily_summary',
  SHIFT_REPORT = 'shift_report',
  VERIFICATION_SUMMARY = 'verification_summary',

  // Weekly
  WEEKLY_PERFORMANCE = 'weekly_performance',
  BEHAVIOR_ADOPTION = 'behavior_adoption',
  LEADERBOARD = 'leaderboard',
  CORRELATION = 'correlation',
  AI_INSIGHTS_DIGEST = 'ai_insights_digest',

  // Monthly
  MONTHLY_EXECUTIVE = 'monthly_executive',
  BUDGET_VARIANCE = 'budget_variance',
  STAFF_PERFORMANCE = 'staff_performance',
  TRAINING_COMPLIANCE = 'training_compliance',
  TREND_ANALYSIS = 'trend_analysis'
}
```

---

## 3. Data Aggregation

### 3.1 Revenue Aggregations

```typescript
interface RevenueAggregation {
  // Time-based
  daily: DailyRevenue[];
  weekly: WeeklyRevenue[];
  monthly: MonthlyRevenue[];

  // Comparisons
  vsLastPeriod: {
    absolute: number;
    percentage: number;
    trend: 'up' | 'down' | 'flat';
  };
  vsLastYear: {
    absolute: number;
    percentage: number;
    trend: 'up' | 'down' | 'flat';
  };
  vsBudget: {
    absolute: number;
    percentage: number;
    status: 'over' | 'under' | 'on_track';
  };
}

interface DailyRevenue {
  date: Date;
  revenue: number;
  covers: number;
  avgCheck: number;
  dayOfWeek: string;
  isHoliday: boolean;
  notes?: string;
}
```

### 3.2 Behavior Aggregations

```typescript
interface BehaviorAggregation {
  // Totals
  totalLogged: number;
  totalVerified: number;
  totalRejected: number;
  totalPending: number;

  // By behavior type
  byBehavior: {
    behaviorId: string;
    behaviorName: string;
    count: number;
    acceptedCount: number;
    rejectionRate: number;
  }[];

  // By staff
  byStaff: {
    userId: string;
    userName: string;
    totalBehaviors: number;
    verificationRate: number;
    avgPerShift: number;
    rank: number;
    rankChange: number;  // vs previous period
  }[];

  // Adoption metrics
  adoption: {
    rate: number;           // Actual / Expected
    trend: number;          // vs previous period
    expectedBehaviors: number;
    actualBehaviors: number;
  };
}
```

### 3.3 Correlation Aggregations

```typescript
interface CorrelationAggregation {
  // Behavior-KPI correlations
  correlations: {
    behaviorId: string;
    behaviorName: string;
    kpiId: string;
    kpiName: string;
    coefficient: number;     // -1 to +1
    strength: 'strong' | 'moderate' | 'weak' | 'none';
    direction: 'positive' | 'negative';
    sampleSize: number;
    pValue: number;
    isSignificant: boolean;  // p < 0.05
  }[];

  // Time-lagged correlations
  laggedCorrelations: {
    behaviorId: string;
    kpiId: string;
    optimalLag: number;     // days
    coefficient: number;
  }[];
}
```

### 3.4 Aggregation SQL Examples

```sql
-- Daily revenue summary
SELECT
  DATE(created_at) as date,
  SUM(revenue) as total_revenue,
  SUM(covers) as total_covers,
  ROUND(SUM(revenue)::numeric / NULLIF(SUM(covers), 0), 2) as avg_check
FROM daily_entries
WHERE organization_id = $1
  AND created_at BETWEEN $2 AND $3
GROUP BY DATE(created_at)
ORDER BY date;

-- Behavior adoption by staff
SELECT
  u.id as user_id,
  u.name as user_name,
  COUNT(bl.id) as total_behaviors,
  COUNT(CASE WHEN bl.status = 'verified' THEN 1 END) as verified,
  ROUND(
    COUNT(CASE WHEN bl.status = 'verified' THEN 1 END)::numeric /
    NULLIF(COUNT(bl.id), 0) * 100,
    2
  ) as verification_rate
FROM users u
LEFT JOIN behavior_logs bl ON bl.user_id = u.id
  AND bl.created_at BETWEEN $2 AND $3
WHERE u.organization_id = $1
  AND u.role_type = 'staff'
GROUP BY u.id, u.name
ORDER BY total_behaviors DESC;

-- Weekly correlation data
WITH weekly_behaviors AS (
  SELECT
    DATE_TRUNC('week', created_at) as week,
    behavior_id,
    COUNT(*) as behavior_count
  FROM behavior_logs
  WHERE organization_id = $1
    AND status = 'verified'
    AND created_at BETWEEN $2 AND $3
  GROUP BY DATE_TRUNC('week', created_at), behavior_id
),
weekly_kpis AS (
  SELECT
    DATE_TRUNC('week', date) as week,
    AVG(value) as avg_value
  FROM kpi_values
  WHERE organization_id = $1
    AND kpi_id = $4
    AND date BETWEEN $2 AND $3
  GROUP BY DATE_TRUNC('week', date)
)
SELECT
  wb.behavior_id,
  CORR(wb.behavior_count, wk.avg_value) as correlation
FROM weekly_behaviors wb
JOIN weekly_kpis wk ON wb.week = wk.week
GROUP BY wb.behavior_id;
```

---

## 4. Report Templates

### 4.1 Weekly Performance Report

```
+==============================================================+
|                   WEEKLY PERFORMANCE REPORT                   |
|                                                               |
|  Organization: {{organization.name}}                          |
|  Period: {{period.start}} - {{period.end}}                   |
|  Generated: {{generatedAt}}                                   |
+==============================================================+

EXECUTIVE SUMMARY
-----------------
{{#if summary.isWinning}}
Great week! You're beating your targets.
{{else}}
Room for improvement this week. Here's what to focus on.
{{/if}}

KEY METRICS
-----------
+-------------------+-------------+-------------+----------+
| Metric            | This Week   | Last Week   | Change   |
+-------------------+-------------+-------------+----------+
| Revenue           | {{revenue.current | currency}} | {{revenue.previous | currency}} | {{revenue.change | percent}} |
| Average Check     | {{avgCheck.current | currency}} | {{avgCheck.previous | currency}} | {{avgCheck.change | percent}} |
| Covers            | {{covers.current}} | {{covers.previous}} | {{covers.change | percent}} |
| Behaviors Logged  | {{behaviors.current}} | {{behaviors.previous}} | {{behaviors.change | percent}} |
| Adoption Rate     | {{adoption.current | percent}} | {{adoption.previous | percent}} | {{adoption.change | ppts}} |
+-------------------+-------------+-------------+----------+

GAME STATE: {{gameState.status}}
Progress: [{{gameState.progressBar}}] {{gameState.percentage}}%

LEADERBOARD
-----------
{{#each leaderboard}}
{{rank}}. {{name}} - {{behaviors}} behaviors - ${{avgCheck}} avg check {{#if rankChange}}({{rankChange}}){{/if}}
{{/each}}

TOP INSIGHTS
------------
{{#each insights}}
{{icon}} {{title}}
   {{description}}

{{/each}}

BEHAVIOR BREAKDOWN
------------------
{{#each behaviorBreakdown}}
{{name}}: {{count}} logged ({{adoptionRate}}% adoption)
{{/each}}

RECOMMENDATIONS
---------------
{{#each recommendations}}
{{index}}. {{text}}
{{/each}}

---
Generated by Topline | https://topline.app
```

### 4.2 Monthly Executive Report

```
+==============================================================+
|                 MONTHLY EXECUTIVE SUMMARY                     |
|                                                               |
|  {{organization.name}}                                        |
|  {{month}} {{year}}                                          |
+==============================================================+

FINANCIAL HIGHLIGHTS
--------------------
                        Actual          Budget      Variance
Revenue              {{revenue.actual | currency}}  {{revenue.budget | currency}}  {{revenue.variance | signedPercent}}
Cost of Sales        {{cos.actual | currency}}  {{cos.budget | currency}}  {{cos.variance | signedPercent}}
Labor                {{labor.actual | currency}}  {{labor.budget | currency}}  {{labor.variance | signedPercent}}
GOP                  {{gop.actual | currency}}  {{gop.budget | currency}}  {{gop.variance | signedPercent}}

YEAR OVER YEAR
--------------
                     This Month      Same Month LY    Change
Revenue              {{revenue.current | currency}}  {{revenue.ly | currency}}  {{revenue.yoyChange | signedPercent}}
Average Check        {{avgCheck.current | currency}}  {{avgCheck.ly | currency}}  {{avgCheck.yoyChange | signedPercent}}
Covers               {{covers.current}}  {{covers.ly}}  {{covers.yoyChange | signedPercent}}

BEHAVIOR PERFORMANCE
--------------------
Total Behaviors Logged: {{behaviors.total}}
Verification Rate: {{behaviors.verificationRate | percent}}
Adoption Rate: {{behaviors.adoptionRate | percent}}

Top Performing Behaviors (by correlation):
{{#each topBehaviors}}
  - {{name}}: {{correlation | decimal}} correlation with {{kpiName}}
{{/each}}

TEAM PERFORMANCE
----------------
Top Performers:
{{#each topPerformers}}
  {{rank}}. {{name}} - ${{avgCheck}} avg check, {{behaviors}} behaviors
{{/each}}

Needs Attention:
{{#each needsAttention}}
  - {{name}}: {{issue}}
{{/each}}

AI INSIGHTS
-----------
{{#each aiInsights}}
{{type | uppercase}}: {{title}}
{{description}}

{{/each}}

ACTION ITEMS
------------
{{#each actionItems}}
[ ] {{text}}
{{/each}}

---
Generated by Topline | Report ID: {{reportId}}
```

### 4.3 Budget Variance Report

```
+==============================================================+
|                    BUDGET VARIANCE REPORT                     |
|                                                               |
|  {{organization.name}} | {{period}}                          |
+==============================================================+

SUMMARY
-------
Overall Budget Status: {{overallStatus}}
Total Variance: {{totalVariance | currency}} ({{totalVariancePercent | signedPercent}})

REVENUE VARIANCE
----------------
Category          Budget          Actual        Variance    Status
---------------------------------------------------------------------------
{{#each revenueItems}}
{{padRight name 16}} {{budget | currency | padLeft 12}} {{actual | currency | padLeft 12}} {{variance | signedCurrency | padLeft 12}} {{status}}
{{/each}}
---------------------------------------------------------------------------
TOTAL             {{revenue.budget | currency}} {{revenue.actual | currency}} {{revenue.variance | signedCurrency}} {{revenue.status}}

COST VARIANCE
-------------
Category          Budget          Actual        Variance    Status
---------------------------------------------------------------------------
{{#each costItems}}
{{padRight name 16}} {{budget | currency | padLeft 12}} {{actual | currency | padLeft 12}} {{variance | signedCurrency | padLeft 12}} {{status}}
{{/each}}
---------------------------------------------------------------------------
TOTAL             {{costs.budget | currency}} {{costs.actual | currency}} {{costs.variance | signedCurrency}} {{costs.status}}

ALERTS
------
{{#each alerts}}
{{severity | uppercase}}: {{category}} is {{percentOver | percent}} over budget
  - Budget: {{budget | currency}}
  - Actual: {{actual | currency}}
  - Overage: {{overage | currency}}
{{/each}}

TREND ANALYSIS
--------------
This Month vs Previous 3 Months:
{{#each trendAnalysis}}
- {{category}}: {{trend}} ({{trendDescription}})
{{/each}}

RECOMMENDATIONS
---------------
{{#each recommendations}}
{{index}}. {{text}}
{{/each}}
```

---

## 5. Export Formats

### 5.1 PDF Export

```typescript
interface PDFExportConfig {
  pageSize: 'letter' | 'a4';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header: {
    logo?: Buffer;
    title: string;
    subtitle?: string;
  };
  footer: {
    pageNumbers: boolean;
    generatedAt: boolean;
    confidential?: boolean;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

// PDF generation using puppeteer
async function generatePDF(
  html: string,
  config: PDFExportConfig
): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: config.pageSize,
    landscape: config.orientation === 'landscape',
    margin: config.margins,
    displayHeaderFooter: true,
    headerTemplate: buildHeader(config.header),
    footerTemplate: buildFooter(config.footer),
    printBackground: true
  });

  await browser.close();
  return pdf;
}
```

### 5.2 Excel Export

```typescript
interface ExcelExportConfig {
  worksheets: WorksheetConfig[];
  styling: {
    headerStyle: ExcelStyle;
    dataStyle: ExcelStyle;
    highlightStyle: ExcelStyle;
  };
  includeCharts: boolean;
}

interface WorksheetConfig {
  name: string;
  columns: ColumnConfig[];
  data: any[];
  summaryRow?: boolean;
  filters?: boolean;
  freezeHeader?: boolean;
}

// Excel generation using ExcelJS
async function generateExcel(
  reportData: ReportData,
  config: ExcelExportConfig
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  for (const wsConfig of config.worksheets) {
    const worksheet = workbook.addWorksheet(wsConfig.name);

    // Add headers
    worksheet.columns = wsConfig.columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // Add data
    worksheet.addRows(wsConfig.data);

    // Add filters if requested
    if (wsConfig.filters) {
      worksheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + wsConfig.columns.length)}1`
      };
    }

    // Freeze header row
    if (wsConfig.freezeHeader) {
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }
  }

  return workbook.xlsx.writeBuffer();
}
```

### 5.3 CSV Export

```typescript
async function generateCSV(
  data: any[],
  columns: string[]
): Promise<string> {
  const header = columns.join(',');

  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col];
      // Escape values with commas or quotes
      if (typeof value === 'string' &&
          (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [header, ...rows].join('\n');
}
```

### 5.4 JSON Export (API Response)

```typescript
interface JSONExportConfig {
  includeMetadata: boolean;
  pretty: boolean;
  dateFormat: 'iso' | 'unix' | 'human';
}

function generateJSON(
  reportData: ReportData,
  config: JSONExportConfig
): string {
  const output = config.includeMetadata ? reportData : reportData.sections;

  const replacer = (key: string, value: any) => {
    if (value instanceof Date) {
      switch (config.dateFormat) {
        case 'unix': return value.getTime();
        case 'human': return value.toLocaleDateString();
        default: return value.toISOString();
      }
    }
    return value;
  };

  return JSON.stringify(
    output,
    replacer,
    config.pretty ? 2 : undefined
  );
}
```

---

## 6. Scheduling & Delivery

### 6.1 Schedule Configuration

```typescript
interface ReportSchedule {
  id: string;
  organizationId: string;
  reportType: ReportType;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;       // 0-6 for weekly
  dayOfMonth?: number;      // 1-31 for monthly
  timeOfDay: string;        // HH:MM in org timezone
  timezone: string;
  enabled: boolean;
  recipients: Recipient[];
  format: ExportFormat;
  params?: Record<string, any>;
}

interface Recipient {
  type: 'email' | 'webhook' | 'slack';
  destination: string;
  userId?: string;
}
```

### 6.2 Scheduler Service

```typescript
class ReportScheduler {
  private schedules: Map<string, NodeJS.Timeout> = new Map();

  async initialize(): Promise<void> {
    const allSchedules = await this.loadActiveSchedules();

    for (const schedule of allSchedules) {
      this.scheduleReport(schedule);
    }
  }

  scheduleReport(schedule: ReportSchedule): void {
    const cronExpression = this.toCronExpression(schedule);

    const job = cron.schedule(cronExpression, async () => {
      try {
        await this.executeReport(schedule);
      } catch (error) {
        await this.handleError(schedule, error);
      }
    }, {
      timezone: schedule.timezone
    });

    this.schedules.set(schedule.id, job);
  }

  private toCronExpression(schedule: ReportSchedule): string {
    const [hour, minute] = schedule.timeOfDay.split(':');

    switch (schedule.frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * ${schedule.dayOfWeek}`;
      case 'monthly':
        return `${minute} ${hour} ${schedule.dayOfMonth} * *`;
    }
  }

  private async executeReport(schedule: ReportSchedule): Promise<void> {
    const generator = this.getGenerator(schedule.reportType);

    // Calculate period based on frequency
    const period = this.calculatePeriod(schedule);

    // Generate report
    const data = await generator.generate({
      organizationId: schedule.organizationId,
      startDate: period.start,
      endDate: period.end,
      ...schedule.params
    });

    // Render to format
    const rendered = await generator.render(data, schedule.format);

    // Deliver to recipients
    for (const recipient of schedule.recipients) {
      await this.deliver(rendered, recipient, schedule);
    }

    // Log execution
    await this.logExecution(schedule, 'success');
  }
}
```

### 6.3 Email Delivery

```typescript
interface EmailDeliveryConfig {
  from: string;
  replyTo?: string;
  templateId: string;
}

async function deliverReportByEmail(
  report: Buffer,
  recipient: Recipient,
  schedule: ReportSchedule,
  config: EmailDeliveryConfig
): Promise<void> {
  const filename = `${schedule.reportType}_${formatDate(new Date())}.${schedule.format}`;

  await emailService.send({
    to: recipient.destination,
    from: config.from,
    subject: `Topline ${getReportTitle(schedule.reportType)} - ${formatDate(new Date())}`,
    templateId: config.templateId,
    templateData: {
      reportType: getReportTitle(schedule.reportType),
      period: getPeriodDescription(schedule),
      generatedAt: new Date().toISOString()
    },
    attachments: [{
      filename,
      content: report,
      contentType: getMimeType(schedule.format)
    }]
  });
}
```

### 6.4 Webhook Delivery

```typescript
async function deliverReportByWebhook(
  report: ReportData,
  recipient: Recipient,
  schedule: ReportSchedule
): Promise<void> {
  const payload = {
    event: 'report.generated',
    reportType: schedule.reportType,
    organizationId: schedule.organizationId,
    generatedAt: new Date().toISOString(),
    data: report
  };

  const signature = generateWebhookSignature(
    JSON.stringify(payload),
    recipient.secret
  );

  await fetch(recipient.destination, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Topline-Signature': signature,
      'X-Topline-Timestamp': Date.now().toString()
    },
    body: JSON.stringify(payload)
  });
}
```

---

## 7. API Endpoints

### 7.1 Report Generation

```yaml
# Generate report on-demand
POST /api/reports/generate
Request:
  reportType: string         # Report type from enum
  startDate: string          # ISO date
  endDate: string            # ISO date
  format: string             # pdf, xlsx, csv, json
  locationId?: string        # Filter by location
  userId?: string            # Individual report
  includeAI?: boolean        # Include AI insights

Response:
  reportId: string
  status: 'processing' | 'complete' | 'failed'
  downloadUrl?: string
  expiresAt?: string

# Get report status
GET /api/reports/:reportId
Response:
  reportId: string
  status: string
  progress?: number
  downloadUrl?: string
  error?: string

# Download report
GET /api/reports/:reportId/download
Response: Binary file with appropriate Content-Type
```

### 7.2 Report Schedules

```yaml
# List schedules
GET /api/reports/schedules
Query:
  reportType?: string
  enabled?: boolean
Response:
  schedules: ReportSchedule[]

# Create schedule
POST /api/reports/schedules
Request:
  reportType: string
  frequency: string
  dayOfWeek?: number
  dayOfMonth?: number
  timeOfDay: string
  timezone: string
  recipients: Recipient[]
  format: string
  params?: object

Response:
  schedule: ReportSchedule

# Update schedule
PATCH /api/reports/schedules/:id
Request: Partial<ReportSchedule>
Response:
  schedule: ReportSchedule

# Delete schedule
DELETE /api/reports/schedules/:id
Response:
  success: boolean

# Execute schedule now (manual trigger)
POST /api/reports/schedules/:id/execute
Response:
  reportId: string
  status: string
```

### 7.3 Report History

```yaml
# List generated reports
GET /api/reports/history
Query:
  reportType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number

Response:
  reports: {
    reportId: string
    reportType: string
    generatedAt: string
    status: string
    downloadUrl?: string
    expiresAt?: string
  }[]
  total: number
```

---

## Appendix A: Report Metrics Reference

### KPI Calculations in Reports

| Metric | Calculation | Notes |
|--------|-------------|-------|
| Average Check | Revenue / Covers | Exclude zero-cover days |
| Adoption Rate | Behaviors Logged / Expected Behaviors | Expected = Staff * Target |
| Verification Rate | Verified / Total Logged | Exclude pending |
| Correlation Coefficient | Pearson's r | Require min 7 data points |
| YoY Change | (Current - PY) / PY * 100 | Handle PY = 0 |
| Budget Variance | (Actual - Budget) / Budget * 100 | Signed percentage |

### Trend Calculations

```typescript
function calculateTrend(
  values: number[],
  periods: number = 4
): 'up' | 'down' | 'flat' {
  if (values.length < periods) return 'flat';

  const recent = values.slice(-periods);
  const slope = linearRegression(recent).slope;

  if (slope > 0.05) return 'up';
  if (slope < -0.05) return 'down';
  return 'flat';
}
```

---

*This document is part of the Topline documentation suite. See [00-INDEX.md](./00-INDEX.md) for the complete list.*
