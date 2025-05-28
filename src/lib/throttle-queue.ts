import { useEffect, useMemo } from "react";
import { useDeepCompareMemoize } from "use-deep-compare-effect";

type Task<T> = () => Promise<T>;

interface QueueItem<T> {
  task: Task<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export class PriorityThrottledQueue {
  private queue: QueueItem<any>[] = [];
  private lastResolvedAt: number;
  private stopped = true;

  constructor(private interval: number) {
    // Pretend the "last" finished exactly `interval` ago, so the first can run immediately
    this.lastResolvedAt = Date.now() - interval;
    this.startLoop();
  }

  enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
    });
  }

  /**
   * Immediately runs (and resolves) every queued task.
   * Doesn’t retrigger anything that’s already started,
   * and doesn’t affect lastResolvedAt.
   */
  async flush() {
    // take a snapshot of everything waiting
    const toFlush = this.queue.splice(0, this.queue.length);

    // fire them off in parallel
    const runners = toFlush.map(({ task, resolve, reject }) =>
      task()
        .then((val) => {
          resolve(val);
          return val;
        })
        .catch((err) => {
          reject(err);
          // rethrow so Promise.all can capture rejects if you want
          throw err;
        }),
    );

    // resolve once they’ve all settled
    return Promise.all(runners);
  }

  /**
   * Clears everything, rejects pending items, and stops the loop.
   */
  clear(): void {
    this.stopped = true;
    this.queue.forEach(({ reject }) => reject(new Error("Queue cleared")));
    this.queue = [];
  }

  start(): void {
    this.stopped = false;
    this.startLoop();
  }

  private async startLoop(): Promise<void> {
    while (!this.stopped) {
      // 1) Wait for something in the queue
      if (this.queue.length === 0) {
        await this.delay(100);
        continue;
      }

      // 2) Wait until interval has passed since lastResolvedAt
      const now = Date.now();
      const since = now - this.lastResolvedAt;
      if (since < this.interval) {
        await this.delay(this.interval - since);
        continue;
      }

      // maybe cleared while waiting
      if (this.stopped) break;

      // 3) Pull exactly one item
      const { task, resolve, reject } = this.queue.shift()!;
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          // 4) mark when this one actually finished
          this.lastResolvedAt = Date.now();
        });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export function useThrottleQueue(key: ReadonlyArray<unknown> | {}) {
  const memo = useDeepCompareMemoize(key);
  const queue = useMemo(() => new PriorityThrottledQueue(1000 * 5), [memo]);

  useEffect(() => {
    queue.start();
    return () => {
      queue.clear();
    };
  }, [queue]);

  return queue;
}
