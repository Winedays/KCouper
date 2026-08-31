import unittest

from notifier.formatter import format_coupon_post


class TestNotifierFormatter(unittest.TestCase):
    """Unit tests for Threads coupon post formatter."""

    def test_format_standard_coupon_post(self):
        """Test formatting a standard coupon with basic fields and item list."""
        coupon = {
            'coupon_code': 24693,
            'name': '24693-中華電信歡迎',
            'price': 150,
            'start_date': '2026-08-23',
            'end_date': '2026-09-30',
            'items': [
                {'name': '咔啦脆雞', 'count': 2},
                {'name': '原味蛋撻', 'count': 1},
                {'name': '百事可樂(小)', 'count': 1},
            ],
        }
        text = format_coupon_post(coupon)
        self.assertIn('【肯德基新優惠券】代碼：24693', text)
        self.assertIn('24693-中華電信歡迎', text)
        self.assertIn('特價：$150', text)
        self.assertIn('• 咔啦脆雞 x 2', text)
        self.assertIn('• 原味蛋撻 x 1', text)
        self.assertIn('使用期限：2026-08-23 ~ 2026-09-30', text)
        self.assertIn('https://winedays.github.io/KCouper/?coupon=24693', text)
        self.assertIn('#肯德基優惠券', text)
        self.assertLessEqual(len(text), 500)

    def test_format_coupon_with_many_items_truncation(self):
        """Test truncation and character limit enforcement when coupon has many items."""
        coupon = {
            'coupon_code': 99999,
            'name': '超長餐點品項測試優惠券',
            'price': 999,
            'start_date': '2026-08-23',
            'end_date': '2026-09-30',
            'items': [
                {'name': f'極致豪華巨無霸炸雞桶超大份量餐點品項號碼_{i}', 'count': 10}
                for i in range(30)
            ],
        }
        text = format_coupon_post(coupon)
        self.assertLessEqual(len(text), 500)
        self.assertIn('等', text)
        self.assertIn('https://winedays.github.io/KCouper/?coupon=99999', text)

    def test_format_coupon_empty_items(self):
        """Test fallback text when item list is empty."""
        coupon = {
            'coupon_code': 12345,
            'name': '無餐點測試券',
            'price': 100,
            'start_date': '2026-08-23',
            'end_date': '2026-09-30',
            'items': [],
        }
        text = format_coupon_post(coupon)
        self.assertIn('• 依官網公告為準', text)
        self.assertLessEqual(len(text), 500)


if __name__ == '__main__':
    unittest.main()
