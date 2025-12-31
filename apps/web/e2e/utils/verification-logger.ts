/**
 * Verification Logger
 *
 * Captures test assertions and actions with timestamps for
 * synchronized display alongside video recordings.
 *
 * Usage:
 *   const logger = new VerificationLogger();
 *   logger.start();
 *   // ... test code ...
 *   logger.log({ type: 'assertion', description: 'Heading visible', status: 'pass' });
 *   await logger.save(testInfo);
 */

export interface VerificationEntry {
  /** Timestamp in milliseconds from test start */
  timestamp: number;
  /** Type of entry */
  type: "assertion" | "action" | "navigation" | "step";
  /** Human-readable description */
  description: string;
  /** Result status */
  status: "pass" | "fail" | "info";
  /** Optional CSS selector that was targeted */
  selector?: string;
  /** Optional step number for wizard flows */
  step?: number;
}

export class VerificationLogger {
  private entries: VerificationEntry[] = [];
  private startTime: number = 0;
  private currentStep: number = 0;

  /**
   * Start the logger - call this at the beginning of each test
   */
  start(): void {
    this.startTime = Date.now();
    this.entries = [];
    this.currentStep = 0;
  }

  /**
   * Set the current step number (for wizard-style flows)
   */
  setStep(step: number): void {
    this.currentStep = step;
  }

  /**
   * Log a verification entry
   */
  log(entry: Omit<VerificationEntry, "timestamp">): void {
    this.entries.push({
      ...entry,
      timestamp: Date.now() - this.startTime,
      step: entry.step ?? this.currentStep,
    });
  }

  /**
   * Log a navigation action
   */
  navigate(url: string): void {
    this.log({
      type: "navigation",
      description: `Navigate to ${url}`,
      status: "info",
    });
  }

  /**
   * Log a click action
   */
  click(description: string, selector?: string): void {
    this.log({
      type: "action",
      description: `Click: ${description}`,
      status: "info",
      selector,
    });
  }

  /**
   * Log a successful assertion
   */
  assertPass(description: string, selector?: string): void {
    this.log({
      type: "assertion",
      description,
      status: "pass",
      selector,
    });
  }

  /**
   * Log a failed assertion
   */
  assertFail(description: string, selector?: string): void {
    this.log({
      type: "assertion",
      description,
      status: "fail",
      selector,
    });
  }

  /**
   * Log a step change (for wizard flows)
   */
  stepStart(stepNumber: number, stepName: string): void {
    this.currentStep = stepNumber;
    this.log({
      type: "step",
      description: `Step ${stepNumber}: ${stepName}`,
      status: "info",
      step: stepNumber,
    });
  }

  /**
   * Get all entries
   */
  getEntries(): VerificationEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries as JSON string
   */
  toJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Get summary statistics
   */
  getSummary(): { total: number; passed: number; failed: number; duration: number } {
    const assertions = this.entries.filter((e) => e.type === "assertion");
    return {
      total: assertions.length,
      passed: assertions.filter((e) => e.status === "pass").length,
      failed: assertions.filter((e) => e.status === "fail").length,
      duration: this.entries.length > 0 ? this.entries[this.entries.length - 1].timestamp : 0,
    };
  }
}

/**
 * Create a pre-configured logger instance
 */
export function createLogger(): VerificationLogger {
  const logger = new VerificationLogger();
  logger.start();
  return logger;
}
