import { Reporter, TestCase, TestResult, FullConfig } from '@playwright/test/reporter';
import path from 'path';
import fs from 'fs';
import { generateHtmlReport } from './report-template';

export default class EnhancedReporter implements Reporter {
  private testResults: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped' | 'unknown';
    duration: number;
    error?: string;
    url?: string;
    projectName?: string;
    testType?: 'browser' | 'api' | 'unknown';
    testId?: string;
  }> = [];

  private config: FullConfig | null = null;
  private environment: string = 'Unknown';
  private runningEnvironment: string = 'Unknown';

  onBegin(config: FullConfig) {
    // Store config for later use
    this.config = config;

    // Environment will be extracted from the actual running project in onTestEnd
    this.environment = process.env.ENVIRONMENT || 'Unknown';

  }

  onTestEnd(test: TestCase, result: TestResult) {
    let projectName = test.parent?.project?.name || 'unknown';

    // If project name is generic, try to infer from base URL
    if (projectName === 'project' || projectName === 'unknown') {
      const baseUrl = test.parent?.project()?.use?.baseURL;

      // Try to match base URL to known project configurations
      if (this.config?.projects) {
        const matchingProject = this.config.projects.find((p) => p.use?.baseURL === baseUrl);
        if (matchingProject) {
          projectName = matchingProject.name;
        }
      }
    }

    // Extract environment from actual running project name
    if (projectName !== 'project' && projectName !== 'unknown' && projectName.includes('-')) {
      const envFromProject = projectName.split('-')[0]?.toUpperCase();
      if (envFromProject && this.runningEnvironment === 'Unknown') {
        this.runningEnvironment = envFromProject;
      }
    }

    // Determine test type based on project name
    const testType = projectName.includes('api') ? 'api' : 'browser';

    // Extract URL from project configuration baseURL instead of hardcoded mapping
    const url =
      test.parent?.project()?.use?.baseURL || (testType === 'api' ? 'API Tests' : 'unknown');

    // Generate test ID for linking to Playwright report
    // Playwright uses a hash of the test title path
    const testId = test.id || test.titlePath().join(' > ');

    this.testResults.push({
      name: test.titlePath().join(' > '),
      status: (result.status as 'passed' | 'failed' | 'skipped' | 'unknown') || 'unknown',
      duration: result.duration,
      error: result.error?.message,
      url,
      projectName,
      testType,
      testId,
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onExit(): Promise<void> {
    const total = this.testResults.length;

    // Only generate report if tests actually ran
    if (total === 0) {
      return;
    }

    const passed = this.testResults.filter((t) => t.status === 'passed').length;
    const failed = this.testResults.filter((t) => t.status === 'failed').length;
    const skipped = this.testResults.filter((t) => t.status === 'skipped').length;
    const duration = this.testResults.reduce((sum, t) => sum + t.duration, 0);

    // Extract project type based on what types of tests actually ran
    let projectType = 'Unknown';

    // Separate test results by type first
    const browserTests = this.testResults.filter((t) => t.testType === 'browser');
    const apiTests = this.testResults.filter((t) => t.testType === 'api');

    // Determine project type based on what actually ran
    if (apiTests.length > 0 && browserTests.length === 0) {
      // Only API tests ran
      projectType = 'api';
    } else if (browserTests.length > 0 && apiTests.length === 0) {
      // Only browser tests ran
      projectType = 'chromium';
    } else if (apiTests.length > 0 && browserTests.length > 0) {
      // Mixed tests - use the majority
      projectType = apiTests.length >= browserTests.length ? 'api' : 'chromium';
    } else {
      projectType = 'unknown';
    }

    const summary = {
      total,
      passed,
      failed,
      skipped,
      duration: Math.round(duration / 1000 / 60),
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      failRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      skipRate: total > 0 ? Math.round((skipped / total) * 100) : 0,
      projectType,
      browserTotal: browserTests.length,
      browserPassed: browserTests.filter((t) => t.status === 'passed').length,
      browserFailed: browserTests.filter((t) => t.status === 'failed').length,
      apiTotal: apiTests.length,
      apiPassed: apiTests.filter((t) => t.status === 'passed').length,
      apiFailed: apiTests.filter((t) => t.status === 'failed').length,
    };

    const failedTests = this.testResults.filter((t) => t.status === 'failed');
    const html = generateHtmlReport(summary, failedTests);

    // Write custom report to html-report directory (separate from Playwright's built-in report)
    const reportDir = path.join(process.cwd(), 'html-report');
    const reportPath = path.join(reportDir, 'index.html');

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, html, 'utf8');
    console.log(`\n✅ Custom HTML Report generated: ${reportPath}`);

    // Export summary as JSON for pipeline consumption
    const summaryPath = path.join(reportDir, 'summary.json');
    const summaryData = {
      ...summary,
      environment:
        this.runningEnvironment !== 'Unknown' ? this.runningEnvironment : this.environment,
      timestamp: new Date().toISOString(),
      projects: this.config?.projects?.map((p) => p.name) || [],
      evidencePaths: {
        playwrightReport: 'playwright-report/index.html',
        testResults: 'test-results/',
        screenshots: 'screenshots/',
        videos: 'failed-videos/',
        traces: 'traces/',
      },
    };
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2), 'utf8');
    console.log(`✅ Test summary exported to: ${summaryPath}`);
    console.log(`📊 Report Summary:`);
    console.log(
      `   Environment: ${this.runningEnvironment !== 'Unknown' ? this.runningEnvironment : this.environment}`
    );
    console.log(`   Project Type: ${projectType}`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
  }
}
