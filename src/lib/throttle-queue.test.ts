import { describe, test, expect, vi } from "vitest";

vi.useFakeTimers();

describe("PriorityThrottleQueue", () => {
  test("enqueue multiple functons", async () => {
    const interval = 5000;
    const { PriorityThrottledQueue } = await import("./throttle-queue");
    const queue = new PriorityThrottledQueue(interval);

    const fn1 = vi.fn();
    queue.enqueue(fn1);

    const fn2 = vi.fn();
    queue.enqueue(fn2);

    const fn3 = vi.fn();
    queue.enqueue(fn3);

    await vi.runAllTicks();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(0);
    expect(fn3).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTime(interval);
    await vi.runAllTicks();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn3).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTime(interval);
    await vi.runAllTicks();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn3).toHaveBeenCalledTimes(1);
  });

  test("clear", async () => {
    const interval = 5000;
    const { PriorityThrottledQueue } = await import("./throttle-queue");
    const queue = new PriorityThrottledQueue(interval);

    const fn1 = vi.fn();
    queue.enqueue(fn1).catch(() => {});

    const fn2 = vi.fn();
    queue.enqueue(fn2).catch(() => {});

    const fn3 = vi.fn();
    queue.enqueue(fn3).catch(() => {});

    expect(queue.getQueueLength()).toBe(2);

    queue.clear();
    expect(queue.getQueueLength()).toBe(0);

    await vi.runAllTicks();
    expect(fn1).toBeCalledTimes(1);
    expect(fn2).toBeCalledTimes(0);
    expect(fn3).toBeCalledTimes(0);
  });

  test("flush", async () => {
    const interval = 5000;
    const { PriorityThrottledQueue } = await import("./throttle-queue");
    const queue = new PriorityThrottledQueue(interval);

    const fn1 = vi.fn();
    queue.enqueue(fn1);
    const fn2 = vi.fn();
    queue.enqueue(fn2);
    const fn3 = vi.fn();
    queue.enqueue(fn3);

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(0);
    expect(fn3).toHaveBeenCalledTimes(0);

    await queue.flush();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn3).toHaveBeenCalled();
  });

  test("play/pause", async () => {
    const interval = 5000;
    const { PriorityThrottledQueue } = await import("./throttle-queue");
    const queue = new PriorityThrottledQueue(interval);

    const fn1 = vi.fn();
    queue.enqueue(fn1).catch(() => {});

    const fn2 = vi.fn();
    queue.enqueue(fn2).catch(() => {});

    expect(queue.getQueueLength()).toBe(1);
    queue.pause();

    vi.advanceTimersByTime(interval);
    await vi.runAllTicks();
    expect(queue.getQueueLength()).toBe(1);
    expect(fn2).toBeCalledTimes(0);

    vi.advanceTimersByTime(interval);
    await vi.runAllTicks();
    expect(queue.getQueueLength()).toBe(1);
    expect(fn2).toBeCalledTimes(0);

    queue.play();

    vi.advanceTimersByTime(interval);
    await vi.runAllTicks();
    expect(queue.getQueueLength()).toBe(0);
    expect(fn2).toBeCalledTimes(1);
  });

  test("clear", async () => {
    const interval = 5000;
    const { PriorityThrottledQueue } = await import("./throttle-queue");
    const queue = new PriorityThrottledQueue(interval);

    const fn1 = vi.fn();
    queue.enqueue(fn1).catch(() => {});

    const fn2 = vi.fn();
    queue.enqueue(fn2).catch(() => {});

    expect(queue.getQueueLength()).toBe(1);

    queue.clear();

    const fn3 = vi.fn();
    queue.enqueue(fn3).catch(() => {});
    expect(queue.getQueueLength()).toBe(0);
  });
});
