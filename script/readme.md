## API Documentation

### Overview

This tool interacts with KFC Taiwan's online ordering API to gather coupon information and check coupon validity. The tool supports four main modes: `main` (full coupon gathering), `quick` (incremental update), `check` (coupon existence verification), and `single` (single product queries).

### API Call Flow

#### Main Mode (`--mode main`)
1. **Session Initialization**
   - `init_session()`: Creates HTTP session with proper headers

2. **Delivery Info Initialization**
   - `init_delivery_info()`: Calls `QueryDeliveryShops` and `QueryDeliveryTime`

3. **Coupon Data Collection** (for each coupon range)
   - `get_coupon_data()`: Calls `getEVoucherAPI`, `checkCouponProduct`, `GetQueryFoodDetail`
   - `checkCouponProduct` is called for each order type (`1` = delivery, `2` = pickup) and meal period (`1`-`5`). Each coupon stores the applicable `order_types` (e.g. `[1, 2]`) and `meal_periods` as the union of valid meal periods

#### Quick Mode (`--mode quick`)
Performs an incremental update similar to main mode but reuses valid existing coupon data to speed up the collection process.

#### Check Mode (`--mode check`)
1. **Session Initialization**
   - `init_session()`: Creates HTTP session with proper headers

2. **Delivery Info Initialization**
   - `init_delivery_info()`: Calls `QueryDeliveryShops` and `QueryDeliveryTime`

3. **Coupon Existence Check** (for each check range)
   - `check_coupon_exist()`: Calls `getEVoucherAPI`

#### Single Query Mode (`--mode single`)
1. **Session Initialization**
   - `init_session()`: Creates HTTP session with proper headers

2. **Delivery Info Initialization**
   - `init_delivery_info()`: Calls `QueryDeliveryShops` and `QueryDeliveryTime`

3. **Single Product Query**
   - Queries individual products to collect standalone prices and outputs to `single.json` and `public/single.js`

### API Details

#### 1. QueryDeliveryShops

**Purpose**: Get delivery shop information

**Input Parameters**:
```json
{
  "shopCode": "TWI104",     // Shop code (string)
  "orderType": "2",         // Order type: "1" for delivery, "2" for pickup (string)
  "platform": "1"           // Platform identifier (string)
}
```

**Output Structure**:
```json
{
  "Success": true,          // API call success flag (boolean)
  "Message": "OK",          // Response message (string)
  "Data": {
    "ShopCode": "TWI104",                           // Shop code (string)
    "ShopName": "台北雙連餐廳(雙連捷運站2號)",     // Shop name (string)
    "CityName": "台北市",                           // City name (string)
    "AreaName": "中山區",                           // Area name (string)
    "Addr": "台北市中山區民生西路9號",             // Full address (string)
    "OpeningTime": "每日08:00-24:00",               // Opening hours (string)
    "LON": "121.521610000000",                      // Longitude (string)
    "LAT": "25.057911999800",                       // Latitude (string)
    "IsBreakfast": true,                            // Breakfast service available (boolean)
    "IsInCar": false,                               // In-car service available (boolean)
    "IsTracker": true,                              // Order tracking available (boolean)
    "IsFoodLocker": false,                          // Food locker available (boolean)
    "BusinessName": "富利餐飲股份有限公司台北雙連分公司", // Business name (string)
    "VATNumber": "53017114",                        // VAT number (string)
    "GUINumber": "A-197161500-00026-5",             // GUI number (string)
    "RegisterAddress": "臺北市中山區民生西路9號",   // Registered address (string)
    "QuoTime1": "25",                               // Quota time 1 (string)
    "QuoTime2": "1",                                // Quota time 2 (string)
    "AddQT": "0",                                   // Additional quota time (string)
    "SdeQuoTime": "0",                              // Side quota time (string)
    "Zone": "",                                     // Zone information (string)
    "BaseAmount": "399",                            // Base order amount (string)
    "FixedShipping": true,                          // Fixed shipping cost (boolean)
    "Freight_Key": "ZZ798",                         // Freight key (string)
    "Freight_Amount": "39",                         // Freight amount (string)
    "ePayment": true,                               // Electronic payment available (boolean)
    "CRM_CouponUsed": true,                         // CRM coupon accepted (boolean)
    "Edenred_CouponUsed": true,                     // Edenred coupon accepted (boolean)
    "CashPay": true,                                // Cash payment accepted (boolean)
    "CreditCard": true,                             // Credit card accepted (boolean)
    "JKOPay": true,                                 // JKO Pay accepted (boolean)
    "ApplePay": false,                              // Apple Pay accepted (boolean)
    "GooglePay": false,                             // Google Pay accepted (boolean)
    "LinePay": true,                                 // Line Pay accepted (boolean)
    "PXPay": true,                                  // PX Pay accepted (boolean)
    "iCashPay": true,                               // iCash Pay accepted (boolean)
    "EasyWallet": true,                             // Easy Wallet accepted (boolean)
    "deliveryDate": ["2025/01/12", ...],            // Available delivery dates (array of strings)
    "downlevel": "0",                               // Down level (string)
    "IsDrivewayPickup": false,                      // Driveway pickup available (boolean)
    "RedeemPoint": true,                            // Point redemption available (boolean)
    "KFC_CouponUsed": true,                         // KFC coupon accepted (boolean)
    "KFC_EVoucherVer1Used": true,                   // KFC e-voucher v1 accepted (boolean)
    "KFC_EVoucherVer2Used": true,                   // KFC e-voucher v2 accepted (boolean)
    "KFC_EVoucherVer3Used": true,                   // KFC e-voucher v3 accepted (boolean)
    "KFC_EVoucherVer4Used": true                    // KFC e-voucher v4 accepted (boolean)
  }
}
```

#### 2. QueryDeliveryTime

**Purpose**: Get delivery time information

**Input Parameters**:
```json
{
  "shopCode": "TWI104",     // Shop code (string)
  "orderType": "2",         // Order type: "1" for delivery, "2" for pickup (string)
  "orderDate": "2025/01/13", // Order date in YYYY/MM/DD format (string)
  "addQt": "0",             // Additional quota (string)
  "sdeQt": "0"              // Side quota (string)
}
```

**Output Structure**:
```json
{
  "Success": true,          // API call success flag (boolean)
  "Message": "OK",          // Response message (string)
  "Data": {
    "sHour": "8",           // Start hour (string)
    "eHour": "22",          // End hour (string)
    "sMinute": "20",        // Start minute (string)
    "eMinute": "30",        // End minute (string)
    "qt": "1",              // Quota (string)
    "status": "1",          // Status (string)
    "downlevel": "0",       // Down level (string)
    "interval": "5",        // Time interval in minutes (string)
    "message": "",          // Message (string)
    "promptLock": "",       // Prompt lock (string)
    "promptMessage": "",    // Prompt message (string)
    "LockTimePeriod": null  // Lock time period (null or object)
  }
}
```

#### 3. getEVoucherAPI

**Purpose**: Get e-voucher information

**Input Parameters**:
```json
{
  "voucherNo": "24693",     // Voucher/coupon code (string)
  "phone": "",              // Phone number (empty string)
  "memberId": "",           // Member ID (empty string)
  "orderType": "2",         // Order type: "1" for delivery, "2" for pickup (string)
  "mealPeriod": "3",        // Meal period: "1"=breakfast, "2"=lunch, "3"=dinner, "4"=supper (string)
  "shopCode": "TWI104"      // Shop code (string)
}
```

**Output Structure**:
```json
{
  "Success": true,          // API call success flag (boolean)
  "Message": "OK",          // Response message: "OK" or "無效的票劵" (invalid coupon) (string)
  "Data": {
    "itemType": "I",        // Item type: "I" for item (string)
    "amount": null,         // Amount (null or number)
    "productCode": "TA5484", // Product code (string)
    "balance": null,        // Balance (null or number)
    "discountAmount": null, // Discount amount (null or number)
    "voucherType": "C",     // Voucher type: "C" for coupon (string)
    "voucherId": "5575",    // Voucher ID (string)
    "version": "6",         // Version (string)
    "voucherCode": "24693", // Voucher code (string)
    "productName": "24693-中華電信歡迎" // Product name (string)
  }
}
```

#### 4. checkCouponProduct

**Purpose**: Check if coupon is valid for specific date and meal period

**Input Parameters**:
```json
{
  "orderDate": "2025/01/13", // Order date in YYYY/MM/DD format (string)
  "orderType": "2",         // Order type: "1" for delivery, "2" for pickup (string)
  "mealPeriod": "3",        // Meal period: "1"=breakfast, "2"=lunch, "3"=dinner, "4"=supper (string)
  "shopCode": "TWI104",     // Shop code (string)
  "couponCode": "24693",    // Coupon code (string)
  "memberId": ""            // Member ID (empty string)
}
```

**Output Structure**:
```json
{
  "Success": true,          // API call success flag (boolean)
  "Message": "OK"           // Response message (string)
}
```

#### 5. GetQueryFoodDetail

**Purpose**: Get detailed food information for a product

**Input Parameters**:
```json
{
  "shopcode": "TWI104",     // Shop code (string)
  "fcode": "TA5484",        // Food code (string)
  "menuid": "",             // Menu ID (empty string)
  "mealperiod": "3",        // Meal period: "1"=breakfast, "2"=lunch, "3"=dinner, "4"=supper (string)
  "ordertype": "2",         // Order type: "1" for delivery, "2" for pickup (string)
  "orderdate": "2025/01/13" // Order date in YYYY/MM/DD format (string)
}
```

**Output Structure**:
```json
{
  "Success": true,          // API call success flag (boolean)
  "Message": "OK",          // Response message (string)
  "Data": {
    "FoodDetail": [
      {
        "Name": "Product Name",                    // Product name (string)
        "Fcode": "TA5484",                        // Food code (string)
        "Original_Price": 149,                    // Original price (number)
        "StartDate": "2025/01/01 00:00:00",       // Start date (string)
        "EndDate": "2025/12/31 23:59:59",         // End date (string)
        "Details": [
          {
            "MinCount": 1,                       // Minimum count (number)
            "MList": [
              {
                "Name": "Main Item Name",         // Main item name (string)
                "AddPrice": 0,                    // Additional price (number)
                "MListPrice": 149                 // Menu list price (number)
              },
              // Additional flavor options...
            ]
          }
        ]
      }
    ]
  }
}
```

### Environment Variables

The tool requires the following environment variables (set in `.env` file):

- `SHOP_CODE`: Shop code (e.g., "TWI104")
- `COUPON_RANGES`: Comma-separated coupon code ranges for main mode (e.g., "20000-25000,30000-35000")
- `CHECK_RANGES`: Comma-separated coupon code ranges for check mode (e.g., "24000-25000")
- `EXCLUDE_NAMES`: Comma-separated list of names to exclude (optional)

### Usage

```bash
# Run in main mode (full coupon gathering)
pipenv run python script/kfc.py --mode main

# Run in quick mode (incremental update)
pipenv run python script/kfc.py --mode quick

# Run in check mode (verify coupon existence)
pipenv run python script/kfc.py --mode check

# Run in single mode (query single product prices)
pipenv run python script/kfc.py --mode single
```

### Error Handling

- All API calls include retry logic for 502 errors (up to 10 retries)
- Invalid coupons return "無效的票劵" message
- Network errors and invalid responses are logged and handled appropriately  
