/**
 * @typedef {Object} CouponItem
 * @property {string} name - The name of the item.
 * @property {number} count - The count of this item that can be purchased.
 * @property {addition_price} min_item - The addition price of this item that need to pay.
 */

/**
 * @typedef {Object} Coupon
 * @property {string} name - The name of the coupon.
 * @property {string} product_code - The product code of the coupon.
 * @property {number} coupon_code - The code of the coupon.
 * @property {string} coupon_id - The ID of the coupon.
 * @property {CouponItem[]} items - The array of items in the coupon.
 * @property {string} start_date - The start date of the coupon.
 * @property {string} end_date - The end date of the coupon.
 * @property {number} price - The price of the coupon
 */

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
    '椒麻雞腿堡': ['青花椒香麻咔啦雞腿堡', '青花椒香麻卡啦雞腿堡'],
    '煙燻雞堡': ['美式煙燻咔脆雞堡', '美式煙燻卡脆雞堡'],
    '烤雞腿堡': ['紐奧良烙烤雞腿堡', '紐奧良烤腿堡'],
    '莎莎雞腿捲': ['墨西哥莎莎雞腿捲'],
    '雞柳捲': ['花生起司雞柳捲'],
    '燻雞捲': ['原味起司燻雞捲'],
    '雞塊': ['上校雞塊'],
    '脆薯': ['香酥脆薯'],
    'QQ球': ['雙色轉轉QQ球'],
    '經典玉米': ['經典玉米'],
    '點心盒': ['點心盒-上校雞塊+香酥脆薯', '點心盒'],
    '雞汁飯': ['20:00前供應雞汁風味飯', '雞汁風味飯'],
    '大福': ['草苺起司冰淇淋大福'],
    '黑糖白玉蛋撻': ['黑糖白玉Q蛋撻'],
    '沙拉': ['鮮蔬沙拉'],
}

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
    if(names.length === 0) {
        $('div[id^="coupon-"]').show()
        return
    }

    COUPONS.forEach((coupon) => {
        if(names.every(
            (name) => coupon.items.some(
                (item) => filterItem[name].some(
                    search => item.name.includes(search))))
        ){
            $(`#coupon-${coupon.coupon_code}`).show()
        } else {
            $(`#coupon-${coupon.coupon_code}`).hide()
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

function prepareInitData() {
    const row = $('#row');

    let products = "";
    COUPONS.forEach(data => {
        const name = `<strong>${data.name}</strong>`;
        const price = `<strong>\$${data.price}</strong>`;
        const title = `<div class="d-flex justify-content-between align-items-center">${name}${price}</div>`;

        let items = "";
        data.items.forEach(({name, count}) => {
            items += `<div>${name} x ${count}</div>`;
        })
        items = `<div class="card-text items">${items}</div>`;

        const date = `<small class="text-muted text-right date">${data.start_date} ~ ${data.end_date}</small>`;

        const body = `<div class="card-body">${title + items + date}</div>`;
        const box = `<div class="card mb-4 box">${body}</div>`;
        products += `<div class="col-md-4" id="coupon-${data.coupon_code}">${box}</div>`;
    })
    row.html(products);
}

function prepareButtons() {
    const exceptCase = new RegExp('可樂|七喜|玉米濃湯|綠茶|紅茶|奶茶|上校雞塊分享盒')
    const siteCase = new RegExp(/\([大中小辣]\)|[0-9]塊/)
    COUPONS.forEach(({items}) => {
        items.forEach(({name}) => {
            if(exceptCase.exec(name)) return;
            const renderName = name.replace(siteCase, '')
            if(AllFilterNamesSet.has(renderName)) return;

            AllFilterNamesSet.add(renderName)
            filterItem[renderName] = [renderName]
        })
    })

    let btn_html = "";
    Object.keys(filterItem).forEach(key => {
        btn_html += `<button type="button" class="btn btn-light item-btn" data-key="${key}">${key}</button>`
    })
    $('#buttons').html(btn_html);
}

$(document).ready(function() {
    $("#myTags").tagit({
        allowDuplicates: true,
        placeholderText: "我想找...",
        beforeTagAdded: function(event, ui) {
            $(".tagit-new > input").removeAttr("placeholder")
        },
        afterTagAdded: function(event, ui) {
            const names = $("#myTags").tagit("assignedTags");
            filterCouponsWithNames(names)
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
        },
    });
    prepareInitData();
    prepareButtons();
    $("#lastUpdate").html(COUPON_DICT.last_update)
    $(".item-btn").click(filterClickEvent);
    $(".clear-btn").click(clearTagsEvent);
})
