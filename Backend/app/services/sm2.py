from datetime import datetime, timedelta, timezone


def apply_sm2(ease_factor: float, interval: int, repetitions: int, quality: int):
    if quality < 3:
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)

        repetitions += 1

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    if ease_factor < 1.3:
        ease_factor = 1.3

    next_review_date = datetime.now(timezone.utc) + timedelta(days=interval)

    return {
        'ease_factor': ease_factor,
        'interval': interval,
        'repetitions': repetitions,
        'next_review_date': next_review_date,
    }
