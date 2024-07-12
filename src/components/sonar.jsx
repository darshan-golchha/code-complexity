import React, { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { marked } from 'marked'; // Import marked library
import '../CSS/sonar.css';

const WebSocketComponent = () => {
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws'); // Replace with your WebSocket URL
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log('Connected');
                stompClient.subscribe('/sonarmetrics/recieved', (message) => {
                    setData(JSON.parse(message.body));
                });
            },
            onDisconnect: () => {
                console.log('Disconnected');
            },
        });

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, []);

    const handleUpload = async () => {
        try {
            setRefreshing(true);
            const response = await fetch('http://localhost:8080/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data })
            });
            console.log('Data', data);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            console.log('Upload successful:', result);
            setRefreshing(false);
        } catch (error) {
            console.error('Upload failed:', error);
            setRefreshing(false);
        }
    };

    // Default values for when data is not present
    const defaultData = {
        masterSeverity: '',
        metrics: {
            component: {
                measures: []
            }
        },
        analytics: {
            reviews: '',
            resultSeverities: '',
            reviewSeverities: ''
        }
    };

    const displayData = data || defaultData;

    const { masterSeverity, metrics, analytics, commitDiff, sonarSeverity,complexity } = displayData;

    // Convert markdown to HTML for code review
    let codeReviewHtml = '';
    if (Array.isArray(analytics.reviews)) {
        // Join array elements with line breaks
        codeReviewHtml = analytics.reviews.join('\n');
    } else if (typeof analytics.reviews === 'string') {
        // Use directly if it's a string
        codeReviewHtml = analytics.reviews;
    }

    // Convert markdown to HTML using marked
    codeReviewHtml = marked(codeReviewHtml);

    return (
        <div className='main'>
            {/* Header with master severity and upload button */}
            <div className='header'>
                <div className='master-severity'>Master Severity: {masterSeverity}</div>
                <button className='upload-button' onClick={handleUpload} disabled={refreshing}>
                    {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
                </button>
            </div>

            {refreshing && <div className='loader'></div>}

            {/* Display metrics */}
            <div className='metric-parent'>
                {metrics.component.measures.length > 0 ? (
                    metrics.component.measures.map((metric, index) => (
                        <div key={index} className='metric-box'>
                            <div className='metric-name'>{metric.metric}</div>
                            <div className='metric-value'>
                                {metric.value} {/* Display value directly if not nested */}
                                {metric.period && metric.period.value} {/* Display nested value if exists */}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className='metric-box'>
                        <div className='metric-name'>No Metrics Available</div>
                    </div>
                )}
            </div>

            {/* Display code review */}
            <div className='code-review' dangerouslySetInnerHTML={{ __html: codeReviewHtml || 'No Reviews Available' }} />

            {/* Displaying Code Diff */}
            <div className='code-diff'>
                <h3 className='diff-header'>
                    {commitDiff ? 'Code Diff' : ''}
                </h3>
                <div className='diff-content'>{commitDiff && commitDiff.diff  || 'No Code Diff Available'}</div>
            </div>

            {/* Display result and review severities */}
            <div className='result-severity'>Historical Severity: {analytics.resultSeverities}</div>
            <div className='review-severity'>Sonar Metrics Severity: {sonarSeverity}</div>
            <div className='review-severity'>Cyclomatic Complexity: {complexity}</div>
            <div className='review-severity'>Code Review Severity: {analytics.reviewSeverities}</div>
        </div>
    );
};

export default WebSocketComponent;
