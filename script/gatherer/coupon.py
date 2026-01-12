import json
import os
import time
from datetime import datetime, timedelta, timezone

import requests

from utils import LOG, api_caller, get_date, init_delivery_info, init_session


SHOP_CODE = os.getenv('SHOP_CODE')
COUPON_RANGES = (
    _cs.strip().split('-')
    for _cs in os.getenv('COUPON_RANGES').split(',')
)


def normalize_name(name: str) -> str:
    if name.startswith('(') and name.endswith(')'):
        name = name[1:-1].strip()
    return name


def convert_coupon_data(data: dict, coupon_code: str):
    try:
        detail = data['FoodDetail']
    except KeyError:
        LOG.error('food detail not found in data=%r', data)
        raise
    if len(detail) != 1:
        LOG.error('unknown food detail format, detail=%r', detail)
        raise ValueError(f'unknown food detail format, {detail=}')
    detail = detail[0]

    # food details
    items = []
    price = detail['Original_Price']
    for food in detail['Details']:
        main_item = food['MList'][0]
        item = {
            'name': normalize_name(main_item['Name']),
            'count': food['MinCount'],
            'addition_price': main_item['AddPrice'],
            'flavors': [],
        }
        price += main_item['MListPrice'] * food['MinCount']
        for flavor in food['MList'][1:]:
            item['flavors'].append({
                'name': normalize_name(flavor['Name']),
                'addition_price': flavor['AddPrice'],
            })
        items.append(item)

    return {
        'name': detail['Name'],
        'product_code': detail['Fcode'],
        'coupon_code': coupon_code,
        'price': price,
        'items': items,
        'start_date': get_date(detail['StartDate']),
        'end_date': get_date(detail['EndDate']),
    }


def get_coupon_data(session: requests.Session, coupon_code: str) -> dict:
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
        msg = f'get voucher info response error, json: {resp}'
        LOG.error(msg)
        raise Exception(msg)

    try:
        product_code = resp['Data']['productCode']
    except KeyError:
        LOG.error('get product code error: coupon code: %s, json: %s', coupon_code, resp)
        return None

    date = datetime.now(timezone(timedelta(hours=8))).strftime("%Y/%m/%d")
    for period in range(1, 5):
        resp = api_caller(
            session,
            'https://olo-api.kfcclub.com.tw/customer/v1/checkCouponProduct',
            {
                'orderDate': date,
                'orderType': '2',
                'mealPeriod': f'{period}',
                'shopCode': SHOP_CODE,
                'couponCode': coupon_code,
                'memberId': '',
            },
            'check voucher valid',
        )
        if resp.get('Message') == 'OK' and resp.get('Success') is True:
            meal_period = f'{period}'
            break
    else:
        LOG.debug('coupon code(%s) is invalid in all periods', coupon_code)
        return None

    resp = api_caller(
        session,
        'https://olo-api.kfcclub.com.tw/menu/v1/GetQueryFoodDetail',
        {
            'shopcode': SHOP_CODE,
            'fcode': product_code,
            'menuid': '',
            'mealperiod': meal_period,
            'ordertype': '2',
            'orderdate': date,
        },
        'get voucher food',
    )
    if resp.get('Message') != 'OK' or not resp.get('Success'):
        msg = f'get voucher food response error, json: {resp}'
        LOG.error(msg)
        raise Exception(msg)

    return resp.get('Data')


def query_coupon(quick=False):
    session = init_session()
    init_delivery_info(session)
    coupon_by_code = {}
    if quick:
        with open('js/coupon.js', 'r', encoding='utf-8') as fp:
            content = fp.read()
        json_str = content[len('const COUPON_DICT='):].strip()
        old_dict = json.loads(json_str)
        coupon_by_code = old_dict.get('coupon_by_code', {})

    today = datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d')
    for r in COUPON_RANGES:
        start = int(r[0])
        end = int(r[1])
        for coupon_code in range(start, end):
            coupon_code_str = str(coupon_code)
            if coupon_code_str in coupon_by_code:
                end_date = coupon_by_code[coupon_code_str]['end_date']
                if end_date < today:
                    coupon_by_code.pop(coupon_code_str)
                    LOG.info('removing expired coupon %d', coupon_code)
                else:
                    LOG.info('skipping existing coupon %d', coupon_code)
                continue

            LOG.info('getting coupon %d...', coupon_code)
            try:
                data = get_coupon_data(session, coupon_code)
            except (KeyError, ValueError) as e:
                LOG.error(str(e))
                continue
            if not data:
                continue

            try:
                food_data = convert_coupon_data(data, coupon_code)
            except (KeyError, ValueError) as e:
                LOG.error(str(e))
                continue
            if food_data:
                coupon_by_code[coupon_code] = food_data
            time.sleep(0.3)
        time.sleep(30)

    coupon_list = sorted(coupon_by_code.values(), key=lambda x: x["price"])
    utc_plus_eight_time = datetime.now(timezone.utc) + timedelta(hours=8)
    coupon_dict = {
        'coupon_by_code': coupon_by_code,
        'coupon_list': coupon_list,
        'count': len(coupon_list),
        'last_update': utc_plus_eight_time.strftime('%Y-%m-%d %H:%M:%S')
    }

    with open('coupon.json', 'w', encoding='utf-8') as fp:
        json.dump(coupon_dict, fp, ensure_ascii=False)

    with open('coupon.js', 'w', encoding='utf-8') as fp:
        j_str = json.dumps(coupon_dict, ensure_ascii=False)
        fp.write(f'const COUPON_DICT={j_str}')
