/**
 * @typedef {Object} CouponItem
 * @property {string} name - The name of the item.
 * @property {number} count - The count of this item that can be purchased.
 * @property {number} addition_price - The addition price of this item that need to pay.
 * @property {ItemFlavors[]} flavors - The addition flavors of this item that can change.
 */

/**
 * @typedef {Object} ItemFlavors
 * @property {string} name - The name of the flavors.
 * @property {number} addition_price - The addition price of this flavors that need to pay.
 */

/**
 * @typedef {Object} Coupon
 * @property {string} name - The name of the coupon.
 * @property {string} product_code - The product code of the coupon.
 * @property {number} coupon_code - The code of the coupon.
 * @property {CouponItem[]} items - The array of items in the coupon.
 * @property {string} start_date - The start date of the coupon.
 * @property {string} end_date - The end date of the coupon.
 * @property {number} price - The price of the coupon.
 * @property {number} original_price - The original price of the coupon.
 * @property {number} discount - The discount of the coupon.
 */

/**
 * @type {string}
 */
const ORDER_LINK = 'https://www.kfcclub.com.tw/meal'

/**
 * @type {Coupon[]}
 */
const COUPONS = COUPON_DICT.coupon_list

/**
 * @type {Object.<number, Coupon>}
 */
const COUPONS_BY_CODE = COUPON_DICT.coupon_by_code

/**
 * @type {Set<number>}
 */
let favoriteCoupons = new Set()

/**
 * Load favorite coupons from localStorage
 */
function loadFavorites() {
    const stored = localStorage.getItem('favoriteCoupons')
    if (stored) {
        favoriteCoupons = new Set(JSON.parse(stored))
    }
}

/**
 * Save favorite coupons to localStorage
 */
function saveFavorites() {
    localStorage.setItem('favoriteCoupons', JSON.stringify([...favoriteCoupons]))
}

/**
 * Toggle favorite status for a coupon
 * @param {number} couponCode
 */
function toggleFavorite(couponCode) {
    if (favoriteCoupons.has(couponCode)) {
        favoriteCoupons.delete(couponCode)
    } else {
        favoriteCoupons.add(couponCode)
    }
    saveFavorites()
    updateStarIcon(couponCode)
    if ($('#showFavoritesOnly').is(':checked')) {
        filterCouponsWithNames($("#myTags").tagit("assignedTags"))
    }
}

/**
 * Update star icon for a coupon
 * @param {number} couponCode
 */
function updateStarIcon(couponCode) {
    const starIcon = $(`#star-${couponCode}`)
    if (favoriteCoupons.has(couponCode)) {
        starIcon.removeClass('bi-star').addClass('bi-star-fill')
    } else {
        starIcon.removeClass('bi-star-fill').addClass('bi-star')
    }
}

/**
 * @type {Object<string, string[]>}
 */
const filterItem = {
    '蛋撻': ['原味蛋撻', '蛋撻'],
    '炸雞': ['咔啦脆雞', '卡啦脆雞'],
    '椒麻雞': ['青花椒香麻脆雞'],
    '紙包雞': ['義式香草紙包雞', '紙包雞'],
    '咔啦雞堡': ['咔啦雞腿堡', '卡啦雞腿堡'],
    '花生熔岩雞腿堡': ['花生熔岩卡啦雞腿堡', '花生熔岩咔啦雞腿堡'],
    '椒麻雞腿堡': ['青花椒香麻咔啦雞腿堡', '青花椒香麻卡啦雞腿堡', '青花椒咔啦雞腿堡'],
    // '煙燻雞堡': ['美式煙燻咔脆雞堡', '美式煙燻卡脆雞堡'],
    '烤雞腿堡': ['紐奧良烙烤雞腿堡', '紐奧良烤腿堡', '紐澳良烤雞腿堡', '紐奧良烤雞腿堡'],
    // '莎莎雞腿捲': ['墨西哥莎莎雞腿捲'],
    // '雞柳捲': ['花生起司雞柳捲'],
    // '燻雞捲': ['原味起司燻雞捲'],
    '雞塊': ['上校雞塊'],
    '脆薯': ['香酥脆薯', '20:00後供應香酥脆薯', '小薯', '薯條'],
    'QQ球': ['雙色轉轉QQ球'],
    // '經典玉米': ['經典玉米'],
    '點心盒': ['點心盒-上校雞塊+香酥脆薯', '點心盒'],
    '雞汁飯': ['20:00前供應雞汁風味飯', '雞汁風味飯'],
    '大福': ['草苺起司冰淇淋大福'],
    // '沙拉': ['鮮蔬沙拉'],
}

/**
 * @type {Object<string, string>}
 */
const SINGLE_PRODUCT_NICKNAME = {
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
}

/**
 * @type {string[]}
 */
const EXCLUDE_CASES = [
    '可樂',
    '七喜',
    '玉米濃湯',
    '綠茶',
    '紅茶',
    '奶茶',
    '上校雞塊分享盒',
    '糖醋醬',
    '響應環保不需湯匙',
    '不需刀叉及手套',
    '響應環保不需叉子',
]

/**
 * @type {string[]}
 */
const EXCLUDE_ITEMS = [
    '糖醋醬',
    '響應環保不需湯匙',
    '不需刀叉及手套',
    '響應環保不需叉子',
]

/**
 * @type {string}
 */
const EXCLUDE_CASES_REG_STR = EXCLUDE_CASES.join('|')

/**
 * @type {string}
 */
const EXCLUDE_ITEMS_REG_STR = EXCLUDE_ITEMS.join('|')

/**
 * @type {string[]}
 */
const UNIT_WORD = [
    '塊',
    '份',
    '顆',
    '入',
]

/**
 * @type {Set<string>}
 */
const AllFilterNamesSet = new Set([].concat(...Object.values(filterItem)))

/**
 * @param {string} string
 * @returns {string}
 */
function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Filter all the coupons that have an item with the target name or favorites.
 * @param {string[]} names - Names of the CouponItem to search for.
 */
function filterCouponsWithNames(names) {
    const enableFlavorSearch = $('#enableFlavorSearch').is(':checked');
    const showFavoritesOnly = $('#showFavoritesOnly').is(':checked');

    COUPONS.forEach((coupon) => {
        let shouldShow = true;

        // Check favorites filter
        if (showFavoritesOnly && !favoriteCoupons.has(coupon.coupon_code)) {
            shouldShow = false;
        }

        // Check name filter
        if (names.length > 0) {
            shouldShow = shouldShow && names.every(
                (name) => coupon.items.some(
                    (item) => (filterItem[name] || [name]).some(
                        search => item.name.includes(search) || (enableFlavorSearch && item.flavors.some(flavor => flavor.name.includes(search)))
                    )
                )
            );
        }

        if (shouldShow) {
            $(`#coupon-${coupon.coupon_code}`).show();
        } else {
            $(`#coupon-${coupon.coupon_code}`).hide();
        }
    });
}

function activeFilterButton(button) {
    button.removeClass('btn-light')
    button.addClass('btn-info active')
}

function inactiveFilterButton(button) {
    button.removeClass('btn-info active')
    button.addClass('btn-light')
}

function filterClickEvent(event) {
    const e = $(event.currentTarget)
    if(e.attr('class').includes('active')) {
        $("#myTags").tagit("removeTagByLabel", e.text());
        inactiveFilterButton(e)
    } else {
        $("#myTags").tagit("createTag", e.text());
        activeFilterButton(e)
    }
}

function clearTagsEvent(event) {
    $("#myTags").tagit("removeAll");
}

function couponDetailEvent(event) {
    const e = $(event.currentTarget)
    const coupon_code = e.attr('data-key')
    const coupon = COUPONS_BY_CODE[coupon_code]
    $("#detail-title").html(`<div class="d-flex justify-content-between"><span>${coupon.name}</span><span>$${coupon.price}</span></div>`)

    let base_content = `<div class="d-flex justify-content-between"><span>餐點可以更換的品項：</span><a href="${ORDER_LINK}/${coupon.product_code}" target="_blank">線上點餐</a></div>`
    base_content += `<small class="text-gray">品項價格為一件的價錢</small>`

    let items = "";
    coupon.items.forEach(({name, count, flavors}) => {
        const default_flavors = `<div>${name} x ${count}</div>`
        let options = "<ul>"
        if(flavors.length > 0){
            flavors.forEach(({name, addition_price}) =>{
                options += `<li><div class="d-flex justify-content-between"><span>${name}</span><span>+$${addition_price}</span></div></li>`
            })
        } else {
            options += `<li class="text-gray"><div>沒有可以更換的品項</div></li>`
        }
        options += "</ul>"
        items += `${default_flavors}${options}`;
    })
    $("#detail-body").html(`${base_content}<div class="pt-3 ml-2">${items}</div>`)
}

function scrollToTopEvent() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

let currentSort = 'price-asc';

function getSortedCoupons() {
    let sorted = [...COUPONS];
    switch(currentSort) {
        case 'coupon_code-asc':
            sorted.sort((a, b) => a.coupon_code - b.coupon_code);
            break;
        case 'coupon_code-desc':
            sorted.sort((a, b) => b.coupon_code - a.coupon_code);
            break;
        case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'end_date-asc':
            sorted.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
            break;
        case 'end_date-desc':
            sorted.sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
            break;
        case 'discount-asc':
            sorted.sort((a, b) => b.discount - a.discount);
            break;
        case 'discount-desc':
            sorted.sort((a, b) => a.discount - b.discount);
            break;
    }
    return sorted;
}

function calculateOriginalPrice(name, count) {
    const siteCase = new RegExp(`20:00前供應|\\(辣\\)|\\(不辣\\)|[1-9][0-9]*(${UNIT_WORD.join('|')})`, 'g')
    // walk around for 2塊咔啦脆雞
    if (name === '2塊咔啦脆雞(辣)') {
        name = '咔啦脆雞';
        count *= 2;
    }
    // walk around for 2入原味蛋撻
    if (name === '2入原味蛋撻') {
        name = '原味蛋撻';
        count *= 2;
    }

    const renderName = name.replace(siteCase, '').trim();
    if (renderName === '咔啦脆雞') {
        const numTwos = Math.floor(count / 2);
        const numOnes = count % 2;
        return numTwos * SINGLE_DICT['咔啦脆雞2塊'].price + numOnes * SINGLE_DICT['咔啦脆雞'].price;
    } else if (SINGLE_DICT[renderName] !== undefined){
        return SINGLE_DICT[renderName].price * count;
    } else if (SINGLE_DICT[SINGLE_PRODUCT_NICKNAME[renderName]] !== undefined) {
        return SINGLE_DICT[SINGLE_PRODUCT_NICKNAME[renderName]].price * count;
    } else if (name === '上校雞塊') {
        if (count === 4) {
            return SINGLE_DICT['上校雞塊4塊'].price;
        } else if (count === 8) {
            return SINGLE_DICT['上校雞塊8塊'].price;
        } else if (count === 20) {
            return SINGLE_DICT['上校雞塊分享盒(20塊)'].price;
        }
        throw new Error('Cannot find item');
    } else if (name === '上校雞塊4塊' || name === '4塊雞塊' || name === '4塊上校雞塊') {
        return SINGLE_DICT['上校雞塊4塊'].price * count;
    } else if (name === '上校雞塊8塊' || name === '8塊雞塊' || name === '8塊上校雞塊') {
        return SINGLE_DICT['上校雞塊8塊'].price * count;
    } else {
        // try to split by '+' first
        const splitNames = name.split('+').map(n => n.trim());
        let _price = 0;
        if (splitNames.length > 1) {
            splitNames.forEach(n => {
                _price += calculateOriginalPrice(n, count);
            })
            if (_price > 0) {
                return _price;
            }
        }
        throw new Error('Cannot find item');
    }
}

function prepareInitData() {
    const row = $('#row');
    let products = "";
    const exceptItems = new RegExp(EXCLUDE_ITEMS_REG_STR)
    getSortedCoupons().forEach(data => {
        let items = "";
        data.items.forEach(({name, count}) => {
            if (exceptItems.exec(name)) return;

            items += `<div>${name} x ${count}</div>`;
        })

        const starIcon = favoriteCoupons.has(data.coupon_code) ? 'bi-star-fill' : 'bi-star';
        const star = `<i class="bi ${starIcon} star-icon" id="star-${data.coupon_code}" data-coupon="${data.coupon_code}" style="cursor: pointer;"></i>`;
        const name = `<strong>${data.name}</strong>`;
        let originalPriceStr = '';
        let discountPercentStr = '';
        if (data.original_price > data.price) {
            originalPriceStr = ` <small class="text-muted"><s>\$${data.original_price}</s></small>`;
            discountPercentStr = ` <span class="badge bg-success">${data.discount} 折</span>`;
        }
        const price = `<strong>\$${data.price}${originalPriceStr}${discountPercentStr}</strong>`;
        const title = `<div class="d-flex justify-content-between align-items-center" style="position: relative;"><div>${star} ${name}</div>${price}</div>`;

        items = `<div class="card-text items">${items}</div>`;
        const body = `<div class="card-body">${title + items}</div>`;

        const date = `<div class="text-right"><small class="text-muted">${data.start_date} ~ ${data.end_date}</small></div>`;
        const detail = `<div class="coupon-detail-link" data-key="${data.coupon_code}" data-bs-toggle="modal" data-bs-target="#detailModel">查看餐點選項</div>`;
        const order = `<div><a href="${ORDER_LINK}/${data.product_code}" target="_blank">線上點餐</a></div>`;
        const footer = `<div class="card-footer">${date}<div class="d-flex justify-content-between">${detail + order}</div></div>`;

        const box = `<div class="card mb-4 box">${body + footer}</div>`;
        products += `<div class="col-lg-4 col-md-6" id="coupon-${data.coupon_code}">${box}</div>`;
    })
    row.html(products);
}

function prepareButtons() {
    const exceptCase = new RegExp(EXCLUDE_CASES_REG_STR)
    const siteCase = new RegExp(`\\([大中小辣]\\)|\\(不辣\\)|[1-9][0-9]*(${UNIT_WORD.join('|')})`, 'g')
    COUPONS.forEach(({items}) => {
        items.forEach(({name: names}) => {
            names.split('+').forEach(name => {
                if (exceptCase.exec(name)) return;
                const renderName = name.replace(siteCase, '').trim().replace(/^\(|\)$/g, '');
                if (AllFilterNamesSet.has(renderName)) return;

                AllFilterNamesSet.add(renderName);
                filterItem[renderName] = [renderName];
            });
        });
    });

    let btn_html = "";
    const keys = Object.keys(filterItem);

    keys.slice(0, 10).forEach(key => {
        btn_html += `<button type="button" class="btn btn-light item-btn" data-key="${key}">${key}</button>`;
    });

    if (keys.length > 10) { // Use a filter icon for the dropdown menu
        btn_html += `<div class="dropdown d-inline-block">
                        <button class="btn btn-light dropdown-toggle" type="button" id="filterIcon" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-filter"></i>
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="filterIcon">
                            ${keys.slice(10).map(key => `<li><a class="dropdown-item" href="#" data-key="${key}">${key}</a></li>`).join('')}
                        </ul>
                    </div>`;
    }

    $('#buttons').html(btn_html);

    // Add event listener for dropdown items
    $('.dropdown-item').click(function() {
        const selectedKey = $(this).data('key');
        if ($(this).hasClass('active')) {
            console.log(`Deselected key: ${selectedKey}`);
            $(this).removeClass('active');
            $("#myTags").tagit("removeTagByLabel", selectedKey);
        } else {
            console.log(`Selected key: ${selectedKey}`);
            $(this).addClass('active');
            $("#myTags").tagit("createTag", selectedKey);
        }
    });
}

function updateSearchResultCount() {
    const visibleCoupons = $('div[id^="coupon-"]:visible').length;
    $('#searchResultCount').text(visibleCoupons);
}

$(document).ready(function() {
    // Enable popovers, ref: https://getbootstrap.com/docs/5.2/components/popovers/
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    const _ = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))

    $("#myTags").tagit({
        allowDuplicates: true,
        placeholderText: "我想找...",
        beforeTagAdded: function(event, ui) {
            $(".tagit-new > input").removeAttr("placeholder")
        },
        afterTagAdded: function(event, ui) {
            const names = $("#myTags").tagit("assignedTags");
            filterCouponsWithNames(names)
            updateSearchResultCount()
        },
        afterTagRemoved:  function(event, ui) {
            const names = $("#myTags").tagit("assignedTags");
            filterCouponsWithNames(names)
            filterBtn = $(`[data-key="${ui.tagLabel}"]`)
            if (filterBtn) {
                inactiveFilterButton(filterBtn)
            }
            if($('#myTags').tagit('assignedTags').length == 0) {
                $(".tagit-new > input").attr("placeholder", "我想找...")
            }
            updateSearchResultCount()
        },
    });
    // init COUPONS
    const exceptItems = new RegExp(EXCLUDE_ITEMS_REG_STR)
    COUPONS.forEach(data => {
        let originalPrice = 0;
        let canGetOriginalPrice = true;
        let discountFold = 10;
        data.items.forEach(({name, count}) => {
            if (exceptItems.exec(name) || canGetOriginalPrice === false) return;

            try {
                originalPrice += calculateOriginalPrice(name, count);
            } catch (e) {
                // console.log(`Cannot find item: ${name} in coupon code: ${data.coupon_code}`);
                originalPrice = 0;
                canGetOriginalPrice = false;
            }
        })
        if (canGetOriginalPrice && originalPrice > data.price) {
            discountFold = ((data.price / originalPrice) * 10).toFixed(1);
        }
        // else if (originalPrice <= data.price) {
        //     console.log(`Original price (${originalPrice}) is not greater than coupon price (${data.price}) for coupon code: ${data.coupon_code}`);
        // }
        data.original_price = originalPrice;
        data.discount = discountFold;
    });

    // Load favorites first
    loadFavorites();
    prepareInitData();
    prepareButtons();
    $("#lastUpdate").html(`${COUPON_DICT.last_update.substring(0, 10)}<span class="hide-small-screen">${COUPON_DICT.last_update.substring(10)}</span>`)
    $(".item-btn").click(filterClickEvent);
    $(".clear-btn").click(clearTagsEvent);
    $('div[data-bs-target="#detailModel"]').click(couponDetailEvent);
    $(".top-btn").click(scrollToTopEvent);
    $('#enableFlavorSearch').change(function() {
        const names = $("#myTags").tagit("assignedTags");
        filterCouponsWithNames(names);
        updateSearchResultCount();
    });
    $('#sortSelect').on('change', function() {
        currentSort = $(this).val();
        prepareInitData();
        filterCouponsWithNames($("#myTags").tagit("assignedTags"));
        updateSearchResultCount();
    });

    // Initial count update
    updateSearchResultCount();

    // Bind star click events
    $(document).on('click', '.star-icon', function() {
        const couponCode = parseInt($(this).data('coupon'));
        toggleFavorite(couponCode);
        updateSearchResultCount();
    });

    // Bind favorites filter change event
    $('#showFavoritesOnly').change(function() {
        const names = $("#myTags").tagit("assignedTags");
        filterCouponsWithNames(names);
        updateSearchResultCount();
    });
})
