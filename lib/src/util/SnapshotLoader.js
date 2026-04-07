/**
 * HTTP/fetch wrapper for loading snapshots
 */

/**
 * Snapshot loader utility
 */
export class SnapshotLoader {
  /**
   * Load a snapshot from a URL
   * @param {string} url - The URL to load from
   * @returns {Promise<ArrayBuffer>} The snapshot data
   */
  static async loadFromUrl(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load snapshot: ${response.status} ${response.statusText}`);
    }

    // Check if response is gzip-encoded
    const contentEncoding = response.headers.get('content-encoding');
    const isGzipped = contentEncoding && contentEncoding.toLowerCase().includes('gzip');

    if (isGzipped) {
      // Decompress gzip data
      return await SnapshotLoader.decompressGzip(response);
    } else {
      return await response.arrayBuffer();
    }
  }

  /**
   * Decompress gzip-encoded response data
   * @param {Response} response - The fetch response
   * @returns {Promise<ArrayBuffer>} The decompressed data
   */
  static async decompressGzip(response) {
    // Modern browsers support DecompressionStream
    if (typeof DecompressionStream !== 'undefined') {
      const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
      const decompressedResponse = new Response(stream);
      return await decompressedResponse.arrayBuffer();
    } else {
      // Fallback: throw error if DecompressionStream is not available
      throw new Error('Gzip decompression not supported in this browser. Please use uncompressed snapshots or upgrade your browser.');
    }
  }

  /**
   * Load a snapshot from a File object
   * @param {File} file - The file to load
   * @returns {Promise<ArrayBuffer>} The snapshot data
   */
  static async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }
}
