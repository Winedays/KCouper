# -*- coding: utf-8 -*-
from datetime import datetime, timedelta, timezone
import time
import json
import os
import logging
import sys
 
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


def get_date(dt: str) -> str:
    date_obj = datetime.strptime(dt, '%Y/%m/%d %H:%M:%S')
    return datetime.strftime(date_obj, '%Y-%m-%d')


def api_caller(session: requests.Session, url: str, body: dict, msg_prefix: str, retry: int = 0):
    resp = session.post(url, json=body)
    if resp.status_code == 502:
        if retry > 10:
            raise Exception('abort with api retry count > 10')
        retry += 1
        LOG.warning(f'{msg_prefix} 502 error, {retry=}')
        time.sleep(30)
        return api_caller(session, url, body, msg_prefix, retry)
    if resp.status_code != 200:
        msg = f'{msg_prefix} error, status code: {resp.status_code}, text: {resp.text}'
        LOG.error(msg)
        raise Exception(msg)
    return resp.json()


def convertCouponData(data: dict, coupon_code: str):
    try:
        detail = data['FoodDetail']
    except KeyError:
        LOG.error(f'food detail not found in {data=}')
        raise
    if len(detail) != 1:
        LOG.error(f'unknown food detail format, {detail=}')
        raise ValueError(f'unknown food detail format, {detail=}')
    detail = detail[0]

    # food details
    items = []
    price = detail['Original_Price']
    for food in detail['Details']:
        main_item = food['MList'][0]
        item = {
            'name': main_item['Name'],
            'count': food['MinCount'],
            'addition_price': main_item['AddPrice'],
            'flavors': [],
        }
        price += main_item['MListPrice'] * food['MinCount']
        for flavor in food['MList'][1:]:
            item['flavors'].append({
                'name': flavor['Name'],
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


def initSession() -> requests.Session:
    session = requests.Session()
    session.headers['User-Agent'] = USER_AGENT
    session.headers['origin'] = 'https://www.kfcclub.com.tw'
    session.headers['referer'] = 'https://www.kfcclub.com.tw/'
    return session


def initDeliveryInfo(session: requests.Session):
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


def getCouponData(session: requests.Session, coupon_code: str) -> dict:
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
        LOG.debug(f'coupon code({coupon_code}) is invalid')
        return None
    if resp.get('Message') != 'OK' or not resp.get('Success'):
        msg = f'get voucher info response error, json: {resp}'
        LOG.error(msg)
        raise Exception(msg)

    
    try:
        product_code = resp['Data']['productCode']
    except KeyError:
        LOG.error(f'get product code error: coupon code: {coupon_code}, json: {resp}')
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
        LOG.debug(f'coupon code({coupon_code}) is invalid in all periods')
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
    session = initSession()
    initDeliveryInfo(session)

    coupon_by_code = {}
    ranges = ((24000, 26000), (40000, 41000), (50000, 51000), (13000, 15000))

    for r in ranges:
        for coupon_code in range(r[0], r[1]):
            LOG.info(f'getting coupon {coupon_code}...')
            try:
                data = getCouponData(session, coupon_code)
            except (KeyError, ValueError) as e:
                LOG.error(str(e))
                continue
            if not data:
                continue

            try:
                food_data = convertCouponData(data, coupon_code)
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

if __name__ == '__main__':
    main()
