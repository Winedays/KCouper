/**
 * @typedef {Object} ItemFlavor
 * @property {string} name - The name of the flavor
 * @property {number} addition_price - The additional price for this flavor
 */
export type ItemFlavor = {
  name: string;
  addition_price: number;
};

/**
 * @typedef {Object} CouponItem
 * @property {string} name - The name of the item
 * @property {number} count - The count of this item that can be purchased
 * @property {number} addition_price - The additional price for this item
 * @property {ItemFlavor[]} flavors - The additional flavors for this item
 */
export type CouponItem = {
  name: string;
  count: number;
  addition_price: number;
  flavors: ItemFlavor[];
};

/**
 * @typedef {Object} Coupon
 * @property {string} name - The name of the coupon
 * @property {string} product_code - The product code of the coupon
 * @property {number} coupon_code - The code of the coupon
 * @property {CouponItem[]} items - The array of items in the coupon
 * @property {string} start_date - The start date of the coupon
 * @property {string} end_date - The end date of the coupon
 * @property {number} price - The price of the coupon
 * @property {number} original_price - The original price of the coupon
 * @property {number} discount - The discount of the coupon
 * @property {number[]} [meal_periods] - Available meal periods (1: 早餐, 2: 午餐, 3: 下午茶, 4: 晚餐, 5: 宵夜)
 */
export type Coupon = {
  name: string;
  product_code: string;
  coupon_code: number;
  items: CouponItem[];
  start_date: string;
  end_date: string;
  price: number;
  original_price: number;
  discount: number;
  meal_periods?: number[];
};

/**
 * @typedef {Object} CouponDict
 * @property {Record<string, Coupon>} coupon_by_code - Map of coupon_code to Coupon object
 * @property {Coupon[]} coupon_list - Array of all coupons
 * @property {number} count - Total number of coupons
 * @property {string} last_update - Last update timestamp
 */
export type CouponDict = {
  coupon_by_code: Record<string, Coupon>;
  coupon_list: Coupon[];
  count: number;
  last_update: string;
};

/**
 * @typedef {Object} SingleItem
 * @property {string} code - 產品代碼
 * @property {string} name - 產品名稱
 * @property {number} price - 價格
 * @property {string} nutrition - 營養資訊
 */
export type SingleItem = {
  code: string;
  name: string;
  price: number;
  nutrition: string;
};

/**
 * @typedef {Object} SingleDict
 * @description Map of item name to SingleItem object
 */
export type SingleDict = Record<string, SingleItem>;

// Declare global COUPON_DICT and SINGLE_DICT from external js files
declare global {
  interface Window {
    COUPON_DICT?: CouponDict;
    SINGLE_DICT?: SingleDict;
  }
}
