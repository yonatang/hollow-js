/**
 * Main handle to dataset state
 * Based on com.netflix.hollow.core.read.engine.HollowReadStateEngine
 */

/**
 * Hollow read state engine - main handle to the current state of a dataset
 */
export class HollowReadStateEngine {
  constructor() {
    this.typeStates = new Map(); // Map<typeName, HollowTypeReadState>
  }

  /**
   * Add a type state
   * @param {HollowTypeReadState} typeState - The type state
   */
  addTypeState(typeState) {
    this.typeStates.set(typeState.getSchema().getName(), typeState);
  }

  /**
   * Get all type names
   * @returns {string[]} Array of type names
   */
  getAllTypes() {
    return Array.from(this.typeStates.keys());
  }

  /**
   * Get a type state by name
   * @param {string} typeName - The type name
   * @returns {HollowTypeReadState} The type state, or undefined
   */
  getTypeState(typeName) {
    return this.typeStates.get(typeName);
  }

  /**
   * Get a schema by name
   * @param {string} typeName - The type name
   * @returns {HollowSchema} The schema, or undefined
   */
  getSchema(typeName) {
    const typeState = this.typeStates.get(typeName);
    return typeState ? typeState.getSchema() : undefined;
  }

  /**
   * Get all schemas
   * @returns {Map<string, HollowSchema>} Map of type name to schema
   */
  getSchemas() {
    const schemas = new Map();
    for (const [name, typeState] of this.typeStates.entries()) {
      schemas.set(name, typeState.getSchema());
    }
    return schemas;
  }

  /**
   * Get number of types
   * @returns {number} Number of types
   */
  getNumTypes() {
    return this.typeStates.size;
  }
}
