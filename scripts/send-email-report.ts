/**
 * Email Report Handler
 * Generates email report notification details for integration with team email systems
 * (SMTP, SendGrid, or other email providers)
 */

import fs from "fs";

interface ReportData {
  environment: string;
  browser: string;
  testTags: string;
  buildId: string;
  buildNumber: string;
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    passRate: number;
    failRate: number;
    skipRate: number;
  };
  reportPath: string;
  recipients: string[];
}

/**
 * Log report notification details for email integration
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function sendTestReportEmail(
  reportData: ReportData,
): Promise<void> {
  // Log report notification details for email integration
  const recipients = process.env.EMAIL_RECIPIENTS || "";

  if (!recipients) {
    console.warn("⚠️  EMAIL_RECIPIENTS not set. Email notification skipped.");
    return;
  }

  if (!reportData.reportPath || !fs.existsSync(reportData.reportPath)) {
    console.warn(`⚠️  Report file not found: ${reportData.reportPath}`);
    return;
  }

  try {
    // Read the HTML report
    const reportSize = fs.statSync(reportData.reportPath).size;

    // Create email subject with key metrics
    const subject = `Test Report: ${reportData.environment}| Pass: ${reportData.summary.passed}/${reportData.summary.total} (${reportData.summary.passRate}%)`;

    // Create plain text email body with summary
    const plainTextBody = `
Test Execution Report
=====================

Environment: ${reportData.environment}
Browser: ${reportData.browser}
Test Tags: ${reportData.testTags}

Build ID: ${reportData.buildId}
Build Number: ${reportData.buildNumber}
Timestamp: ${reportData.timestamp}

Test Summary
============
Total Tests: ${reportData.summary.total}
Passed: ${reportData.summary.passed} (${reportData.summary.passRate}%)
Failed: ${reportData.summary.failed} (${reportData.summary.failRate}%)
Skipped: ${reportData.summary.skipped} (${reportData.summary.skipRate}%)
Duration: ${reportData.summary.duration} minutes

Report Details
===============
Recipients: ${recipients}
Report Path: ${reportData.reportPath}
Report Size: ${reportSize} bytes
HTML Report: Attached or available in CI artifacts

View full report attached or in CI artifacts.
    `;

    // Log report information for email integration
    console.log("\n=====================================");
    console.log("📧 TEST REPORT NOTIFICATION");
    console.log("=====================================");
    console.log(`To: ${recipients}`);
    console.log(`Subject: ${subject}`);
    console.log("-------------------------------------");
    console.log(plainTextBody);
    console.log("-------------------------------------");
    console.log(`Report File: ${reportData.reportPath}`);
    console.log(`Report Size: ${(reportSize / 1024).toFixed(2)} KB`);
    console.log("=====================================\n");

    console.log("✅ Report notification details prepared");
    console.log("📝 Integration Instructions:");
    console.log(
      "   • Use EMAIL_RECIPIENTS environment variable to specify recipients",
    );
    console.log(
      "   • Integrate with your email system (SMTP, SendGrid, AWS SES, etc.)",
    );
    console.log("   • Report file available at:", reportData.reportPath);
  } catch (error) {
    console.error(`❌ Error preparing report notification:`, error);
    throw error;
  }
}

/**
 * Parse command line arguments and send report
 */
async function main() {
  const args = process.argv.slice(2);
  const reportPath = args[0];
  const environment = process.env.ENVIRONMENT || "unknown";
  const browser = process.env.BROWSER || "chromium";
  const testTags = process.env.TEST_TAGS || "unknown";
  const buildId = process.env.BUILD_ID || process.env.GITHUB_RUN_ID || "local";
  const buildNumber =
    process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || "local";
  const recipientsEnv = process.env.EMAIL_RECIPIENTS || "";
  const recipients = recipientsEnv.split(",").filter((e) => e.trim());

  if (!reportPath || !fs.existsSync(reportPath)) {
    console.error(`❌ Report file not found: ${reportPath}`);
    process.exit(1);
  }

  // Parse summary from report file name or use defaults
  const reportData: ReportData = {
    environment,
    browser,
    testTags,
    buildId,
    buildNumber,
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      passRate: 0,
      failRate: 0,
      skipRate: 0,
    },
    reportPath,
    recipients,
  };

  try {
    await sendTestReportEmail(reportData);
  } catch (error) {
    console.error("Failed to send report email:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
