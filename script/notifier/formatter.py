"""Formatting module for Threads coupon notification posts."""

MAX_THREADS_LENGTH = 500


def format_coupon_post(coupon: dict, max_length: int = MAX_THREADS_LENGTH) -> str:
    """Format coupon details into Threads post text within character limit."""
    code = coupon['coupon_code']
    name = coupon.get('name', '')
    price = coupon.get('price', '')
    start_date = coupon.get('start_date', '')
    end_date = coupon.get('end_date', '')
    items = coupon.get('items', [])

    header = f'🍗 【肯德基新優惠券】代碼：{code}\n\n📝 {name}\n💰 特價：${price}\n📦 餐點內容：\n'
    footer = (
        f'\n⏳ 使用期限：{start_date} ~ {end_date}\n\n'
        f'👉 查看優惠券詳細內容：https://winedays.github.io/KCouper/?coupon={code}\n\n'
        f'#肯德基優惠券 #KFC #KCouper #速食優惠'
    )

    available_length = max_length - len(header) - len(footer)
    item_lines = []
    for idx, item in enumerate(items):
        item_name = item.get('name', '')
        count = item.get('count', 1)
        line = f'• {item_name} x {count}\n'

        current_content = ''.join(item_lines) + line
        if len(current_content) > available_length:
            remaining_count = len(items) - idx
            ellipsis_line = f'• ...等 {remaining_count} 項餐點\n'
            if len(''.join(item_lines) + ellipsis_line) <= available_length:
                item_lines.append(ellipsis_line)
            break
        item_lines.append(line)

    content = ''.join(item_lines).rstrip('\n')
    if not content:
        content = '• 依官網公告為準'

    full_text = f'{header}{content}{footer}'
    if len(full_text) > max_length:
        return full_text[:max_length]
    return full_text
