import type { IndexJob } from '#/api/rag';

import { onUnmounted, readonly, ref } from 'vue';

import { fetchIndexJob } from '#/api/rag';

const terminalStatuses = new Set<IndexJob['status']>(['canceled', 'failed', 'succeeded']);

export function useIndexJobMonitor(intervalMs = 1000) {
  const job = ref<IndexJob>();
  const monitoring = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function stop() {
    if (timer) clearTimeout(timer);
    timer = undefined;
    monitoring.value = false;
  }

  async function watch(jobId: string, onSettled?: (value: IndexJob) => void) {
    stop();
    monitoring.value = true;
    const poll = async () => {
      try {
        const current = await fetchIndexJob(jobId);
        job.value = current;
        if (terminalStatuses.has(current.status)) {
          stop();
          onSettled?.(current);
          return;
        }
        timer = setTimeout(poll, intervalMs);
      } catch {
        stop();
      }
    };
    await poll();
  }

  onUnmounted(stop);
  return { job: readonly(job), monitoring: readonly(monitoring), stop, watch };
}
