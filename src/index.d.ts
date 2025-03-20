// types/index.d.ts
declare module "secretai" {
  export interface ChatSecretOptions {
    base_url?: string;
    model?: string;
    temperature?: number;
    apiKey: string;
    stream?: boolean;
  }

  export type Message = { role: string; content: string } | [string, string];

  export interface StreamingCallbacks {
    onMessage?: (message: any) => void;
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  }

  export class ChatSecret {
    constructor(options: ChatSecretOptions);
    chat(messages: Message[], callbacks?: StreamingCallbacks): Promise<any>;
  }

  // Tool interfaces
  export interface ToolConfig {
    name: string;
    description: string;
    schema: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  }

  export interface StructuredTool {
    name: string;
    description: string;
    schema: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
    func: Function;
    call?: Function;
    _call?: Function;
  }

  // Tool binding integration class
  export class ChatSecretTools {
    constructor(options: ChatSecretOptions);

    // Tool binding methods
    bindTools(tools: StructuredTool[]): ChatSecretTools;
    addTool(tool: StructuredTool): ChatSecretTools;
    createTool(func: Function, config: ToolConfig): StructuredTool;

    // Chat methods
    chat(messages: Message[], callbacks?: StreamingCallbacks): Promise<any>;
  }
}
