import json
import os
from typing import Iterable

from utils import LOG


def load_notified_codes(file_path: str = 'data/notified_coupons.json') -> set[int]:
    if not os.path.exists(file_path):
        return set()
    try:
        with open(file_path, 'r', encoding='utf-8') as fp:
            data = json.load(fp)
            if isinstance(data, list):
                return set(int(code) for code in data)
            LOG.error('Invalid format in %s: expected list, got %s', file_path, type(data))
            return set()
    except (json.JSONDecodeError, OSError) as exc:
        LOG.error('Failed to load notified codes from %s: %s', file_path, str(exc))
        return set()


def save_notified_codes(codes: Iterable[int], file_path: str = 'data/notified_coupons.json') -> None:
    try:
        os.makedirs(os.path.dirname(file_path) or '.', exist_ok=True)
        sorted_codes = sorted(list(set(int(c) for c in codes)))
        with open(file_path, 'w', encoding='utf-8') as fp:
            json.dump(sorted_codes, fp, ensure_ascii=False, indent=2)
    except OSError as exc:
        LOG.error('Failed to save notified codes to %s: %s', file_path, str(exc))


def load_pending_queue(file_path: str = 'data/pending_threads_queue.json') -> list[dict]:
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, 'r', encoding='utf-8') as fp:
            data = json.load(fp)
            if isinstance(data, list):
                return data
            LOG.error('Invalid format in %s: expected list, got %s', file_path, type(data))
            return []
    except (json.JSONDecodeError, OSError) as exc:
        LOG.error('Failed to load pending queue from %s: %s', file_path, str(exc))
        return []


def save_pending_queue(queue: list[dict], file_path: str = 'data/pending_threads_queue.json') -> None:
    try:
        os.makedirs(os.path.dirname(file_path) or '.', exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as fp:
            json.dump(queue, fp, ensure_ascii=False, indent=2)
    except OSError as exc:
        LOG.error('Failed to save pending queue to %s: %s', file_path, str(exc))


def enqueue_new_coupons(
    coupons: list[dict],
    notified_file: str = 'data/notified_coupons.json',
    queue_file: str = 'data/pending_threads_queue.json',
) -> int:
    try:
        notified_codes = load_notified_codes(notified_file)
        queue = load_pending_queue(queue_file)
        queue_codes = {int(item['coupon_code']) for item in queue if 'coupon_code' in item}

        added_count = 0
        for coupon in coupons:
            code = int(coupon.get('coupon_code', 0))
            if code and (code not in notified_codes) and (code not in queue_codes):
                queue.append(coupon)
                queue_codes.add(code)
                added_count += 1

        if added_count > 0:
            save_pending_queue(queue, queue_file)

        return added_count
    except Exception as exc:
        LOG.error('Failed to enqueue new coupons: %s', str(exc))
        return 0
