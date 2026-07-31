from datetime import datetime, timezone

import pytest

from app.services.sm2 import apply_sm2


def test_first_review_with_perfect_quality_sets_interval_to_one_day():
    result = apply_sm2(ease_factor=2.5, interval=0, repetitions=0, quality=5)

    assert result['interval'] == 1
    assert result['repetitions'] == 1
    assert result['ease_factor'] == pytest.approx(2.6)


def test_second_review_with_perfect_quality_sets_interval_to_six_days():
    result = apply_sm2(ease_factor=2.6, interval=1, repetitions=1, quality=5)

    assert result['interval'] == 6
    assert result['repetitions'] == 2
    assert result['ease_factor'] == pytest.approx(2.7)


def test_third_review_multiplies_interval_by_ease_factor():
    result = apply_sm2(ease_factor=2.7, interval=6, repetitions=2, quality=5)

    assert result['interval'] == round(6 * 2.7)
    assert result['repetitions'] == 3
    assert result['ease_factor'] == pytest.approx(2.8)


def test_failing_quality_resets_repetitions_and_interval():
    result = apply_sm2(ease_factor=2.8, interval=16, repetitions=3, quality=1)

    assert result['interval'] == 1
    assert result['repetitions'] == 0


def test_ease_factor_never_drops_below_floor():
    result = apply_sm2(ease_factor=1.3, interval=1, repetitions=0, quality=0)

    assert result['ease_factor'] == 1.3


def test_next_review_date_is_interval_days_from_now():
    before = datetime.now(timezone.utc)
    result = apply_sm2(ease_factor=2.5, interval=0, repetitions=0, quality=4)
    after = datetime.now(timezone.utc)

    delta_low = (result['next_review_date'] - before).total_seconds()
    delta_high = (result['next_review_date'] - after).total_seconds()

    assert 86400 - 5 <= delta_low <= 86400 + 5
    assert delta_high <= 86400 + 5
