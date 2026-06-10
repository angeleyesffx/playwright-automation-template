/**
 * HTML Report Template
 * Generates beautiful test execution report HTML
 */

export function generateHtmlReport(
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    passRate: number;
    failRate: number;
    skipRate: number;
  },
  failedTests: Array<{
    name: string;
    status: string;
    duration: number;
    error?: string;
    testId?: string;
  }>
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #667eea;
            --primary-dark: #764ba2;
            --success: #27ae60;
            --danger: #e74c3c;
            --warning: #f39c12;
            --info: #3498db;
            --light: #ecf0f1;
            --dark: #2c3e50;
            --text: #34495e;
            --border: #bdc3c7;
        }

        html, body {
            height: 100%;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: white;
            min-height: 100vh;
            padding: 20px;
            color: var(--text);
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 500px;
            height: 500px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }

        .header-content {
            position: relative;
            z-index: 1;
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.95;
            margin-bottom: 10px;
        }

        .timestamp {
            font-size: 0.95em;
            opacity: 0.85;
        }

        .header-actions {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }

        .pipeline-button {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.95em;
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.4);
            cursor: pointer;
            backdrop-filter: blur(10px);
        }

        .pipeline-button:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.6);
            transform: translateY(-2px);
        }

        .content {
            padding: 50px 40px;
        }

        .section {
            margin-bottom: 50px;
        }

        .section-title {
            font-size: 1.8em;
            color: var(--dark);
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 2px solid var(--primary);
            padding-bottom: 15px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: white;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 2px solid transparent;
            border-top: 4px solid var(--info);
            transition: all 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .stat-card.passed { 
            border-top-color: var(--success);
            background: linear-gradient(135deg, rgba(39, 174, 96, 0.1) 0%, rgba(39, 174, 96, 0.05) 100%);
        }

        .stat-card.failed { 
            border-top-color: var(--danger);
            background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(231, 76, 60, 0.05) 100%);
        }

        .stat-card.skipped { 
            border-top-color: var(--warning);
            background: linear-gradient(135deg, rgba(243, 156, 18, 0.1) 0%, rgba(243, 156, 18, 0.05) 100%);
        }

        .stat-card.total {
            border-top-color: var(--info);
            background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(52, 152, 219, 0.05) 100%);
        }

        .stat-value {
            font-size: 3em;
            font-weight: 700;
            margin: 15px 0;
            color: var(--dark);
        }

        .stat-card.passed .stat-value { color: var(--success); }
        .stat-card.failed .stat-value { color: var(--danger); }
        .stat-card.skipped .stat-value { color: var(--warning); }
        .stat-card.total .stat-value { color: var(--info); }

        .stat-label {
            font-size: 0.95em;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

        .summary {
            background: linear-gradient(135deg, #f8f9fa 0%, #e8eef2 100%);
            padding: 30px;
            border-radius: 8px;
            border-left: 4px solid var(--info);
            margin: 30px 0;
        }

        .summary h3 {
            color: var(--dark);
            margin-bottom: 15px;
            font-size: 1.3em;
        }

        .summary p {
            color: var(--text);
            line-height: 1.8;
            margin: 10px 0;
        }

        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin: 5px 10px 5px 0;
            letter-spacing: 0.5px;
        }

        .badge.passed {
            background: #d5f4e6;
            color: var(--success);
        }

        .badge.failed {
            background: #fadbd8;
            color: var(--danger);
        }

        .badge.skipped {
            background: #fdeaa8;
            color: var(--warning);
        }

        .failed-tests {
            margin-top: 50px;
        }

        .failed-tests h2 {
            color: var(--dark);
            margin-bottom: 25px;
            border-bottom: 2px solid var(--danger);
            padding-bottom: 10px;
            font-size: 1.5em;
        }

        .test-item {
            background: #fff5f5;
            border: 2px solid #fadbd8;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
            border-left: 5px solid var(--danger);
        }

        .test-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #c0392b;
            margin-bottom: 15px;
        }

        .test-error {
            background: #fdeef0;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid var(--danger);
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #922b21;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 15px 0;
            line-height: 1.5;
        }

        .test-actions {
            margin-top: 15px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .test-action-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(231, 76, 60, 0.1);
            color: #c0392b;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.85em;
            transition: all 0.3s ease;
            border: 1px solid rgba(231, 76, 60, 0.3);
        }

        .test-action-button:hover {
            background: rgba(231, 76, 60, 0.2);
            border-color: rgba(231, 76, 60, 0.5);
            transform: translateY(-2px);
        }

        .no-failed {
            text-align: center;
            padding: 40px;
            color: var(--success);
        }

        .no-failed p {
            font-size: 1.3em;
            margin: 10px 0;
        }

        .footer {
            background: var(--dark);
            color: white;
            padding: 30px 40px;
            text-align: center;
            font-size: 0.9em;
            opacity: 0.8;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2em;
            }

            .content {
                padding: 30px 20px;
            }

            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .stat-value {
                font-size: 2em;
            }

            .header-actions {
                flex-direction: column;
                align-items: center;
            }

            .pipeline-button {
                width: 100%;
                max-width: 300px;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>🧪 Test Execution Report</h1>
                <p>Comprehensive test results with detailed analytics</p>
                <div class="timestamp">Generated on ${new Date().toLocaleString()}</div>
                <div class="header-actions">
                    <a href="playwright-report/index.html" class="pipeline-button" target="_blank">
                        <span>📊</span>
                        <span>View Playwright Report</span>
                    </a>
                    <a href="test-results/" class="pipeline-button" target="_blank">
                        <span>📁</span>
                        <span>View Test Results</span>
                    </a>
                    <a href="screenshots/" class="pipeline-button" target="_blank">
                        <span>📸</span>
                        <span>View Screenshots</span>
                    </a>
                    <a href="failed-videos/" class="pipeline-button" target="_blank">
                        <span>🎥</span>
                        <span>View Videos</span>
                    </a>
                    <a href="traces/" class="pipeline-button" target="_blank">
                        <span>🔍</span>
                        <span>View Traces</span>
                    </a>
                    <button class="pipeline-button" onclick="openAzurePipeline()">
                        <span>🔗</span>
                        <span>View in Azure Pipeline</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <div class="stats-grid">
                    <div class="stat-card total">
                        <div class="stat-label">Total Tests</div>
                        <div class="stat-value">${summary.total}</div>
                    </div>
                    <div class="stat-card passed">
                        <div class="stat-label">✓ Passed</div>
                        <div class="stat-value">${summary.passed}</div>
                    </div>
                    <div class="stat-card failed">
                        <div class="stat-label">✗ Failed</div>
                        <div class="stat-value">${summary.failed}</div>
                    </div>
                    <div class="stat-card skipped">
                        <div class="stat-label">⊝ Skipped</div>
                        <div class="stat-value">${summary.skipped}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="summary">
                    <h3>📋 Summary</h3>
                    <p>Out of <strong>${summary.total}</strong> total tests:</p>
                    <p>
                        <span class="badge passed">✓ ${summary.passed} Passed (${summary.passRate}%)</span>
                        <span class="badge failed">✗ ${summary.failed} Failed (${summary.failRate}%)</span>
                        <span class="badge skipped">⊝ ${summary.skipped} Skipped (${summary.skipRate}%)</span>
                    </p>
                    <p style="margin-top: 15px; color: #7f8c8d;">
                        <strong>⏱️ Total Duration:</strong> ${summary.duration} minutes
                    </p>
                </div>
            </div>

            ${
              failedTests.length > 0
                ? `
            <div class="section failed-tests">
                <h2 class="section-title">❌ Failed Tests (${failedTests.length})</h2>
                ${failedTests
                  .map((test, idx) => {
                    const testId = test.testId || encodeURIComponent(test.name);
                    const playwrightLink = test.testId
                      ? `playwright-report/index.html#?testId=${testId}`
                      : `playwright-report/index.html`;
                    return `
                    <div class="test-item">
                        <div class="test-title">#${idx + 1}: ${test.name}</div>
                        ${test.error ? `<div class="test-error">${test.error}</div>` : '<p style="color: #888;">No error details available</p>'}
                        <div class="test-actions">
                            <a href="${playwrightLink}" class="test-action-button" target="_blank">
                                <span>📊</span>
                                <span>View in Playwright Report</span>
                            </a>
                            <a href="test-results/" class="test-action-button" target="_blank">
                                <span>📁</span>
                                <span>View Test Results</span>
                            </a>
                            <a href="screenshots/" class="test-action-button" target="_blank">
                                <span>📸</span>
                                <span>View Screenshots</span>
                            </a>
                            <a href="failed-videos/" class="test-action-button" target="_blank">
                                <span>🎥</span>
                                <span>View Videos</span>
                            </a>
                        </div>
                    </div>
                `;
                  })
                  .join('')}
            </div>
            `
                : `
            <div class="section">
                <div class="no-failed">
                    <p>✅ All tests passed!</p>
                    <p>No failed tests to report.</p>
                </div>
            </div>
            `
            }
        </div>

        <div class="footer">
            <p>Test Execution Report | Generated on ${new Date().toLocaleString()}</p>
            <p>Powered by Playwright QA Automation</p>
        </div>
    </div>

    <script>
        function openAzurePipeline() {
            const buildId = window.location.hash.substring(1) || 'your-build-id';
            const azurePipelineUrl = 'https://dev.azure.com/_build/results?buildId=' + buildId + '&view=artifacts';
            window.open(azurePipelineUrl, '_blank');
        }
    </script>
</body>
</html>`;
}
