import { generateId } from '../utils/dom';

export class Session {
  private id: string;
  private createdAt: number;
  private metadata: Record<string, any>;
  
  constructor(metadata?: Record<string, any>) {
    this.id = generateId('session');
    this.createdAt = Date.now();
    this.metadata = metadata || {};
  }
  
  getId(): string {
    return this.id;
  }
  
  getCreatedAt(): number {
    return this.createdAt;
  }
  
  getMetadata(): Record<string, any> {
    return this.metadata;
  }
  
  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }
  
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      createdAt: this.createdAt,
      metadata: this.metadata
    };
  }
}