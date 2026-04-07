import {useState} from 'react';
import {HollowConsumer, HollowReadStateEngine, TypeIterator} from '@yonatang/hollow-js';
import {TypeList} from './TypeList';
import {TypeDetail} from './TypeDetail';
import './HollowBrowser.css';

export function HollowBrowser() {
    console.log('HollowConsumer', HollowConsumer)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stateEngine, setStateEngine] = useState<HollowReadStateEngine | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [typeStats, setTypeStats] = useState<Map<string, number>>(new Map());

    const loadSnapshot = async () => {
        try {
            setLoading(true);
            setError(null);

            const consumer = new HollowConsumer();
            // Load snapshot from public directory
            // const engine = await consumer.loadSnapshot('/binaries/snapshots/snapshot-20260322184645001');
            // const engine = await consumer.loadSnapshot('https://datasets.vip.ebay.com/v1/dataset/category_structure/2/20260226045439001/snapshot');
            // const engine: HollowReadStateEngine = await consumer.loadSnapshot('/binaries/category_structure/snapshot-20260226045439001');
            // const engine = await consumer.loadSnapshot('/binaries/snapshots/snapshot-20260325055312001');
            const engine = await consumer.loadSnapshot('/binaries/snapshots/snapshot-20260405040910001');

            setStateEngine(engine);

            // Calculate type statistics
            const stats = new Map<string, number>();
            engine.getAllTypes().forEach((typeName: string) => {
                const typeState = engine.getTypeState(typeName);
                const count = TypeIterator.count(typeState);
                stats.set(typeName, count);
            });
            setTypeStats(stats);

            setLoading(false);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            setError(`Failed to load snapshot: ${message}`);
            setLoading(false);
            console.error(e);
        }
    };

    return (
        <div className="hollow-browser">
            <header className="browser-header">
                <h1>🎬 Hollow.js Browser</h1>
                <p className="subtitle">Interactive viewer for Netflix Hollow snapshots</p>
            </header>

            <div className="browser-controls">
                <button
                    className="load-btn"
                    onClick={loadSnapshot}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Load Snapshot'}
                </button>
                {stateEngine && (
                    <span className="status">
            Loaded {stateEngine.getNumTypes()} types
          </span>
                )}
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {loading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading snapshot...</p>
                </div>
            )}

            {stateEngine && !loading && (
                <div className="browser-content">
                    <TypeList
                        types={stateEngine.getAllTypes()}
                        typeStats={typeStats}
                        selectedType={selectedType}
                        onSelectType={setSelectedType}
                    />
                    <TypeDetail
                        stateEngine={stateEngine}
                        typeName={selectedType}
                    />
                </div>
            )}
        </div>
    );
}
