// تشفير وفك تشفير الرسائل على متصفح العميل (Client-Side E2EE)

export async function generateAESKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(text: string, key: CryptoKey) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(text)
  );

  return {
    encryptedContent: Buffer.from(encrypted).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
  };
}

export async function decryptMessage(
  encryptedContentBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const encrypted = Buffer.from(encryptedContentBase64, 'base64');
  const iv = Buffer.from(ivBase64, 'base64');

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
