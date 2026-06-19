// utils/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: unknown;
  error?: Error;
}

export interface ApiRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timestamp?: Date;
}

export interface ApiResponse {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
  duration?: number;
  timestamp?: Date;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private _silent: boolean = false;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Suppress all console output from API logging (logApiRequest, logApiResponse, logApiError).
   * Internal log entries are still recorded; only console output is muted.
   */
  set silent(value: boolean) {
    this._silent = value;
  }

  get silent(): boolean {
    return this._silent;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: unknown,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
    };

    this.logs.push(entry);

    const levelName = LogLevel[level];
    const timestamp = entry.timestamp.toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
    const errorStr = error ? ` | Error: ${error.message}` : "";

    console.log(
      `[${timestamp}] ${levelName}: ${message}${contextStr}${errorStr}`,
    );

    if (error && level >= LogLevel.ERROR) {
      console.error(error.stack);
    }
  }

  debug(message: string, context?: unknown): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: unknown): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: unknown): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: unknown, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Check if we're in a CI environment where colors/icons should be disabled
   */
  private isCI(): boolean {
    return (
      process.env.CI === "true" ||
      process.env.NO_COLOR === "1" ||
      process.env.FORCE_COLOR === "0"
    );
  }

  /**
   * Logs API request with beautiful formatting
   */
  logApiRequest(request: ApiRequest): void {
    const timestamp = new Date().toISOString();
    const { method, url, headers, body } = request;

    const isCI = this.isCI();
    const separator = isCI ? "-".repeat(80) : "═".repeat(80);
    const requestIcon = isCI ? "REQUEST" : "📤 API REQUEST";

    const requestLog = [
      `\n${separator}`,
      `${requestIcon} - ${timestamp}`,
      `${separator}`,
      `${method.toUpperCase()} ${url}`,
    ];

    if (headers && Object.keys(headers).length > 0) {
      const headersIcon = isCI ? "Headers:" : "📋 Headers:";
      requestLog.push(`\n${headersIcon}`);
      Object.entries(headers).forEach(([key, value]) => {
        // Mask sensitive headers
        const isSensitive = [
          "authorization",
          "cookie",
          "x-api-key",
          "token",
        ].some((s) => key.toLowerCase().includes(s));
        const displayValue = isSensitive ? "***REDACTED***" : value;
        requestLog.push(`  ${key}: ${displayValue}`);
      });
    }

    if (body) {
      const bodyIcon = isCI ? "Body:" : "📦 Body:";
      requestLog.push(`\n${bodyIcon}`);
      const bodyStr =
        typeof body === "string" ? body : JSON.stringify(body, null, 2);
      bodyStr.split("\n").forEach((line) => {
        requestLog.push(`  ${line}`);
      });
    }

    requestLog.push(`${separator}\n`);
    if (!this._silent) {
      console.log(requestLog.join("\n"));
    }
  }

  /**
   * Logs API response with beautiful formatting and status indicators
   */
  logApiResponse(
    request: ApiRequest,
    response: ApiResponse,
    duration: number,
  ): void {
    const { method, url } = request;
    const { status, statusText, headers, body } = response;

    const timestamp = new Date().toISOString();
    const isCI = this.isCI();
    const statusEmoji = isCI
      ? this.getStatusText(status)
      : this.getStatusEmoji(status);
    const statusColor = isCI ? "" : this.getStatusColor(status);
    const resetColor = isCI ? "" : "\x1b[0m";

    const separator = isCI ? "-".repeat(80) : "═".repeat(80);
    const responseLog = [
      `\n${separator}`,
      `${statusEmoji} API RESPONSE - ${timestamp} (${duration}ms)`,
      `${separator}`,
      `${method.toUpperCase()} ${url}`,
      `Status: ${statusColor}${status}${resetColor} ${statusText || ""}`,
    ];

    if (headers && Object.keys(headers).length > 0) {
      const headersIcon = isCI ? "Headers:" : "📋 Headers:";
      responseLog.push(`\n${headersIcon}`);
      Object.entries(headers).forEach(([key, value]) => {
        const isSensitive = ["authorization", "cookie", "set-cookie"].some(
          (s) => key.toLowerCase().includes(s),
        );
        const displayValue = isSensitive ? "***REDACTED***" : value;
        responseLog.push(`  ${key}: ${displayValue}`);
      });
    }

    if (body) {
      const bodyIcon = isCI ? "Body:" : "📦 Body:";
      responseLog.push(`\n${bodyIcon}`);
      let bodyStr: string;
      try {
        bodyStr =
          typeof body === "string" ? body : JSON.stringify(body, null, 2);
        // Only truncate extremely large responses (50KB+)
        if (bodyStr.length > 50000) {
          bodyStr =
            bodyStr.substring(0, 50000) +
            "\n... [Response truncated - too large]";
        }
      } catch {
        bodyStr = String(body);
      }
      bodyStr.split("\n").forEach((line) => {
        responseLog.push(`  ${line}`);
      });
    }

    responseLog.push(`${separator}\n`);
    if (!this._silent) {
      console.log(responseLog.join("\n"));
      // Also log to internal logs only when not silent
      this.info(`API Response: ${method} ${url}`, {
        status,
        duration,
        url,
        method,
      });
    }
  }

  /**
   * Logs API error with beautiful formatting
   */
  logApiError(request: ApiRequest, error: Error, duration?: number): void {
    const { method, url } = request;
    const timestamp = new Date().toISOString();
    const isCI = this.isCI();
    const separator = isCI ? "-".repeat(80) : "═".repeat(80);
    const errorIcon = isCI ? "API ERROR" : "❌ API ERROR";
    const errorLabel = isCI ? "Error:" : "🔴 Error:";
    const stackLabel = isCI ? "Stack Trace:" : "📍 Stack Trace:";

    const errorLog = [
      `\n${separator}`,
      `${errorIcon} - ${timestamp}${duration ? ` (${duration}ms)` : ""}`,
      `${separator}`,
      `${method.toUpperCase()} ${url}`,
      `\n${errorLabel}`,
      `  ${error.message}`,
    ];

    if (error.stack) {
      errorLog.push(`\n${stackLabel}`);
      error.stack
        .split("\n")
        .slice(1)
        .forEach((line) => {
          errorLog.push(`  ${line}`);
        });
    }

    errorLog.push(`${separator}\n`);
    if (!this._silent) {
      console.error(errorLog.join("\n"));
    }

    this.error(`API Error: ${method} ${url}`, { method, url, duration }, error);
  }

  /**
   * Get emoji based on HTTP status code
   */
  private getStatusEmoji(status: number): string {
    if (status >= 200 && status < 300) return "✅";
    if (status >= 300 && status < 400) return "↪️";
    if (status >= 400 && status < 500) return "⚠️";
    if (status >= 500) return "❌";
    return "❓";
  }

  /**
   * Get status text for CI environments (no emojis)
   */
  private getStatusText(status: number): string {
    if (status >= 200 && status < 300) return "SUCCESS";
    if (status >= 300 && status < 400) return "REDIRECT";
    if (status >= 400 && status < 500) return "CLIENT_ERROR";
    if (status >= 500) return "SERVER_ERROR";
    return "UNKNOWN";
  }

  /**
   * Get ANSI color code based on HTTP status code
   */
  private getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return "\x1b[32m"; // Green
    if (status >= 300 && status < 400) return "\x1b[36m"; // Cyan
    if (status >= 400 && status < 500) return "\x1b[33m"; // Yellow
    if (status >= 500) return "\x1b[31m"; // Red
    return "";
  }

  /**
   * Summary report of all API calls
   */
  getApiSummary(): string {
    const logs = this.logs.filter((log) => log.message.includes("API"));
    const totalCalls = logs.length;
    const errors = logs.filter((log) => log.level >= LogLevel.ERROR).length;
    const warnings = logs.filter((log) => log.level === LogLevel.WARN).length;
    const successful = totalCalls - errors - warnings;

    const isCI = this.isCI();

    if (isCI) {
      return `
========================================
       API CALLS SUMMARY REPORT         
========================================
Total API Calls:  ${totalCalls}
Successful:       ${successful}
Warnings:         ${warnings}
Errors:           ${errors}
========================================
`;
    }

    return `
╔═══════════════════════════════════════╗
║      API CALLS SUMMARY REPORT         ║
╠═══════════════════════════════════════╣
║ Total API Calls:  ${String(totalCalls).padEnd(20)} ║
║ Successful:       ${String(successful).padEnd(20)} ║
║ Warnings:         ${String(warnings).padEnd(20)} ║
║ Errors:           ${String(errors).padEnd(20)} ║
╚═══════════════════════════════════════╝
    `;
  }
}

// Global logger instance
export const logger = Logger.getInstance();
// Convenience functions
export function logDebug(message: string, context?: unknown): void {
  logger.debug(message, context);
}

export function logInfo(message: string, context?: unknown): void {
  logger.info(message, context);
}

export function logWarn(message: string, context?: unknown): void {
  logger.warn(message, context);
}

export function logError(
  message: string,
  context?: unknown,
  error?: Error,
): void {
  logger.error(message, context, error);
}
