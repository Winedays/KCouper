/**
 * @typedef {Object} CouponItem
 * @property {string} name - The name of the item.
 * @property {number} count - The count of this item that can be purchased.
 * @property {addition_price} min_item - The addition price of this item that need to pay.
 * @property {ItemFlavors[]} flavors - The addition flavors of this item that can change. 
 */

/**
 * @typedef {Object} ItemFlavors
 * @property {string} name - The name of the flavors.
 * @property {addition_price} min_item - The addition price of this flavors that need to pay.
 */

/**
 * @typedef {Object} Coupon
 * @property {string} name - The name of the coupon.
 * @property {string} product_code - The product code of the coupon.
 * @property {number} coupon_code - The code of the coupon.
 * @property {CouponItem[]} items - The array of items in the coupon.
 * @property {string} start_date - The start date of the coupon.
 * @property {string} end_date - The end date of the coupon.
 * @property {number} price - The price of the coupon
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
 * @type {Object<string, string>}
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
]

/**
 * @type {string}
 */
const EXCLUDE_CASES_REG_STR = EXCLUDE_CASES.join('|')

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
 * Filter all the coupons that have an item with the target name.
 * @param {string[]} names - Names of the CouponItem to search for.
 */
function filterCouponsWithNames(names) {
    const enableFlavorSearch = $('#enableFlavorSearch').is(':checked');

    if (names.length === 0) {
        $('div[id^="coupon-"]').show();
        return;
    }

    COUPONS.forEach((coupon) => {
        if (names.every(
            (name) => coupon.items.some(
                (item) => (filterItem[name] || [name]).some(
                    search => item.name.includes(search) || (enableFlavorSearch && item.flavors.some(flavor => flavor.name.includes(search)))
                )
            )
        )) {
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
    $("#detail-title").html(`<div class="d-flex justify-content-between"><span>${coupon.name}</span><spen>$${coupon.price}</spen></div>`)
    
    let base_content = `<div class="d-flex justify-content-between"><span>餐點可以更換的品項：</span><a href="${ORDER_LINK}/${coupon.product_code}" target="_blank">線上點餐</a></div>`
    base_content += `<small class="text-gray">品項價格為一件的價錢</small>`

    let items = "";
    coupon.items.forEach(({name, count, flavors}) => {
        const default_flavors = `<div>${name} x ${count}</div>`
        let options = "<ul>"
        if(flavors.length > 0){
            flavors.forEach(({name, addition_price}) =>{
                options += `<li><div class="d-flex justify-content-between"><span>${name}</span><spen>+$${addition_price}</spen></div></li>`
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
    }
    return sorted;
}

function prepareInitData() {
    const row = $('#row');
    let products = "";
    getSortedCoupons().forEach(data => {
        const name = `<strong>${data.name}</strong>`;
        const price = `<strong>\$${data.price}</strong>`;
        const title = `<div class="d-flex justify-content-between align-items-center">${name}${price}</div>`;

        let items = "";
        data.items.forEach(({name, count}) => {
            items += `<div>${name} x ${count}</div>`;
        })
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
})
