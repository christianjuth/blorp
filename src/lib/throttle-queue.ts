import { useEffect, useMemo } from "react";
import { useDeepCompareMemoize } from "use-deep-compare-effect";

type Task<T> = () => Promise<T>;

interface QueueItem<T> {
  priority: number;
  task: Task<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

class PriorityThrottledQueue {
  private queue: QueueItem<any>[] = [];
  private interval: number;
  private isProcessing: boolean = false;
  private isPaused: boolean = false;

  constructor(interval: number) {
    this.interval = interval;
  }

  enqueue<T>(task: Task<T>, priority: number = 0): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ priority, task, resolve, reject });
      this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
      this.processQueue(); // Try processing immediately
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || this.isPaused) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && !this.isPaused) {
      const { task, resolve, reject } = this.queue.shift()!;
      try {
        const result = await task();
        resolve(result);
      } catch (err) {
        reject(err);
      }
      if (!this.isPaused) {
        await this.delay(this.interval); // Wait before processing the next task
      }
    }

    this.isProcessing = false;
  }

  async flush(): Promise<void> {
    // Immediately process all remaining tasks
    if (this.isPaused) return;
    this.isProcessing = true;
    while (this.queue.length > 0 && !this.isPaused) {
      const { task, resolve, reject } = this.queue.shift()!;
      try {
        const result = await task();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }
    this.isProcessing = false;
  }

  pause(): void {
    this.isPaused = true;
  }

  play(): void {
    this.isPaused = false;
    this.processQueue(); // Resume processing tasks
  }

  clear(): void {
    this.queue.forEach(({ reject }) => reject(new Error("Queue cleared")));
    this.queue = [];
    this.isProcessing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export function useThrottleQueue(key: ReadonlyArray<unknown> | {}) {
  const memo = useDeepCompareMemoize(key);
  const queue = useMemo(() => new PriorityThrottledQueue(1000 * 5), [memo]);

  useEffect(() => {
    return () => {
      queue.clear();
    };
  }, [queue]);

  return queue;
}
