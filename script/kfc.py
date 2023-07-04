# -*- coding: utf-8 -*-
from datetime import datetime, timedelta
import time
import json
import xml.etree.ElementTree as ET
from typing import Dict
 
from bs4 import BeautifulSoup
import requests

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'

EXCLUDE_NAMES = ['不需刀叉及手套', '需要刀叉及手套']

def get_date(dt: str) -> str:
    date_obj = datetime.strptime(dt, '%Y-%m-%d %H:%M:%S')
    return datetime.strftime(date_obj, '%Y-%m-%d')

def parseIntComma(int_str):
    return int(int_str.replace(',', ''))

def get_default_items(soup: BeautifulSoup) -> Dict:
    '''
    <div class="divFoodData divFoodData_Mtype_AA" food-data='{"Code":"AA","Name":"炸雞","ImageName":"咔啦脆雞(中辣).png","UI":"塊","Max_d":2,"Min_d":2,"BuyType":"Mtype","BasePrice":"0"}' style="display:none"></div>
    <div class="divFoodData divFoodData_Mtype_VV" food-data='{"Code":"VV","Name":"配餐","ImageName":"原味蛋撻.png","UI":"份","Max_d":1,"Min_d":1,"BuyType":"Mtype","BasePrice":"0"}' style="display:none"></div>
    <span class="small-price">
        <span class="singleM">餐點 </span>$<span class="integer"><span id="MealTotalPriceNoDiscount">100</span></span>
    </span>
    '''
    default_foods = []

    # //本份餐點包含加購的價錢
    upa_div = soup.find('div', id='Upa_Group')
    if not upa_div or not upa_div.text:
        return None
    total_price = parseIntComma(upa_div.text)
    # promotion_price = 0
    
    food_data_divs = soup.findAll('div', 'divFoodData')
    if not food_data_divs:
        return None

    for food_div in food_data_divs:
        food_data = json.loads(food_div.get("food-data", '{}'))

        if food_data:
            # max_item = food_data.get('Max_d', 0)
            min_item = food_data.get('Min_d', 0)
            mtype = food_data.get('Code', '')
            buy_type = food_data.get('BuyType', '')
            base_price = int(food_data.get('BasePrice', 0))

            # 設定餐點的預設值, ref: FoodSelected function
            if min_item > 0:
                if product_divs := soup.find_all('div', f"divMList_{mtype}"):
                    # 餐點預設值
                    default_product = product_divs[0]
                    product = json.loads(default_product.get("mlist-data"))
                    if not product:
                        continue
                    
                    name = product.get("Name", "")
                    if name in EXCLUDE_NAMES:
                        continue

                    # mcode = product.get("MCode", "")
                    # scale = product.get("Scale", "")
                    new_price = int(product.get("Price_New", 0))
                    addition_price = min_item * (new_price + base_price)
                    if buy_type == "Mtype":
                        total_price += addition_price

                    food = {
                        'name': name,
                        'count': min_item,
                        'addition_price': addition_price,
                    }

                    # 餐點口味, ref: ChangeMealFlavorType fuction
                    # 暫時忽略Promotion加購產品
                    addition_flavors = []
                    if buy_type != "Promotion":
                        flavor_divs = product_divs[1:] if len(product_divs) > 1 else []
                        for _flavor in flavor_divs:
                                product = json.loads(_flavor.get("mlist-data"))
                                name = product.get("Name", "")
                                new_price = int(product.get("Price_New", 0))
                                scale = int(product.get("Scale", 1))
                                addition_price = scale * (base_price + new_price)
                                addition_flavors.append({
                                'name': name,
                                'addition_price': addition_price, 
                                })

                    food['flavors'] = addition_flavors
                    default_foods.append(food)

    return {
        'price': total_price,
        'items': default_foods,
    }

def main():
    session = requests.Session()
    session.headers['User-Agent'] = USER_AGENT
    session.headers['origin'] = 'https://www.kfcclub.com.tw'
    session.headers['referer'] = 'https://www.kfcclub.com.tw/'

    resp = session.post('https://www.kfcclub.com.tw/api/WebAPI/JsonGetData', data={'data': '{"ordertype":"2","time":"15:00","_APIMethod":"GetMeal_PeriodID"}'})
    '''
    resp.json()
    {'Meal_Period': {'ID': '3', 'OrderType': '2', 'Name': '一般時段：10:30~22:30', 'StartTime': '14:01', 'EndTime': '17:00', 'Sort': '3', 'DayType': '1', 'Step1_Msg': '指定
    取餐時間請於點餐完成後之結帳頁面選擇。<br />\r\n「下午茶聰明點」供應時間僅限週一~五下午14:00~下午17:00。當日預約「下午茶聰明點」餐點最晚預訂時間為下午16:30，其他餐點則不
    在此限。', 'Step3_Msg': '為確保餐點品質，請準時取餐，以確保產品最佳賞味期，若您超過取餐時間，我們將為您保留餐點10分鐘，感謝您的體諒。', 'OrderStartTime': '14:00', 'OrderEndTime': '16:30'}}
    '''
    # resp = session.post('https://www.kfcclub.com.tw/api/WebAPI/SetWebStorage',  data={'data': f'"Key":"MealPeriodInfo_Temp","Value": {json.dumps(resp.json(), ensure_ascii=False)}'})

    resp = session.post('https://www.kfcclub.com.tw/api/WebAPI/SetWebStorage', data = {'data': '{"Key":"OrderType","Value":"2"}'})
    resp = session.post('https://www.kfcclub.com.tw/api/WebAPI/SetWebStorage', data = {'data': '{"Key":"ShopCode","Value":"TWI074"}'})

    coupon_by_code = {}
    ranges = ((22000, 25000), (40000, 41000), (50000, 51000), )

    for r in ranges:
        print(f'getting coupun {r}...')
        for coupon_code in range(r[0], r[1]):
            resp = session.post(f'https://www.kfcclub.com.tw/GetCouponData/{coupon_code}')
            '''
            '<NewDataSet>\r\n  <tablename>\r\n    <Column1>tablename</Column1>\r\n    <Column2>Coupon</Column2>\r\n    <Column3>Coupon_Product</Column3>\r\n    <Column4>Coupon_SpecificProducts</Column4>\r\n  </tablename>\r\n  <Coupon>\r\n    
            <CouponID>3773</CouponID>\r\n    <CouponCode>23501</CouponCode>\r\n    <Title>23501-MOMO春季野餐</Title>\r\n    <Title1 />\r\n    <DataType>2</DataType>\r\n    <StartDate>2023-02-10 00:00:00</StartDate>\r\n    <EndDate>2023-04-30 23:59:59</EndDate>\r\n    
            <MealPeriod_ID>2,3,4,5</MealPeriod_ID>\r\n    <SpecifiedDate />\r\n    <LimitQuantity>0</LimitQuantity>\r\n    <UsageQuantity>0</UsageQuantity>\r\n    <OptionalItems>1</OptionalItems>\r\n   
            <Delivery>False</Delivery>\r\n    <TakeOut>True</TakeOut>\r\n    <SpecifiedAmount>0</SpecifiedAmount>\r\n    <MemberOnly>False</MemberOnly>\r\n    <GiftWithPurchase>False</GiftWithPurchase>\r\n    <ExcludeShops />\r\n    
            <ProductLimitQuantity>20</ProductLimitQuantity>\r\n  </Coupon>\r\n  <Coupon_Product>\r\n    <ProductCode>TA3509</ProductCode>\r\n    <Sort>1</Sort>\r\n  </Coupon_Product>\r\n</NewDataSet>'
            '''
            if resp.status_code != 200:
                print(f'get coupon data status error: {resp.text}')
                continue

            root = ET.fromstring(resp.text)

            # Extracting values for the first Coupon element    
            coupon = root.find("./Coupon")
            if coupon is None:
                # print(f'get Coupon error: {resp.text}')
                continue
            title = coupon.find("Title").text
            start_date = coupon.find("StartDate").text
            end_date = coupon.find("EndDate").text
            coupon_id = coupon.find("CouponID").text

            # Getting the value of ProductCode for Coupon_Product elements
            coupon_product = root.find("./Coupon_Product")
            if coupon_product is None:
                # print(f'get Coupon_Product error: {resp.text}')
                continue
            product_code = coupon_product.find("ProductCode").text # outputs "TA3509"

            resp = session.post(f'https://www.kfcclub.com.tw/meal/{product_code}')
            if resp.status_code != 200:
                print(f'get product data error: {resp.text}')
                continue

            soup = BeautifulSoup(resp.text, 'html.parser')
            if food_data := get_default_items(soup):
                coupon_by_code[coupon_code] = {
                    'name': title,
                    'product_code': product_code,
                    'coupon_code': coupon_code,
                    'coupon_id': coupon_id,
                    'price': food_data['price'],
                    'items': food_data['items'],
                    'start_date': get_date(start_date),
                    'end_date': get_date(end_date),
                }
            time.sleep(0.25)

    coupon_list = sorted(coupon_by_code.values(), key=lambda x: x["price"])
    utc_plus_eight_time = datetime.utcnow() + timedelta(hours=8)
    coupon_dict = {
        'coupon_by_code': coupon_by_code,
        'coupon_list': coupon_list,
        'count': len(coupon_list),
        'last_update': utc_plus_eight_time.strftime('%Y-%m-%d %H:%M:%S')
    }

    # with open('coupon.json', 'w', encoding='utf-8') as fp:
    #     json.dump(coupon_dict, fp, ensure_ascii=False)

    with open('coupon.js', 'w', encoding='utf-8') as fp:
        j_str = json.dumps(coupon_dict, ensure_ascii=False)
        fp.write(f'const COUPON_DICT={j_str}')

if __name__ == '__main__':
    main()
