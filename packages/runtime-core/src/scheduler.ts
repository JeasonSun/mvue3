const queue: any[] = [];
let isFlushPending = false;

const resolvedPromise = Promise.resolve();

export function queueJob(job) {
  if (!queue.length || !queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}
function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true;
    resolvedPromise.then(flushJobs);
  }
}

function flushJobs() {
  isFlushPending = false;
  queue.sort((a, b) => a.id - b.id);
  try {
    for (let i = 0; i < queue.length; i++) {
      const job = queue[i];
      job();
    }
  } catch (error) {
    queue.length = 0;
  }
}

export function nextTick(fn) {
  return fn ? resolvedPromise.then(fn) : resolvedPromise;
}
