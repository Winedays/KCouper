"""Meta Threads Graph API publication module."""

import os
import time
from typing import Optional

import requests

from notifier.formatter import format_coupon_post
from notifier.storage import (
    load_notified_codes,
    load_pending_queue,
    save_notified_codes,
    save_pending_queue,
)
from utils import LOG


THREADS_API_BASE = 'https://graph.threads.net/v1.0'
THREADS_USER_ID = os.getenv('THREADS_USER_ID')
THREADS_ACCESS_TOKEN = os.getenv('THREADS_ACCESS_TOKEN')
POST_INTERVAL = 5.0


def create_threads_container(session: requests.Session, text: str) -> str:
    """Create a media container for a text post on Threads."""
    url = f'{THREADS_API_BASE}/{THREADS_USER_ID}/threads'
    payload = {
        'media_type': 'TEXT',
        'text': text,
        'access_token': THREADS_ACCESS_TOKEN,
    }
    resp = session.post(url, data=payload, timeout=30)
    if resp.status_code != 200:
        msg = f'Failed to create Threads container: status={resp.status_code}, body={resp.text}'
        LOG.error(msg)
        raise RuntimeError(msg)
    data = resp.json()
    return data['id']


def publish_threads_container(session: requests.Session, creation_id: str) -> str:
    """Publish a created media container to Threads."""
    url = f'{THREADS_API_BASE}/{THREADS_USER_ID}/threads_publish'
    payload = {
        'creation_id': creation_id,
        'access_token': THREADS_ACCESS_TOKEN,
    }
    resp = session.post(url, data=payload, timeout=30)
    if resp.status_code != 200:
        msg = f'Failed to publish Threads container: status={resp.status_code}, body={resp.text}'
        LOG.error(msg)
        raise RuntimeError(msg)
    data = resp.json()
    return data['id']


def publish_coupon_to_threads(
    coupon: dict,
    dry_run: bool = False,
    session: Optional[requests.Session] = None,
) -> bool:
    """Publish a single coupon to Threads or simulate in dry-run mode."""
    code = coupon.get('coupon_code', 'unknown')
    try:
        text = format_coupon_post(coupon)
    except Exception as exc:
        LOG.error('Failed to format coupon %s for Threads: %s', code, str(exc))
        return False

    LOG.info('Preparing to post coupon %s:\n%s', code, text)

    if dry_run:
        LOG.info('[DRY-RUN] Coupon %s post simulated successfully.', code)
        return True

    if not THREADS_USER_ID or not THREADS_ACCESS_TOKEN:
        LOG.error('THREADS_USER_ID or THREADS_ACCESS_TOKEN is missing.')
        return False

    http_session = session or requests.Session()
    try:
        creation_id = create_threads_container(http_session, text)
        LOG.info('Created container %s for coupon %s', creation_id, code)
        post_id = publish_threads_container(http_session, creation_id)
        LOG.info('Published post %s for coupon %s', post_id, code)
        return True
    except Exception as exc:
        LOG.error('Error publishing coupon %s to Threads: %s', code, str(exc))
        return False


def process_pending_queue(dry_run: bool = False) -> dict:
    """Process pending coupon queue and publish each to Threads."""
    try:
        queue = load_pending_queue()
        if not queue:
            LOG.info('No pending coupons in queue to notify.')
            return {'total': 0, 'success_count': 0, 'failed_count': 0, 'remaining_count': 0}

        LOG.info('Found %d pending coupon(s) in queue.', len(queue))
        notified_codes = load_notified_codes()

        remaining_queue = []
        success_count = 0
        failed_count = 0

        session = requests.Session()
        for index, coupon in enumerate(queue):
            code = int(coupon.get('coupon_code', 0))
            success = publish_coupon_to_threads(
                coupon, dry_run=dry_run, session=session
            )
            if success:
                success_count += 1
                if code:
                    notified_codes.add(code)
            else:
                failed_count += 1
                remaining_queue.append(coupon)

            if index < len(queue) - 1 and not dry_run:
                LOG.info('Waiting %.1f seconds before next post...', POST_INTERVAL)
                time.sleep(POST_INTERVAL)

        save_notified_codes(notified_codes)
        save_pending_queue(remaining_queue)

        LOG.info(
            'Queue processing finished: %d succeeded, %d failed, %d remaining in queue.',
            success_count,
            failed_count,
            len(remaining_queue),
        )
        return {
            'total': len(queue),
            'success_count': success_count,
            'failed_count': failed_count,
            'remaining_count': len(remaining_queue),
        }
    except Exception as exc:
        LOG.error('Unexpected error in process_pending_queue: %s', str(exc))
        return {'total': 0, 'success_count': 0, 'failed_count': 1, 'remaining_count': 0}
