interface TypeListProps {
  types: string[];
  typeStats: Map<string, number>;
  selectedType: string | null;
  onSelectType: (typeName: string) => void;
}

export function TypeList({ types, typeStats, selectedType, onSelectType }: TypeListProps) {
  const sortedTypes = [...types].sort();

  return (
    <div className="type-list">
      <h3>Types</h3>
      <ul>
        {sortedTypes.map(typeName => (
          <li
            key={typeName}
            className={selectedType === typeName ? 'active' : ''}
            onClick={() => onSelectType(typeName)}
          >
            <span className="type-name">{typeName}</span>
            <span className="type-count">{typeStats.get(typeName) || 0} records</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
