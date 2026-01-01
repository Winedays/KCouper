import logging
import sys
import time
from datetime import datetime

import requests


USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'


def get_logger() -> logging.Logger:
    FORMAT = '[%(levelname)s] %(asctime)s %(filename)s(%(lineno)d): %(message)s'
    fileHandler = logging.FileHandler('debug.log', mode='w')
    streamHandler = logging.StreamHandler(sys.stdout)
    logging.basicConfig(level=logging.INFO, format=FORMAT, handlers=[fileHandler, streamHandler])
    return logging.getLogger('kcouper')


LOG = get_logger()


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

