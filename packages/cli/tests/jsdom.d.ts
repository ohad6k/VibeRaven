declare module 'jsdom' {
  export interface ConstructorOptions {
    [key: string]: unknown;
  }

  export class JSDOM {
    constructor(html?: string, options?: ConstructorOptions);
    window: Window;
  }
}
