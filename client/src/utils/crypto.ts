/**
 * Minimal E2EE for direct messages using the browser's native Web Crypto
 * API (no external crypto library needed). Design:
 *
 *  - Each user generates an ECDH key pair (P-256) once, on first use, and
 *    stores the private key in IndexedDB (non-extractable) while the
 *    public key is published to the server (`identityPublicKey`).
 *  - To message someone, the sender derives a shared AES-GCM key from
 *    (their private key, the recipient's public key) via ECDH, then
 *    encrypts with a fresh random IV per message.
 *  - The server only ever stores/relays `{ encryptedContent, iv }` -
 *    opaque ciphertext it cannot decrypt.
 *
 * This is a pragmatic, real implementation suitable for a campus app; it
 * intentionally does not implement full Signal-style double-ratchet
 * forward secrecy, which would be the natural next hardening step.
 */

const DB_NAME = 'compux-e2ee';
const STORE_NAME = 'keys';
const PRIVATE_KEY_ID = 'identity-private-key';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToBuf(b64: string): ArrayBuffer {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
}

export class E2EEService {
  /** Returns the local identity key pair, generating one on first call. */
  private static async getOrCreateKeyPair(): Promise<CryptoKeyPair> {
    const existing = await idbGet<CryptoKeyPair>(PRIVATE_KEY_ID);
    if (existing) return existing;

    const keyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, [
      'deriveKey',
      'deriveBits',
    ]);
    await idbSet(PRIVATE_KEY_ID, keyPair);
    return keyPair;
  }

  /** The public key to publish to the server so others can message us. Base64-encoded SPKI. */
  static async getPublicKeyBase64(): Promise<string> {
    const { publicKey } = await E2EEService.getOrCreateKeyPair();
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return bufToBase64(exported);
  }

  private static async importRecipientPublicKey(base64: string): Promise<CryptoKey> {
    return crypto.subtle.importKey('spki', base64ToBuf(base64), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  }

  private static async deriveSharedKey(recipientPublicKeyBase64: string): Promise<CryptoKey> {
    const { privateKey } = await E2EEService.getOrCreateKeyPair();
    const recipientKey = await E2EEService.importRecipientPublicKey(recipientPublicKeyBase64);
    return crypto.subtle.deriveKey(
      { name: 'ECDH', public: recipientKey },
      privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(plainText: string, recipientPublicKeyBase64: string): Promise<{ encryptedContent: string; iv: string }> {
    const key = await E2EEService.deriveSharedKey(recipientPublicKeyBase64);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plainText));
    return { encryptedContent: bufToBase64(cipherBuf), iv: bufToBase64(iv.buffer) };
  }

  static async decrypt(encryptedContent: string, iv: string, otherPartyPublicKeyBase64: string): Promise<string> {
    const key = await E2EEService.deriveSharedKey(otherPartyPublicKeyBase64);
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBuf(iv) },
      key,
      base64ToBuf(encryptedContent)
    );
    return new TextDecoder().decode(plainBuf);
  }
}
