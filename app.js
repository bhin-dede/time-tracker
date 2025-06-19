const { useState, useEffect, useRef } = React;

function TimeTrackerWatch() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [records, setRecords] = useState([]);
    const [taskName, setTaskName] = useState('');
    const [startTime, setStartTime] = useState(null);
    const intervalRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const savedRecords = localStorage.getItem('timeTrackerRecords');
        if (savedRecords) {
            try {
                setRecords(JSON.parse(savedRecords));
            } catch (error) {
                console.error('기록 불러오기 실패:', error);
            }
        }
    }, []);

    useEffect(() => {
        if (records.length > 0) {
            localStorage.setItem('timeTrackerRecords', JSON.stringify(records));
        }
    }, [records]);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        setIsRunning(true);
        if (!startTime) {
            setStartTime(new Date());
        }
    };

    const handlePause = () => {
        setIsRunning(false);
    };

    const handleReset = () => {
        setIsRunning(false);
        setTime(0);
        setStartTime(null);
    };

    const handleSave = () => {
        if (time > 0 && startTime) {
            const endTime = new Date();
            const newRecord = {
                id: Date.now(),
                taskName: taskName || '작업',
                duration: time,
                startTime: startTime.toLocaleString('ko-KR'),
                endTime: endTime.toLocaleString('ko-KR'),
                timestamp: new Date().toLocaleString('ko-KR')
            };
            setRecords(prev => [newRecord, ...prev]);
            setTaskName('');
            handleReset();
        }
    };

    const handleDeleteRecord = (id) => {
        const updatedRecords = records.filter(record => record.id !== id);
        setRecords(updatedRecords);
        if (updatedRecords.length === 0) {
            localStorage.removeItem('timeTrackerRecords');
        }
    };

    const handleClearAllRecords = () => {
        if (window.confirm('모든 기록을 삭제하시겠습니까?')) {
            setRecords([]);
            localStorage.removeItem('timeTrackerRecords');
        }
    };

    const handleInstallApp = async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setShowInstallPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const getTotalTime = () => {
        return records.reduce((total, record) => total + record.duration, 0);
    };

    return React.createElement('div', { className: 'max-w-md mx-auto bg-gray-900 text-white min-h-screen' }, [
        showInstallPrompt && React.createElement('div', { 
            key: 'install-banner',
            className: 'bg-green-600 p-3 text-center text-sm' 
        }, [
            React.createElement('span', { 
                key: 'text',
                className: 'mr-2' 
            }, '📱 홈 화면에 추가하여 앱처럼 사용하세요!'),
            React.createElement('button', { 
                key: 'install-btn',
                onClick: handleInstallApp,
                className: 'bg-white text-green-600 px-3 py-1 rounded text-xs font-semibold mr-2'
            }, '설치'),
            React.createElement('button', { 
                key: 'close-btn',
                onClick: () => setShowInstallPrompt(false),
                className: 'text-green-100 text-xs'
            }, '✕')
        ]),

        React.createElement('div', { 
            key: 'header',
            className: 'bg-blue-600 p-4 text-center' 
        }, [
            React.createElement('div', { 
                key: 'title-row',
                className: 'flex items-center justify-center gap-2 mb-2' 
            }, [
                React.createElement('span', { key: 'icon' }, '🕐'),
                React.createElement('h1', { 
                    key: 'title',
                    className: 'text-xl font-bold' 
                }, '시간 기록 워치')
            ]),
            React.createElement('div', { 
                key: 'time',
                className: 'text-sm opacity-90' 
            }, currentTime.toLocaleString('ko-KR'))
        ]),

        React.createElement('div', { 
            key: 'main',
            className: 'p-6 text-center' 
        }, [
            React.createElement('div', { 
                key: 'timer-box',
                className: 'bg-gray-800 rounded-2xl p-8 mb-6' 
            }, [
                React.createElement('div', { 
                    key: 'timer-display',
                    className: 'text-6xl font-mono font-bold mb-4 text-blue-400' 
                }, formatTime(time)),
                
                React.createElement('input', { 
                    key: 'task-input',
                    type: 'text',
                    placeholder: '작업명 입력...',
                    value: taskName,
                    onChange: (e) => setTaskName(e.target.value),
                    className: 'w-full bg-gray-700 text-white px-4 py-2 rounded-lg mb-4 text-center',
                    style: { 
                        textAlign: 'center',
                        backgroundColor: '#374151',
                        color: 'white',
                        width: '100%',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        border: 'none',
                        outline: 'none'
                    }
                }),

                React.createElement('div', { 
                    key: 'controls',
                    className: 'flex justify-center gap-3' 
                }, [
                    !isRunning ? 
                        React.createElement('button', { 
                            key: 'start-btn',
                            onClick: handleStart,
                            className: 'flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-full transition-colors'
                        }, ['▶️', ' 시작']) :
                        React.createElement('button', { 
                            key: 'pause-btn',
                            onClick: handlePause,
                            className: 'flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-full transition-colors'
                        }, ['⏸️', ' 일시정지']),
                    
                    React.createElement('button', { 
                        key: 'save-btn',
                        onClick: handleSave,
                        disabled: time === 0,
                        className: `flex items-center gap-2 px-6 py-3 rounded-full transition-colors ${
                            time > 0 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`
                    }, ['💾', ' 저장']),
                    
                    React.createElement('button', { 
                        key: 'reset-btn',
                        onClick: handleReset,
                        disabled: time === 0,
                        className: `flex items-center gap-2 px-4 py-3 rounded-full transition-colors ${
                            time > 0 
                                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`
                    }, '🔄')
                ])
            ])
        ]),

        React.createElement('div', { 
            key: 'records',
            className: 'px-4 pb-6' 
        }, [
            React.createElement('div', { 
                key: 'records-header',
                className: 'flex justify-between items-center mb-4' 
            }, [
                React.createElement('h2', { 
                    key: 'records-title',
                    className: 'text-lg font-semibold' 
                }, '시간 기록'),
                React.createElement('div', { 
                    key: 'records-controls',
                    className: 'flex items-center gap-3' 
                }, records.length > 0 ? [
                    React.createElement('div', { 
                        key: 'total-time',
                        className: 'text-sm text-blue-400' 
                    }, `총 시간: ${formatTime(getTotalTime())}`),
                    React.createElement('button', { 
                        key: 'clear-all',
                        onClick: handleClearAllRecords,
                        className: 'clear-all-btn'
                    }, '전체삭제')
                ] : [])
            ]),

            records.length === 0 ? 
                React.createElement('div', { 
                    key: 'no-records',
                    className: 'text-center text-gray-500 py-8' 
                }, '아직 기록된 시간이 없습니다') :
                React.createElement('div', { 
                    key: 'records-list',
                    className: 'space-y-3' 
                }, records.map((record) => 
                    React.createElement('div', { 
                        key: record.id,
                        className: 'bg-gray-800 rounded-lg p-4' 
                    }, [
                        React.createElement('div', { 
                            key: 'record-content',
                            className: 'flex justify-between items-start' 
                        }, [
                            React.createElement('div', { 
                                key: 'record-info',
                                className: 'flex-1' 
                            }, [
                                React.createElement('div', { 
                                    key: 'task-name',
                                    className: 'font-semibold text-blue-400 mb-1' 
                                }, record.taskName),
                                React.createElement('div', { 
                                    key: 'duration',
                                    className: 'text-2xl font-mono font-bold mb-2' 
                                }, formatTime(record.duration)),
                                React.createElement('div', { 
                                    key: 'times',
                                    className: 'text-sm text-gray-400 space-y-1' 
                                }, [
                                    React.createElement('div', { key: 'start' }, `시작: ${record.startTime}`),
                                    React.createElement('div', { key: 'end' }, `종료: ${record.endTime}`)
                                ])
                            ]),
                            React.createElement('button', { 
                                key: 'delete-btn',
                                onClick: () => handleDeleteRecord(record.id),
                                className: 'delete-btn'
                            }, '🗑️')
                        ])
                    ])
                ))
        ])
    ]);
}

ReactDOM.render(React.createElement(TimeTrackerWatch), document.getElementById('app'));