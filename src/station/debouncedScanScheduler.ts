export interface DebouncedScanSchedulerOptions<TReason = string> {
  delayMs: number;
  run: (reason: TReason) => Promise<void> | void;
}

export class DebouncedScanScheduler<TReason = string> {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private isDisposed = false;
  private isRunning = false;
  private pendingReason: TReason | undefined;

  constructor(private readonly options: DebouncedScanSchedulerOptions<TReason>) {}

  schedule(reason: TReason): void {
    if (this.isDisposed) {
      return;
    }

    this.pendingReason = reason;
    if (this.isRunning) {
      return;
    }

    this.resetTimer();
  }

  dispose(): void {
    this.isDisposed = true;
    this.pendingReason = undefined;
    this.clearTimer();
  }

  private resetTimer(): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      void this.runPending();
    }, this.options.delayMs);
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private async runPending(): Promise<void> {
    this.timer = undefined;
    if (this.isDisposed || this.isRunning || this.pendingReason === undefined) {
      return;
    }

    const reason = this.pendingReason;
    this.pendingReason = undefined;
    this.isRunning = true;

    try {
      await this.options.run(reason);
    } finally {
      this.isRunning = false;
      if (!this.isDisposed && this.pendingReason !== undefined) {
        this.resetTimer();
      }
    }
  }
}
