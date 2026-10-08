"""Integration tests for gatherer and notification queue."""

import os
import shutil
import tempfile
import unittest
from unittest.mock import MagicMock

os.environ['COUPON_RANGES'] = '1-2'
os.environ['SHOP_CODE'] = 'TEST'

# gatherer.coupon reads env vars at import time, so it must be imported after the lines above
# pylint: disable=wrong-import-position
from gatherer import coupon as gatherer_coupon
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


class TestGetCouponDataOrderTypes(unittest.TestCase):
    """Test order type detection in get_coupon_data."""

    FOOD_DATA = {'FoodDetail': []}
    VOUCHER_OK = {'Success': True, 'Message': 'OK', 'Data': {'productCode': 'TA9926'}}
    PERIOD_OK = {'Success': True, 'Message': 'OK'}
    PERIOD_FAIL = {'Success': False, 'Message': 'invalid'}
    FOOD_OK = {'Success': True, 'Message': 'OK', 'Data': FOOD_DATA}
    FOOD_NULL = {'Success': True, 'Message': 'OK', 'Data': None}
    FOOD_ERROR = {'Success': False, 'Message': 'error'}

    def test_get_coupon_data_pickup_only_returns_order_type_2(self):
        mock_session = MagicMock()
        mock_session.post.return_value.status_code = 200
        mock_session.post.return_value.json.side_effect = (
            [self.VOUCHER_OK]
            + [self.PERIOD_FAIL] * 5
            + [self.PERIOD_FAIL, self.PERIOD_OK, self.PERIOD_OK, self.PERIOD_OK, self.PERIOD_OK]
            + [self.FOOD_OK]
        )

        food_data, meal_periods, order_types = gatherer_coupon.get_coupon_data(
            mock_session, '16070'
        )

        self.assertEqual(food_data, self.FOOD_DATA)
        self.assertEqual(meal_periods, [2, 3, 4, 5])
        self.assertEqual(order_types, [2])
        food_body = mock_session.post.call_args.kwargs['json']
        self.assertEqual((food_body['ordertype'], food_body['mealperiod']), ('2', '2'))

    def test_get_coupon_data_delivery_and_pickup_returns_order_types_1_and_2(self):
        period_results = [
            self.PERIOD_FAIL, self.PERIOD_OK, self.PERIOD_OK, self.PERIOD_OK, self.PERIOD_OK
        ]
        mock_session = MagicMock()
        mock_session.post.return_value.status_code = 200
        mock_session.post.return_value.json.side_effect = (
            [self.VOUCHER_OK] + period_results * 2 + [self.FOOD_OK]
        )

        food_data, meal_periods, order_types = gatherer_coupon.get_coupon_data(
            mock_session, '50552'
        )

        self.assertEqual(food_data, self.FOOD_DATA)
        self.assertEqual(meal_periods, [2, 3, 4, 5])
        self.assertEqual(order_types, [1, 2])
        self.assertEqual(mock_session.post.call_count, 12)
        food_body = mock_session.post.call_args.kwargs['json']
        self.assertEqual((food_body['ordertype'], food_body['mealperiod']), ('1', '2'))

    def test_get_coupon_data_periods_differ_by_order_type_returns_union(self):
        mock_session = MagicMock()
        mock_session.post.return_value.status_code = 200
        mock_session.post.return_value.json.side_effect = (
            [self.VOUCHER_OK]
            + [
                self.PERIOD_OK, self.PERIOD_FAIL, self.PERIOD_FAIL, self.PERIOD_FAIL,
                self.PERIOD_FAIL
            ]
            + [self.PERIOD_FAIL, self.PERIOD_OK, self.PERIOD_OK, self.PERIOD_FAIL, self.PERIOD_FAIL]
            + [self.FOOD_OK]
        )

        _, meal_periods, order_types = gatherer_coupon.get_coupon_data(mock_session, '16070')

        self.assertEqual(meal_periods, [1, 2, 3])
        self.assertEqual(order_types, [1, 2])

    def test_get_coupon_data_invalid_in_all_combinations_returns_none(self):
        mock_session = MagicMock()
        mock_session.post.return_value.status_code = 200
        mock_session.post.return_value.json.side_effect = (
            [self.VOUCHER_OK] + [self.PERIOD_FAIL] * 10
        )

        result = gatherer_coupon.get_coupon_data(mock_session, '16070')

        self.assertEqual(result, (None, [], []))
        self.assertEqual(mock_session.post.call_count, 11)

    def test_get_coupon_data_null_food_combination_returns_remaining_periods(self):
        mock_session = MagicMock()
        mock_session.post.return_value.status_code = 200
        mock_session.post.return_value.json.side_effect = (
            [self.VOUCHER_OK]
            + [self.PERIOD_FAIL] * 5
            + [self.PERIOD_FAIL, self.PERIOD_OK, self.PERIOD_OK, self.PERIOD_FAIL, self.PERIOD_FAIL]
            + [self.FOOD_NULL, self.FOOD_OK]
        )

        _, meal_periods, order_types = gatherer_coupon.get_coupon_data(mock_session, '16070')

        self.assertEqual(meal_periods, [3])
        self.assertEqual(order_types, [2])

    def test_get_coupon_data_food_detail_error_raises_exception(self):
        mock_session = MagicMock()
        mock_session.post.return_value.status_code = 200
        mock_session.post.return_value.json.side_effect = (
            [self.VOUCHER_OK]
            + [self.PERIOD_FAIL] * 5
            + [self.PERIOD_FAIL, self.PERIOD_OK, self.PERIOD_OK, self.PERIOD_OK, self.PERIOD_OK]
            + [self.FOOD_ERROR]
        )

        with self.assertRaisesRegex(Exception, 'get voucher food response error'):
            gatherer_coupon.get_coupon_data(mock_session, '16070')


class TestConvertCouponData(unittest.TestCase):
    """Test convert_coupon_data output."""

    def test_convert_coupon_data_with_order_types_returns_order_types(self):
        data = {
            'FoodDetail': [{
                'Name': 'test coupon',
                'Fcode': 'TA9926',
                'Original_Price': 0,
                'StartDate': '2026/01/01 00:00:00',
                'EndDate': '2026/12/31 23:59:59',
                'Details': [{
                    'MinCount': 1,
                    'MList': [{'Name': '原味蛋撻', 'AddPrice': 0, 'MListPrice': 49}],
                }],
            }],
        }
        result = gatherer_coupon.convert_coupon_data(data, 16070, [2], [2])
        self.assertEqual(result['order_types'], [2])
        self.assertEqual(result['meal_periods'], [2])


if __name__ == '__main__':
    unittest.main()
