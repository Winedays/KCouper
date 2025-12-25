# -*- coding: utf-8 -*-
import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv


load_dotenv()  # take environment variables from .env.

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'

FORMAT = '[%(levelname)s] %(asctime)s %(filename)s(%(lineno)d): %(message)s'
fileHandler = logging.FileHandler('debug.log', mode='w')
streamHandler = logging.StreamHandler(sys.stdout)
logging.basicConfig(level=logging.INFO, format=FORMAT, handlers=[fileHandler, streamHandler])
LOG = logging.getLogger('kcouper')
EXCLUDE_NAMES = os.getenv('EXCLUDE_NAMES').split(',')
SHOP_CODE = os.getenv('SHOP_CODE')
coupon_ranges = (
    _cs.strip().split('-')
    for _cs in os.getenv('COUPON_RANGES').split(',')
)
check_ranges = (
    _cs.strip().split('-')
    for _cs in os.getenv('CHECK_RANGES').split(',')
)


def get_date(dt: str) -> str:
    date_obj = datetime.strptime(dt, '%Y/%m/%d %H:%M:%S')
    return datetime.strftime(date_obj, '%Y-%m-%d')


def api_caller(session: requests.Session, url: str, body: dict, msg_prefix: str, retry: int = 0):
    resp = session.post(url, json=body)
    if resp.status_code == 502:
        if retry > 10:
            raise Exception('abort with api retry count > 10')
        retry += 1
        LOG.warning('%s 502 error, retry=%d', msg_prefix, retry)
        time.sleep(30)
        return api_caller(session, url, body, msg_prefix, retry)
    if resp.status_code != 200:
        msg = f'{msg_prefix} error, status code: {resp.status_code}, text: {resp.text}'
        LOG.error(msg)
        raise Exception(msg)
    return resp.json()


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


def init_session() -> requests.Session:
    session = requests.Session()
    session.headers['User-Agent'] = USER_AGENT
    session.headers['origin'] = 'https://www.kfcclub.com.tw'
    session.headers['referer'] = 'https://www.kfcclub.com.tw/'
    return session


def init_delivery_info(session: requests.Session):
    resp = api_caller(
        session,
        'https://olo-api.kfcclub.com.tw/menu/v1/QueryDeliveryShops',
        {'shopCode': 'TWI104', 'orderType': '2', 'platform': '1'},
        'get shop info',
    )
    # { "Success": true, "Message": "OK", "Data": { "ShopCode": "TWI104", "ShopName": "台北雙連餐廳(雙連捷運站2號)", "CityName": "台北市", "AreaName": "中山區", "Addr": "台北市中山區民生西路9號", "OpeningTime": "每日08:00-24:00", "LON": "121.521610000000", "LAT": "25.057911999800", "IsBreakfast": true, "IsInCar": false, "InCarDesc": "", "IsTracker": true, "IsFoodLocker": false, "BusinessName": "富利餐飲股份有限公司台北雙連分公司", "VATNumber": "53017114", "GUINumber": "A-197161500-00026-5", "RegisterAddress": "臺北市中山區民生西路9號", "QuoTime1": "25", "QuoTime2": "1", "AddQT": "0", "SdeQuoTime": "0", "Zone": "", "BaseAmount": "399", "FixedShipping": true, "Freight_Key": "ZZ798", "Freight_Amount": "39", "ePayment": true, "CRM_CouponUsed": true, "Edenred_CouponUsed": true, "CashPay": true, "CreditCard": true, "JKOPay": true, "ApplePay": false, "GooglePay": false, "LinePay": true, "PXPay": true, "iCashPay": true, "EasyWallet": true, "deliveryDate": [ "2025/01/12", "2025/01/13", "2025/01/14", "2025/01/15", "2025/01/16", "2025/01/17", "2025/01/18", "2025/01/19", "2025/01/20", "2025/01/21", "2025/01/22", "2025/01/23", "2025/01/24", "2025/01/25" ], "downlevel": "0", "IsDrivewayPickup": false, "RedeemPoint": true, "KFC_CouponUsed": true, "KFC_EVoucherVer1Used": true, "KFC_EVoucherVer2Used": true, "KFC_EVoucherVer3Used": true, "KFC_EVoucherVer4Used": true } }
    if resp.get('Message') != 'OK' or not resp.get('Success'):
        msg = f'get shop info response error, json: {resp}'
        LOG.error(msg)
        raise Exception(msg)

    resp = api_caller(
        session,
        'https://olo-api.kfcclub.com.tw/menu/v1/QueryDeliveryTime',
        {'shopCode': 'TWI104', 'orderType': '2', 'orderDate': '2025/01/13', 'addQt': '0', 'sdeQt': '0'},
        'get time info',
    )
    # { "Success": true, "Message": "OK", "Data": { "sHour": "8", "eHour": "22", "sMinute": "20", "eMinute": "30", "qt": "1", "status": "1", "downlevel": "0", "interval": "5", "message": "", "promptLock": "", "promptMessage": "", "LockTimePeriod": null } }
    if resp.get('Message') != 'OK' or not resp.get('Success'):
        msg = f'get time info response error, json: {resp}'
        LOG.error(msg)
        raise Exception(msg)


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


def main():
    session = init_session()
    init_delivery_info(session)

    coupon_by_code = {}
    for r in coupon_ranges:
        start = int(r[0])
        end = int(r[1])
        for coupon_code in range(start, end):
            LOG.info('getting coupon %s...', coupon_code)
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


def check():
    session = init_session()
    init_delivery_info(session)

    has_coupon_exist = False
    for r in check_ranges:
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
        raise SystemExit('coupon exist, check log for details')


def get_morning_produce_data(session: requests.Session) -> dict:
    # Get morning menu ID
    date = datetime.now(timezone(timedelta(hours=8))).strftime("%Y/%m/%d")
    resp = api_caller(
        session,
        'https://olo-api.kfcclub.com.tw/menu/v1/GetQueryMenu',
        {
            'ismember': '0',
            'mealperiod': '1',
            'orderdate': date,
            'ordertype': '2',
            'parentid': '0',
            'shopcode': SHOP_CODE,
        },
        'get morning menu info',
    )
    if resp.get('Message') != 'OK' or not resp.get('Success'):
        msg = f'get morning menu info response error, json: {resp}'
        LOG.error(msg)
        raise Exception(msg)

    menu_id = None
    for _menu in resp.get('Data', {}).get('Menu', []):
        if '早餐' in _menu.get('Title', ''):
            menu_id = _menu.get('MenuID')
            break
    else:
        raise ValueError('morning menu not found')

    # Get morning food data
    resp = api_caller(
        session,
        'https://olo-api.kfcclub.com.tw/menu/v1/GetQueryFood',
        {
            'IsPKAPP': '0',
            'ismember': '0',
            'mealperiod': '1',
            'menuid': menu_id,
            'orderdate': date,
            'ordertype': '2',
            'parentid': '0',
            'shopcode': SHOP_CODE,
        },
        'get morning food info',
    )
    if resp.get('Message') != 'OK' or not resp.get('Success'):
        msg = f'get morning food info response error, json: {resp}'
        LOG.error(msg)
        raise Exception(msg)

    details = None
    for _food in resp.get('Data', {}).get('Foods', []):
        if '單點' in _food.get('Title', ''):
            details = _food.get('Details', [])
            break
    else:
        raise ValueError('morning single produce not found')
    return details


def get_dinner_produce_data(session: requests.Session) -> dict:
    # Get dinner food data
    date = datetime.now(timezone(timedelta(hours=8))).strftime("%Y/%m/%d")
    resp = api_caller(
        session,
        'https://olo-api.kfcclub.com.tw/menu/v1/GetQueryMenu',
        {
            'ismember': '0',
            'mealperiod': '4',
            'orderdate': date,
            'ordertype': '2',
            'parentid': '0',
            'shopcode': SHOP_CODE,
        },
        'get dinner menu info',
    )
    if resp.get('Message') != 'OK' or not resp.get('Success'):
        msg = f'get dinner menu info response error, json: {resp}'
        LOG.error(msg)
        raise Exception(msg)

    menu_ids = []
    titles = {'炸雞/紙包雞', '漢堡', '蛋撻', '點心/飲料'}
    for _menu in resp.get('Data', {}).get('Menu', []):
        if _menu.get('Title', '') in titles:
            menu_ids.append(_menu.get('MenuID'))
    if not menu_ids:
        raise ValueError('dinner menu not found')

    # Get dinner food data
    details = []
    for menu_id in menu_ids:
        resp = api_caller(
            session,
            'https://olo-api.kfcclub.com.tw/menu/v1/GetQueryFood',
            {
                'IsPKAPP': '0',
                'ismember': '0',
                'mealperiod': '4',
                'menuid': menu_id,
                'orderdate': date,
                'ordertype': '2',
                'parentid': '0',
                'shopcode': SHOP_CODE,
            },
            'get dinner food info',
        )
        if resp.get('Message') != 'OK' or not resp.get('Success'):
            msg = f'get dinner food info response error, json: {resp}'
            LOG.error(msg)
            raise Exception(msg)

        for _food in resp.get('Data', {}).get('Foods', []):
            details.extend(_food.get('Details', []))
    if not details:
        raise ValueError('dinner single produce not found')
    return details


def convert_single_produce_data(morning_data: dict, dinner_data: dict) -> dict:
    produces = {}
    for _d in morning_data + dinner_data:
        produces[_d['Name'].strip()] = {
            'code':_d['Fcode'],
            'name': _d['Name'].strip(),
            'price': _d['Upa_Group'],
            'nutrition':_d['Nutrition'].strip(),
        }
    return produces

def query_single_produce():
    session = init_session()
    init_delivery_info(session)

    try:
        morning = get_morning_produce_data(session)
    except (KeyError, ValueError) as e:
        LOG.error(str(e))
        return
    try:
        dinner = get_dinner_produce_data(session)
    except (KeyError, ValueError) as e:
        LOG.error(str(e))
        return

    try:
        food_data = convert_single_produce_data(morning, dinner)
    except (KeyError, ValueError) as e:
        LOG.error(str(e))
        return
    # if food_data:
    #     print(json.dumps(food_data, ensure_ascii=False, indent=2))

    with open('single.json', 'w', encoding='utf-8') as fp:
        json.dump(food_data, fp, ensure_ascii=False)

    with open('single.js', 'w', encoding='utf-8') as fp:
        j_str = json.dumps(food_data, ensure_ascii=False)
        fp.write(f'const SINGLE_DICT={j_str}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='KCoupon tool')
    parser.add_argument('--mode', '-m', choices=['main', 'check', 'single'], default='main',
                      help='Operation mode: main (default) for coupon gathering, check for coupon existence verification')
    args = parser.parse_args()

    if args.mode == 'check':
        check()
    elif args.mode == 'single':
        query_single_produce()
    else:
        main()
