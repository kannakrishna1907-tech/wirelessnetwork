import { BlockchainBlock } from '../types';

/**
 * Standard SHA-256 implementation in pure TypeScript
 * Ensures deterministic, synchronous, and cryptographic hashing across all environments.
 */
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const compositeClear = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ];

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - ((i % 4) * 8));
  }

  for (let b = 0; b < words[lengthProperty]; b += 16) {
    const w = compositeClear.slice(0);
    for (i = 0; i < 16; i++) {
      w[i] = words[b + i] | 0;
    }
    for (i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = hash[0];
    let bReg = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & bReg) ^ (a & c) ^ (bReg & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = bReg;
      bReg = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + bReg) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >> (j * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

export class BlockchainManager {
  private chain: BlockchainBlock[] = [];

  constructor() {
    this.createGenesisBlock();
  }

  public getChain(): BlockchainBlock[] {
    return [...this.chain];
  }

  public calculateHash(
    index: number,
    timestamp: string,
    nodeId: string,
    eventType: string,
    payload: any,
    previousHash: string
  ): string {
    const serializedPayload = JSON.stringify(payload);
    const rawData = `${index}:${timestamp}:${nodeId}:${eventType}:${serializedPayload}:${previousHash}`;
    return sha256(rawData);
  }

  private createGenesisBlock(): void {
    const timestamp = new Date().toISOString();
    const payload = {
      notes: 'Genesis Block - Enhanced Cognitive Wireless Sensor Network initialized with SHA-256 integrity ledger.',
    };
    const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const hash = this.calculateHash(0, timestamp, 'Base Station', 'GENESIS', payload, prevHash);

    const genesis: BlockchainBlock = {
      index: 0,
      timestamp,
      nodeId: 'Base Station',
      eventType: 'GENESIS',
      payload,
      previousHash: prevHash,
      hash,
      isValid: true,
      isTampered: false,
    };

    this.chain = [genesis];
  }

  public addBlock(
    nodeId: string,
    eventType: BlockchainBlock['eventType'],
    payload: BlockchainBlock['payload']
  ): BlockchainBlock {
    const prevBlock = this.chain[this.chain.length - 1];
    const index = this.chain.length;
    const timestamp = new Date().toISOString();
    const previousHash = prevBlock.hash;
    const hash = this.calculateHash(index, timestamp, nodeId, eventType, payload, previousHash);

    const newBlock: BlockchainBlock = {
      index,
      timestamp,
      nodeId,
      eventType,
      payload,
      previousHash,
      hash,
      isValid: true,
      isTampered: false,
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  public verifyBlockchain(): {
    isValid: boolean;
    corruptedIndex: number | null;
    reason?: string;
    verifiedBlocks: number;
  } {
    for (let i = 0; i < this.chain.length; i++) {
      const current = this.chain[i];

      // Genesis check
      if (i === 0) {
        const expectedHash = this.calculateHash(
          current.index,
          current.timestamp,
          current.nodeId,
          current.eventType,
          current.payload,
          current.previousHash
        );
        if (current.hash !== expectedHash) {
          current.isValid = false;
          return {
            isValid: false,
            corruptedIndex: 0,
            reason: `Genesis block hash mismatch (Hash tampered)`,
            verifiedBlocks: 0,
          };
        }
        current.isValid = true;
        continue;
      }

      const prev = this.chain[i - 1];

      // Previous hash link check
      if (current.previousHash !== prev.hash) {
        current.isValid = false;
        return {
          isValid: false,
          corruptedIndex: i,
          reason: `Block #${current.index} previousHash (${current.previousHash.slice(0, 10)}...) does not match Block #${prev.index} hash (${prev.hash.slice(0, 10)}...)`,
          verifiedBlocks: i,
        };
      }

      // Re-calculate hash check
      const recomputedHash = this.calculateHash(
        current.index,
        current.timestamp,
        current.nodeId,
        current.eventType,
        current.payload,
        current.previousHash
      );

      if (current.hash !== recomputedHash) {
        current.isValid = false;
        return {
          isValid: false,
          corruptedIndex: i,
          reason: `Block #${current.index} data payload was altered! Stored hash does not match computed SHA-256 hash.`,
          verifiedBlocks: i,
        };
      }

      current.isValid = true;
    }

    return {
      isValid: true,
      corruptedIndex: null,
      reason: `All ${this.chain.length} blocks verified with cryptographic SHA-256 chain integrity.`,
      verifiedBlocks: this.chain.length,
    };
  }

  /**
   * Intentionally tamper with a past block's payload to demonstrate tamper detection
   */
  public tamperBlock(index?: number): {
    tamperedIndex: number;
    originalContent: string;
    falsifiedContent: string;
  } {
    // Pick target block (default to latest or middle block)
    const targetIdx = index !== undefined 
      ? Math.max(0, Math.min(index, this.chain.length - 1))
      : (this.chain.length > 1 ? Math.floor(this.chain.length / 2) : 0);

    const block = this.chain[targetIdx];
    const originalContent = JSON.stringify(block.payload);

    // Tamper payload (e.g., falsify sensor voltage or event reason)
    block.payload = {
      ...block.payload,
      eventReason: 'UNAUTHORIZED_MODIFICATION_ATTACK_SIMULATED',
      notes: 'MALICIOUS_DATA_INJECTION: Voltage falsified to 4.20V',
    };
    block.isTampered = true;
    block.isValid = false;

    const falsifiedContent = JSON.stringify(block.payload);

    return {
      tamperedIndex: targetIdx,
      originalContent,
      falsifiedContent,
    };
  }

  /**
   * Restore/re-mine chain to repair tampered hashes
   */
  public repairChain(): void {
    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      if (i > 0) {
        block.previousHash = this.chain[i - 1].hash;
      }
      block.hash = this.calculateHash(
        block.index,
        block.timestamp,
        block.nodeId,
        block.eventType,
        block.payload,
        block.previousHash
      );
      block.isTampered = false;
      block.isValid = true;
    }
  }

  public reset(): void {
    this.createGenesisBlock();
  }
}
