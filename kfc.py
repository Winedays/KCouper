# -*- coding: utf-8 -*-
import time
import json
import xml.etree.ElementTree as ET

from bs4 import BeautifulSoup
import requests  #使用requests套件的requests.get()方法

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'

session = requests.Session()
session.headers['User-Agent'] = USER_AGENT
session.headers['origin'] = 'https://www.kfcclub.com.tw'
session.headers['referer'] = 'https://www.kfcclub.com.tw/' # 'https://www.kfcclub.com.tw/Coupon'

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

coupon_dict = {}
for coupon_code in range(23501, 23502):
    # coupon_code = '23501'
    resp = session.post(f'https://www.kfcclub.com.tw/GetCouponData/{coupon_code}')
    '''
    '<NewDataSet>\r\n  <tablename>\r\n    <Column1>tablename</Column1>\r\n    <Column2>Coupon</Column2>\r\n    <Column3>Coupon_Product</Column3>\r\n    <Column4>Coupon_SpecificProducts</Column4>\r\n  </tablename>\r\n  <Coupon>\r\n    <CouponID>3773</CouponID>\r\n    <CouponCode>23501</CouponCode>\r\n    <Title>23501-MOMO春季野餐</Title>\r\n    <Title1 />\r\n    <DataType>2</DataType>\r\n    <StartDate>2023-02-10 00:00:00</StartDate>\r\n    <EndDate>2023-04-30 23:59:59</EndDate>\r\n    <MealPeriod_ID>2,3,4,5</MealPeriod_ID>\r\n    <SpecifiedDate />\r\n    <LimitQuantity>0</LimitQuantity>\r\n    <UsageQuantity>0</UsageQuantity>\r\n    <OptionalItems>1</OptionalItems>\r\n   
    <Delivery>False</Delivery>\r\n    <TakeOut>True</TakeOut>\r\n    <SpecifiedAmount>0</SpecifiedAmount>\r\n    <MemberOnly>False</MemberOnly>\r\n    <GiftWithPurchase>False</GiftWithPurchase>\r\n    <ExcludeShops />\r\n    <ProductLimitQuantity>20</ProductLimitQuantity>\r\n  </Coupon>\r\n  <Coupon_Product>\r\n    <ProductCode>TA3509</ProductCode>\r\n    <Sort>1</Sort>\r\n  </Coupon_Product>\r\n</NewDataSet>'
    '''
    if resp.status_code != 200:
        # print(f'get coupon data error: {resp.text}')
        continue

    # Getting the value of ProductCode for Coupon_Product elements
    root = ET.fromstring(resp.text)
    coupon_product = root.find("./Coupon_Product")
    if coupon_product is None:
        print(f'get Coupon_Product error: {resp.text}')
        continue

    product_code = coupon_product.find("ProductCode").text # outputs "TA3509"
    resp = session.post(f'https://www.kfcclub.com.tw/meal/{product_code}')
    if resp.status_code != 200:
        print(f'get product data error: {resp.text}')
        continue

    soup = BeautifulSoup(resp.text, 'html.parser')
    foods = soup.findAll('div', 'divFoodData')
    '''
    <div class="divFoodData divFoodData_Mtype_AA" food-data='{"Code":"AA","Name":"炸雞","ImageName":"咔啦脆雞(中辣).png","UI":"塊","Max_d":2,"Min_d":2,"BuyType":"Mtype","BasePrice":"0"}' style="display:none"></div>
    <div class="divFoodData divFoodData_Mtype_VV" food-data='{"Code":"VV","Name":"配餐","ImageName":"原味蛋撻.png","UI":"份","Max_d":1,"Min_d":1,"BuyType":"Mtype","BasePrice":"0"}' style="display:none"></div>
    '''

    item_list = []
    for f in foods:
        d = json.loads(f.get('food-data', '{}'))
        max_item = d.get('Max_d', 0)
        min_item = d.get('Min_d', 0)
        name = d.get('ImageName', '').split('.')[0]
        item_list.append({'name': name, 'max_item': max_item, 'min_item':min_item, 'product_code': product_code})
    coupon_dict[coupon_code] = item_list
    time.sleep(0.25)

with open('coupon.json', 'w', encoding='utf-8') as fp:
    json.dump(coupon_dict, fp, ensure_ascii=False)

