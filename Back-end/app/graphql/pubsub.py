"""
Lightweight in-memory PubSub for Strawberry subscriptions.
Not for production use; single-process only.
"""
from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import AsyncIterator, Dict, List


class SimplePubSub:
    def __init__(self) -> None:
        # topic -> list of queues
        self._topics: Dict[str, List[asyncio.Queue]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def publish(self, topic: str, payload: dict) -> None:
        async with self._lock:
            queues = list(self._topics.get(topic, []))
        for q in queues:
            # don't block if queue is full; drop oldest
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                try:
                    _ = q.get_nowait()
                except Exception:
                    pass
                await q.put(payload)

    async def subscribe(self, topic: str) -> AsyncIterator[dict]:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._topics[topic].append(queue)

        try:
            while True:
                item = await queue.get()
                yield item
        finally:
            async with self._lock:
                if queue in self._topics.get(topic, []):
                    self._topics[topic].remove(queue)


# global singleton
pubsub = SimplePubSub()
