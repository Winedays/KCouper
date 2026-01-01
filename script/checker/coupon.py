import os
import time

import requests

from utils import LOG, api_caller, init_delivery_info, init_session


SHOP_CODE = os.getenv('SHOP_CODE')
CHECK_RANGES = (
    _cs.strip().split('-')
    for _cs in os.getenv('CHECK_RANGES').split(',')
)


def check_coupon_exist(session: requests.Session, coupon_code: str) -> dict:
    resp = api_caller(
        session,
        'https://olo-api.kfcclub.com.tw/customer/v1/getEVoucherAPI',
        {
            'voucherNo': coupon_code,
            'phone': '',
            'memberId': '',
            'orderType': '2',
            'mealPeriod': '3',
            'shopCode': SHOP_CODE,
        },
        'get voucher info',
    )
    # { "Success": true, "Message": "OK", "Data": { "itemType": "I", "amount": null, "productCode": "TA5484", "balance": null, "discountAmount": null, "voucherType": "C", "voucherId": "5575", "version": "6", "voucherCode": "24693", "productName": "24693-中華電信歡迎" } }
    if resp.get('Message') == '無效的票劵':
        LOG.debug('coupon code(%s) is invalid', coupon_code)
        return None
    if resp.get('Message') != 'OK' or not resp.get('Success'):
        LOG.debug('get voucher info response error, json: %s', resp)
        return None

    raise ValueError(f'voucher exist: code: {coupon_code}, data: {resp.get("Data")}')


def check_new_coupon():
    session = init_session()
    init_delivery_info(session)

    has_coupon_exist = False
    for r in CHECK_RANGES:
        start = int(r[0])
        end = int(r[1])
        for coupon_code in range(start, end):
            LOG.info('getting coupon %s...', coupon_code)
            try:
                check_coupon_exist(session, coupon_code)
            except ValueError as e:
                LOG.error(str(e))
                has_coupon_exist = True
                break
            time.sleep(0.3)
        time.sleep(30)
    if has_coupon_exist:
        raise SystemExit('new coupon exist, check log for details')
