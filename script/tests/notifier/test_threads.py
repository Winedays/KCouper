"""Unit tests for Threads notification publisher module."""

import unittest
from unittest.mock import MagicMock, patch

from notifier.threads import (
    create_threads_container,
    process_pending_queue,
    publish_coupon_to_threads,
    publish_threads_container,
)


class TestNotifierThreads(unittest.TestCase):
    """Test suite for Threads publisher functionality."""

    @patch('notifier.threads.THREADS_USER_ID', 'user_1')
    @patch('notifier.threads.THREADS_ACCESS_TOKEN', 'token_1')
    def test_create_threads_container_success(self):
        mock_session = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {'id': 'container_123'}
        mock_session.post.return_value = mock_resp

        container_id = create_threads_container(mock_session, 'Test text')
        self.assertEqual(container_id, 'container_123')

    @patch('notifier.threads.THREADS_USER_ID', 'user_1')
    @patch('notifier.threads.THREADS_ACCESS_TOKEN', 'token_1')
    def test_create_threads_container_failure(self):
        mock_session = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.text = 'Bad request'
        mock_session.post.return_value = mock_resp

        with self.assertRaises(RuntimeError):
            create_threads_container(mock_session, 'Test text')

    @patch('notifier.threads.THREADS_USER_ID', 'user_1')
    @patch('notifier.threads.THREADS_ACCESS_TOKEN', 'token_1')
    def test_publish_threads_container_success(self):
        mock_session = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {'id': 'post_456'}
        mock_session.post.return_value = mock_resp

        post_id = publish_threads_container(mock_session, 'container_123')
        self.assertEqual(post_id, 'post_456')

    @patch('notifier.threads.THREADS_USER_ID', 'user_1')
    @patch('notifier.threads.THREADS_ACCESS_TOKEN', 'token_1')
    def test_publish_threads_container_failure(self):
        mock_session = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = 'Server error'
        mock_session.post.return_value = mock_resp

        with self.assertRaises(RuntimeError):
            publish_threads_container(mock_session, 'container_123')

    def test_publish_coupon_dry_run_does_not_call_api(self):
        mock_session = MagicMock()
        coupon = {'coupon_code': 24693, 'name': 'Test', 'price': 100}
        success = publish_coupon_to_threads(
            coupon, dry_run=True, session=mock_session
        )
        self.assertTrue(success)
        mock_session.post.assert_not_called()

    @patch('notifier.threads.THREADS_USER_ID', None)
    @patch('notifier.threads.THREADS_ACCESS_TOKEN', None)
    def test_publish_coupon_missing_credentials(self):
        coupon = {'coupon_code': 24693, 'name': 'Test', 'price': 100}
        success = publish_coupon_to_threads(coupon)
        self.assertFalse(success)

    @patch('notifier.threads.THREADS_USER_ID', 'user_1')
    @patch('notifier.threads.THREADS_ACCESS_TOKEN', 'token_1')
    @patch('notifier.threads.publish_threads_container')
    @patch('notifier.threads.create_threads_container')
    def test_publish_coupon_success_calls_api(self, mock_create, mock_publish):
        mock_create.return_value = 'container_999'
        mock_publish.return_value = 'post_888'

        coupon = {'coupon_code': 24693, 'name': 'Test', 'price': 100}
        success = publish_coupon_to_threads(coupon)
        self.assertTrue(success)
        mock_create.assert_called_once()
        mock_publish.assert_called_once()

    @patch('notifier.threads.load_pending_queue', return_value=[])
    def test_process_pending_queue_empty(self, _mock_load):
        result = process_pending_queue()
        self.assertEqual(result['total'], 0)
        self.assertEqual(result['success_count'], 0)

    @patch('notifier.threads.POST_INTERVAL', 0.0)
    @patch('notifier.threads.save_pending_queue')
    @patch('notifier.threads.save_notified_codes')
    @patch('notifier.threads.load_notified_codes', return_value=set())
    @patch('notifier.threads.load_pending_queue')
    @patch('notifier.threads.publish_coupon_to_threads')
    def test_process_pending_queue_updates_history_and_queue(
        self, mock_publish, mock_load_q, _mock_load_n, mock_save_n, mock_save_q
    ):
        mock_publish.return_value = True
        mock_load_q.return_value = [
            {'coupon_code': 24693, 'name': 'Coupon 1', 'price': 100},
            {'coupon_code': 24694, 'name': 'Coupon 2', 'price': 200},
        ]

        result = process_pending_queue(dry_run=False)
        self.assertEqual(result['success_count'], 2)
        self.assertEqual(result['failed_count'], 0)

        mock_save_n.assert_called_once_with({24693, 24694})
        mock_save_q.assert_called_once_with([])

    @patch('notifier.threads.POST_INTERVAL', 0.0)
    @patch('notifier.threads.save_pending_queue')
    @patch('notifier.threads.save_notified_codes')
    @patch('notifier.threads.load_notified_codes', return_value=set())
    @patch('notifier.threads.load_pending_queue')
    @patch('notifier.threads.publish_coupon_to_threads')
    def test_process_pending_queue_partial_failure(
        self, mock_publish, mock_load_q, _mock_load_n, mock_save_n, mock_save_q
    ):
        def side_effect(coupon, dry_run=False, session=None):
            return coupon.get('coupon_code') == 24693

        mock_publish.side_effect = side_effect
        mock_load_q.return_value = [
            {'coupon_code': 24693, 'name': 'Coupon 1', 'price': 100},
            {'coupon_code': 24694, 'name': 'Coupon 2', 'price': 200},
        ]

        result = process_pending_queue(dry_run=False)
        self.assertEqual(result['total'], 2)
        self.assertEqual(result['success_count'], 1)
        self.assertEqual(result['failed_count'], 1)
        self.assertEqual(result['remaining_count'], 1)

        mock_save_n.assert_called_once_with({24693})
        mock_save_q.assert_called_once_with([{'coupon_code': 24694, 'name': 'Coupon 2', 'price': 200}])


if __name__ == '__main__':
    unittest.main()
