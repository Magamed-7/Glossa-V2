import asyncio
import threading

_loop = None
_lock = threading.Lock()


def _run_loop_forever(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()


def _get_loop():
    global _loop

    if _loop is not None:
        return _loop

    with _lock:
        if _loop is None:
            loop = asyncio.new_event_loop()
            threading.Thread(target=_run_loop_forever, args=(loop,), daemon=True).start()
            _loop = loop

    return _loop


def run_async(coro):
    return asyncio.run_coroutine_threadsafe(coro, _get_loop()).result()
