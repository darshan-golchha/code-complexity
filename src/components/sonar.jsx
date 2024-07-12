import React, { useState } from 'react';
import { marked } from 'marked';
import '../CSS/sonar.css';

const WebSocketComponent = () => {
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const important = ['minor_violations', 'code_smells', 'reliability_rating', 'new_code_smells', 'new_vulnerabilities', 'sqale_index', 'violations', 'security_rating', 'critical_violations', 'vulnerabilities', 'new_violations', 'bugs', 'major_violations', 'new_bugs'];
    const isImportant = (metricName) => important.includes(metricName);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await new Promise(resolve => setTimeout(resolve, 4000)); // Simulate a delay of 4 seconds
            const response = await fetch('/data.json');
            const jsonData = await response.json();
            setData(jsonData);
        } catch (error) {
            console.error('Failed to load local data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const defaultData = {
        masterSeverity: '0',
        metrics: { component: { measures: [] } },
        analytics: { reviews: '', resultSeverities: '0', reviewSeverities: '0' },
        sonarSeverity: '0',
        complexity: '0',
    };

    const { masterSeverity, metrics, analytics, commitDiff, sonarSeverity, complexity } = data || defaultData;

    const codeReviewHtml = marked(Array.isArray(analytics.reviews) ? analytics.reviews.join('\n') : analytics.reviews || '');

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <h1 className="sidebar__title">BuildPiper RiskGuard</h1>
                <nav className="sidebar__nav">
                    <a href="#metrics" className="sidebar__link">Metrics</a>
                    <a href="#code-review" className="sidebar__link">Code Review</a>
                    <a href="#code-diff" className="sidebar__link">Code Diff</a>
                    <a href="#severities" className="sidebar__link">Severities</a>
                </nav>
                <button className="refresh-button" onClick={handleRefresh} disabled={refreshing}>
                    {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
                </button>
            </aside>

            <main className="main-content">
                <header className="main-header">
                    <div className="severity-gauge" data-severity={masterSeverity}>
                        <svg viewBox="0 0 36 36" className="circular-chart">
                            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="circle" strokeDasharray={`${masterSeverity * 25}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <text x="18" y="20.35" className="percentage">{parseFloat(masterSeverity).toFixed(2)}</text>
                        </svg>
                        <span>Master Severity</span>
                    </div>
                    {refreshing && <div className="loader"></div>}
                </header>

                <section id="metrics" className="metrics-section">
                    <h2 className="section-title">Key Metrics</h2>
                    <div className="metrics-grid">
                        {metrics.component.measures.map((metric, index) => (
                            <div
                                key={index}
                                className={`metric-card ${isImportant(metric.metric) ? 'important-metric' : ''}`}
                            >
                                <h3 className="metric-card__name">
                                    {metric.metric}
                                    {isImportant(metric.metric) && <span className="important-indicator">★</span>}
                                </h3>
                                <p className="metric-card__value">{metric.value}{metric.period && metric.period.value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="code-review" className="code-review-section">
                    <h2 className="section-title">Code Review</h2>
                    <div className="code-review" dangerouslySetInnerHTML={{ __html: codeReviewHtml || 'No Reviews Available' }} />
                </section>

                {commitDiff && (
                    <section id="code-diff" className="code-diff-section">
                        <h2 className="section-title">Code Diff</h2>
                        <pre className="code-diff">{commitDiff.diff}</pre>
                    </section>
                )}

                <section id="severities" className="severities-section">
                    <h2 className="section-title">Severities</h2>
                    <div className="severities-grid">
                        <div className="severity-card">
                            <h3 className="severity-card__title">Historical</h3>
                            <p className="severity-card__value">{parseFloat(analytics.resultSeverities).toFixed(2)}</p>
                        </div>
                        <div className="severity-card">
                            <h3 className="severity-card__title">Sonar Metrics</h3>
                            <p className="severity-card__value">{parseFloat(sonarSeverity).toFixed(2)}</p>
                        </div>
                        <div className="severity-card">
                            <h3 className="severity-card__title">Cyclomatic Complexity</h3>
                            <p className="severity-card__value">{complexity}</p>
                        </div>
                        <div className="severity-card">
                            <h3 className="severity-card__title">Code Review</h3>
                            <p className="severity-card__value">{analytics.reviewSeverities}</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default WebSocketComponent;
