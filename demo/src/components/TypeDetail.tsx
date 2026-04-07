import { useState, useEffect } from 'react';
import { GenericHollowObject, TypeIterator, RecordStringifier, SchemaType } from '@yonatang/hollow-js';

interface TypeDetailProps {
  stateEngine: any;
  typeName: string | null;
}

export function TypeDetail({ stateEngine, typeName }: TypeDetailProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (typeName && stateEngine) {
      const typeState = stateEngine.getTypeState(typeName);
      const allRecords = TypeIterator.toArray(typeState, stateEngine);
      setRecords(allRecords);
      setSelectedRecord(null);
      setCurrentPage(0);
    }
  }, [typeName, stateEngine]);

  if (!typeName) {
    return (
      <div className="type-detail empty">
        <p>Select a type to view details</p>
      </div>
    );
  }

  const typeState = stateEngine.getTypeState(typeName);
  const schema = typeState.getSchema();
  const schemaType = schema.getSchemaType();

  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, records.length);
  const pageRecords = records.slice(startIndex, endIndex);
  const totalPages = Math.ceil(records.length / pageSize);

  const renderSchemaInfo = () => {
    return (
      <div className="schema-info">
        <div className="schema-row">
          <strong>Type:</strong> {schemaType}
        </div>
        <div className="schema-row">
          <strong>Records:</strong> {records.length}
        </div>

        {schemaType === SchemaType.OBJECT && (
          <>
            <div className="schema-row">
              <strong>Fields:</strong>
            </div>
            {Array.from({ length: schema.numFields() }, (_, i) => {
              const fieldName = schema.getFieldName(i);
              const fieldType = schema.getFieldType(i);
              const refType = schema.getReferencedType(i);
              return (
                <div key={i} className="field-row">
                  <span className="field-name">{fieldName}</span>
                  <span className="field-type">
                    {fieldType}{refType ? ` → ${refType}` : ''}
                  </span>
                </div>
              );
            })}
          </>
        )}

        {schemaType === SchemaType.LIST && (
          <div className="schema-row">
            <strong>Element Type:</strong> {schema.getElementType()}
          </div>
        )}

        {schemaType === SchemaType.SET && (
          <div className="schema-row">
            <strong>Element Type:</strong> {schema.getElementType()}
          </div>
        )}

        {schemaType === SchemaType.MAP && (
          <>
            <div className="schema-row">
              <strong>Key Type:</strong> {schema.getKeyType()}
            </div>
            <div className="schema-row">
              <strong>Value Type:</strong> {schema.getValueType()}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderRecordDetail = (record: any) => {
    try {
      const json = RecordStringifier.toJSON(record, true);
      return (
        <div className="record-detail">
          <h3>Record #{record.getOrdinal()}</h3>
          <pre>{json}</pre>
        </div>
      );
    } catch (e: any) {
      return (
        <div className="record-detail error">
          <h3>Record #{record.getOrdinal()}</h3>
          <p>Error rendering record: {e.message}</p>
        </div>
      );
    }
  };

  return (
    <div className="type-detail">
      <h2>{typeName}</h2>

      {renderSchemaInfo()}

      <h3 className="records-heading">
        Records ({startIndex + 1}-{endIndex} of {records.length})
      </h3>

      {pageRecords.length === 0 ? (
        <p className="no-records">No records to display</p>
      ) : (
        <>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <span>Page {currentPage + 1} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}

          <div className="records-container">
            <div className="record-list">
              {pageRecords.map((record) => {
                const ordinal = record.getOrdinal();
                return (
                  <div
                    key={ordinal}
                    className={`record-item ${selectedRecord === ordinal ? 'active' : ''}`}
                    onClick={() => setSelectedRecord(ordinal)}
                  >
                    Record #{ordinal}
                  </div>
                );
              })}
            </div>

            <div className="record-detail-panel">
              {selectedRecord !== null ? (
                renderRecordDetail(records.find(r => r.getOrdinal() === selectedRecord))
              ) : (
                <div className="no-selection">
                  <p>Select a record to view details</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
