import json
import os
import shutil
import tempfile
import unittest

from notifier.storage import (
    enqueue_new_coupons,
    load_notified_codes,
    load_pending_queue,
    save_notified_codes,
    save_pending_queue,
)


class TestNotifierStorage(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.notified_path = os.path.join(self.test_dir, 'notified.json')
        self.queue_path = os.path.join(self.test_dir, 'queue.json')

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_load_notified_codes_empty_when_file_not_exist(self):
        codes = load_notified_codes(self.notified_path)
        self.assertEqual(codes, set())

    def test_save_and_load_notified_codes(self):
        save_notified_codes([24693, 24694], self.notified_path)
        codes = load_notified_codes(self.notified_path)
        self.assertEqual(codes, {24693, 24694})

    def test_load_pending_queue_empty_when_file_not_exist(self):
        queue = load_pending_queue(self.queue_path)
        self.assertEqual(queue, [])

    def test_save_and_load_pending_queue(self):
        sample = [{'coupon_code': 24693, 'name': 'Test Coupon', 'price': 100}]
        save_pending_queue(sample, self.queue_path)
        queue = load_pending_queue(self.queue_path)
        self.assertEqual(queue, sample)

    def test_enqueue_new_coupons_deduplication(self):
        save_notified_codes([24691], self.notified_path)
        save_pending_queue([{'coupon_code': 24692, 'name': 'Existing in queue'}], self.queue_path)

        new_candidates = [
            {'coupon_code': 24691, 'name': 'Already Notified'},
            {'coupon_code': 24692, 'name': 'Already In Queue'},
            {'coupon_code': 24693, 'name': 'Brand New Coupon'},
        ]
        added_count = enqueue_new_coupons(
            new_candidates,
            notified_file=self.notified_path,
            queue_file=self.queue_path,
        )
        self.assertEqual(added_count, 1)

        queue = load_pending_queue(self.queue_path)
        self.assertEqual(len(queue), 2)
        self.assertEqual(queue[1]['coupon_code'], 24693)


if __name__ == '__main__':
    unittest.main()
