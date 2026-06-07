import { useState, useEffect } from "react";
import type { Coupon, CouponDict, SingleDict } from "@/data/coupons";

/**
 * Mapping of various item name variations to a standard name for price lookup
 */
const SINGLE_PRODUCT_NICKNAME: Record<string, string> = {
    '原味蛋撻': '原味蛋撻',
    '原味蛋撻超極酥': '原味蛋撻',
    '原蛋': '原味蛋撻',
    '雞塊': '上校雞塊',
    '4雞塊': '上校雞塊4塊',
    '8雞塊': '上校雞塊8塊',
    '冰檸檬紅茶(小)': '立頓檸檬風味紅茶(小)',
    '冰檸檬紅茶(中)': '立頓檸檬風味紅茶(中)',
    '無糖綠茶(小)': '冰無糖綠茶(小)',
    '無糖綠茶(中)': '冰無糖綠茶(中)',
    '青花椒香麻咔啦雞腿堡': '青花椒咔啦雞腿堡',
    '魚圈圈': '鱈魚圈圈',
    '薯條(小)': '香酥脆薯(小)',
    '小薯': '香酥脆薯(小)',
    '薯條(中)': '香酥脆薯(中)',
    '中薯': '香酥脆薯(中)',
    '薯條(大)': '香酥脆薯(大)',
    '大薯': '香酥脆薯(大)',
    '黃金超蝦塊': '黃金超蝦塊3塊',
    '蘋果汁': '100%蘋果汁',
    '黃金魚子海陸堡': '黃金魚子海陸Q蝦堡',
    '原味脆雞堡': '原味脆雞堡(小)',
    '花生脆雞堡': '花生脆雞堡(小)',
    '花生起司蛋堡': '花生起司蛋堡(小)',
}

/**
 * Items to exclude from original price calculation
 */
const EXCLUDE_ITEMS = [
  '糖醋醬',
  '響應環保不需湯匙',
  '不需刀叉及手套',
  '響應環保不需叉子',
];

const EXCLUDE_ITEMS_REGEX = new RegExp(EXCLUDE_ITEMS.join('|'));

/**
 * Units to look for in price calculation, e.g. "2塊", "3份"
 */
const UNIT_WORD = [
    '塊',
    '份',
    '顆',
    '入',
]

const SITE_CASE_FOR_PRICE = new RegExp(`20:00前供應|\\(辣\\)|\\(不辣\\)|[1-9][0-9]*(${UNIT_WORD.join('|')})`, 'g')

/**
 * @typedef {Object} UseCouponsResult
 * @property {Coupon[]} coupons - Array of all coupons
 * @property {Record<string, Coupon>} couponByCode - Map of coupon_code to Coupon
 * @property {number} count - Total number of coupons
 * @property {string} lastUpdate - Last update timestamp
 * @property {boolean} isLoading - Whether coupons are still loading
 * @property {Error | null} error - Error if loading failed
 */
type UseCouponsResult = {
  coupons: Coupon[];
  couponByCode: Record<string, Coupon>;
  count: number;
  lastUpdate: string;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Calculate original price for an item based on singleDict
 * @param {string} name - Item name
 * @param {number} count - Item count
 * @param {SingleDict} singleDict - Single item dictionary
 * @returns {number} Original price for the item
 * @throws {Error} If item not found in singleDict
 */
function calculateOriginalPrice(name: string, count: number, singleDict: SingleDict): number {
  // walk around for 2塊咔啦脆雞
  if (name === '2塊咔啦脆雞(辣)') {
      name = '咔啦脆雞';
      count *= 2;
  }
  // walk around for 2入原味蛋撻
  if (name === '2入原味蛋撻' || name === '2入原味蛋撻超極酥') {
      name = '原味蛋撻';
      count *= 2;
  }

  const renderName = name.replace(SITE_CASE_FOR_PRICE, '').trim();
  if (renderName === '咔啦脆雞') {
      const numTwos = Math.floor(count / 2);
      const numOnes = count % 2;
      return numTwos * singleDict['咔啦脆雞2塊'].price + numOnes * singleDict['咔啦脆雞'].price;
  } else if (singleDict[renderName] !== undefined){
      return singleDict[renderName].price * count;
  } else if (name === '上校雞塊') {
      if (count === 4) {
          return singleDict['上校雞塊4塊'].price;
      } else if (count === 8) {
          return singleDict['上校雞塊8塊'].price;
      } else if (count === 20) {
          return singleDict['上校雞塊分享盒(20塊)'].price;
      }
      throw new Error('Cannot find item');
  } else if (name === '上校雞塊4塊' || name === '4塊雞塊' || name === '4塊上校雞塊') {
      return singleDict['上校雞塊4塊'].price * count;
  } else if (name === '上校雞塊8塊' || name === '8塊雞塊' || name === '8塊上校雞塊') {
      return singleDict['上校雞塊8塊'].price * count;
  } else {
      // try to split by '+' first
      const splitNames = name.split('+').map(n => n.trim());
      let _price = 0;
      if (splitNames.length > 1) {
          splitNames.forEach(n => {
              _price += calculateOriginalPrice(n, count, singleDict);
          })
          if (_price > 0) {
              return _price;
          }
      }
      throw new Error('Cannot find item');
  }
}

/**
 * Process coupons to calculate original_price and discount based on singleDict and
 * map raw item names to nicknames/standard names
 * @param {Coupon[]} coupons - Array of coupons to process
 * @param {SingleDict} singleDict - Single item dictionary
 * @returns {Coupon[]} Processed coupons with calculated original_price and discount
 */
function processCouponsWithPrices(coupons: Coupon[], singleDict: SingleDict): Coupon[] {
  return coupons.map(coupon => {
    let originalPrice = 0;
    let canGetOriginalPrice = true;

    const processedItems = coupon.items.map(item => {
      const nickname = SINGLE_PRODUCT_NICKNAME[item.name];
      return nickname ? { ...item, name: nickname } : item;
    });

    processedItems.forEach(({ name, count }) => {
      if (EXCLUDE_ITEMS_REGEX.test(name) || !canGetOriginalPrice) return;

      try {
        originalPrice += calculateOriginalPrice(name, count, singleDict);
      } catch {
        // console.log(`Cannot find item: ${name} in coupon code: ${coupon.coupon_code}`);
        originalPrice = 0;
        canGetOriginalPrice = false;
      }
    });

    let discount: number = 10;
    if (canGetOriginalPrice && originalPrice > coupon.price) {
      discount = parseFloat(((coupon.price / originalPrice) * 10).toFixed(1));
    }

    return {
      ...coupon,
      items: processedItems,
      original_price: originalPrice,
      discount,
    };
  });
}

function loadDynamicScript(baseSrc: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const src = `${baseSrc}?t=${Date.now()}`;
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Ensure data script is loaded.
 * Checks for global variable, existing script tag, or loads dynamically.
 * @param {string} url - Script source URL
 * @param {string} variableName - Global variable name to check
 * @returns {Promise<void>}
 */
function ensureDataLoaded(url: string, variableName: keyof Window): Promise<void> {
  if (window[variableName]) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const scripts = document.querySelectorAll(`script[src*="${url}"]`);
    let existingScript: HTMLScriptElement | null = null;

    // Look for an async/defer script that might be loading
    for (let i = 0; i < scripts.length; i++) {
      const s = scripts[i] as HTMLScriptElement;
      if (s.async || s.defer) {
        existingScript = s;
        break;
      }
    }

    if (existingScript) {
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        existingScript!.removeEventListener('load', onLoad);
        existingScript!.removeEventListener('error', onError);
        clearTimeout(timeoutId);
      };

      const onLoad = () => {
        cleanup();
        if (window[variableName]) {
          resolve();
        } else {
          // Script loaded but variable missing? Fallback to dynamic load
          loadDynamicScript(url).then(resolve).catch(reject);
        }
      };

      const onError = () => {
        cleanup();
        loadDynamicScript(url).then(resolve).catch(reject);
      };

      existingScript.addEventListener('load', onLoad);
      existingScript.addEventListener('error', onError);

      // Timeout for existing script
      const timeoutId = setTimeout(() => {
        cleanup();
        loadDynamicScript(url).then(resolve).catch(reject);
      }, 3000);

      return;
    }

    // No existing async script found, or blocking script failed (since var is missing)
    loadDynamicScript(url).then(resolve).catch(reject);
  });
}

/**
 * Hook to load and access coupon data from the external coupon.js file
 * Automatically calculates original_price and discount using single.js data
 * @returns {UseCouponsResult} The coupons data and loading state
 */
export function useCoupons(): UseCouponsResult {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponByCode, setCouponByCode] = useState<Record<string, Coupon>>({});
  const [count, setCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load both scripts in parallel if needed
        await Promise.all([
          ensureDataLoaded('/coupon.js', 'COUPON_DICT'),
          ensureDataLoaded('/single.js', 'SINGLE_DICT')
        ]);

        if (!window.COUPON_DICT) {
          throw new Error("COUPON_DICT not found after loading coupon.js");
        }

        const couponDict: CouponDict = window.COUPON_DICT;

        // If SINGLE_DICT is available, calculate prices; otherwise use original data
        let processedCoupons: Coupon[];
        if (window.SINGLE_DICT) {
          const singleDict: SingleDict = window.SINGLE_DICT;
          processedCoupons = processCouponsWithPrices(couponDict.coupon_list, singleDict);
        } else {
          // Use original coupon data without recalculating prices
          console.warn("SINGLE_DICT not available, using original coupon prices");
          processedCoupons = couponDict.coupon_list;
        }

        // Build couponByCode with processed coupons
        const processedByCode: Record<string, Coupon> = {};
        processedCoupons.forEach(coupon => {
          processedByCode[String(coupon.coupon_code)] = coupon;
        });

        setCoupons(processedCoupons);
        setCouponByCode(processedByCode);
        setCount(couponDict.count);
        setLastUpdate(couponDict.last_update);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err : new Error("Unknown error loading data"));
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    coupons,
    couponByCode,
    count,
    lastUpdate,
    isLoading,
    error,
  };
}
