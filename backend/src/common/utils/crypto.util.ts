import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/** 加解密工具类 - 用于敏感配置数据的安全存储 */
export class CryptoUtil {
  private static getKey(secret: string): Buffer {
    return crypto.scryptSync(secret, 'salt', 32); // 派生32字节密钥
  }

  /** 加密JSON对象 */
  static encrypt(data: Record<string, any>, secret: string): string {
    const key = this.getKey(secret);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const jsonStr = JSON.stringify(data);
    let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`; // iv:authTag:密文
  }

  /** 解密为JSON对象 */
  static decrypt(encryptedData: string, secret: string): Record<string, any> {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
      return JSON.parse(encryptedData); // 兼容未加密的旧数据
    }

    const key = this.getKey(secret);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /** 检查数据是否已加密 */
  static isEncrypted(data: string): boolean {
    if (typeof data !== 'string') return false;
    const parts = data.split(':');
    return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
  }
}
