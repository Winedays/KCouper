import json

import requests

from utils import LOG, api_caller, init_delivery_info, init_session


def get_single_produce_data(session: requests.Session) -> dict:
    # Get morning menu ID
    resp = api_caller(
        session,
        'https://olo-api.kfcclub.com.tw/menu/v1/GetQueryMenu',
        {
            # 不指定時段&店鋪
            'ismember': '0',
            'mealperiod': '0',
            'orderdate': '',
            'ordertype': '0',
            'parentid': '0',
            'shopcode': '',
        },
        'get single menu info',
    )
    if resp.get('Message') != 'OK' or not resp.get('Success'):
        msg = f'get single menu info response error, json: {resp}'
        LOG.error(msg)
        raise Exception(msg)

    menu_ids = []
    titles = {'炸雞/紙包雞', '漢堡', '蛋撻', '點心/飲料', '早餐'}
    for _menu in resp.get('Data', {}).get('Menu', []):
        if _menu.get('Title', '') in titles:
            menu_ids.append(_menu.get('MenuID'))
    if not menu_ids:
        raise ValueError('dinner menu not found')

    # Get food data
    details = []
    for menu_id in menu_ids:
        resp = api_caller(
            session,
            'https://olo-api.kfcclub.com.tw/menu/v1/GetQueryFood',
            {
                'IsPKAPP': '0',
                'ismember': '0',
                'mealperiod': '0',
                'menuid': menu_id,
                'orderdate': '',
                'ordertype': '0',
                'parentid': '0',
                'shopcode': '',
            },
            'get food info',
        )
        if resp.get('Message') != 'OK' or not resp.get('Success'):
            msg = f'get food info response error, json: {resp}'
            LOG.error(msg)
            raise Exception(msg)

        for _food in resp.get('Data', {}).get('Foods', []):
            if '套餐' in _food.get('Title', ''):
                continue

            details.extend(_food.get('Details', []))
    if not details:
        raise ValueError('single produce not found')
    return details


def convert_single_produce_data(query_data: dict) -> dict:
    produces = {}
    for _d in query_data:
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
        query_data = get_single_produce_data(session)
    except (KeyError, ValueError) as e:
        LOG.error(str(e))
        return

    try:
        food_data = convert_single_produce_data(query_data)
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
