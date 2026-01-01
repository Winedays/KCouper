import json
import os
from datetime import datetime, timedelta, timezone

import requests

from utils import LOG, api_caller, init_delivery_info, init_session


SHOP_CODE = os.getenv('SHOP_CODE')


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
