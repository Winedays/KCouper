"""Integration tests for gatherer and notification queue."""

import os
import shutil
import tempfile
import unittest

from notifier.storage import enqueue_new_coupons, load_pending_queue, save_notified_codes


class TestGathererIntegration(unittest.TestCase):
    """Test gatherer integration with notification queue."""

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.notified_path = os.path.join(self.test_dir, 'notified.json')
        self.queue_path = os.path.join(self.test_dir, 'queue.json')

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_enqueue_from_scraped_coupons(self):
        save_notified_codes([24691], self.notified_path)
        coupons = [
            {'coupon_code': 24691, 'name': 'Old Coupon', 'price': 100},
            {'coupon_code': 24692, 'name': 'New Coupon', 'price': 150},
        ]
        added = enqueue_new_coupons(
            coupons, notified_file=self.notified_path, queue_file=self.queue_path
        )
        self.assertEqual(added, 1)
        queue = load_pending_queue(self.queue_path)
        self.assertEqual(len(queue), 1)
        self.assertEqual(queue[0]['coupon_code'], 24692)


if __name__ == '__main__':
    unittest.main()
