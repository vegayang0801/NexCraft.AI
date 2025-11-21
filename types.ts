export enum Role {
  USER = 'user',
  ASSISTANT = 'model'
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  RESEARCH = 'research'
}

export enum GenerationMode {
  COPYWRITING = 'copywriting', // Text generation
  VISUAL = 'visual', // Image generation
  VIDEO = 'video', // Video generation
  RESEARCH = 'research' // Search grounding
}

export interface MediaAttachment {
  mimeType: string;
  data: string; // base64
  name?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  type: ContentType;
  attachments?: MediaAttachment[];
  metadata?: {
    imageUrl?: string;
    videoUrl?: string;
    sources?: Array<{ uri: string; title: string }>;
    thinking?: boolean;
  };
  timestamp: number;
}

export interface ProjectContext {
  brandName: string;
  industry: string;
  tone: string;
}