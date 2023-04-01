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
const COUPONS = COUPON_LIST

/**
 * @type {Object.<number, Coupon>}
 */
const COUPONS_BY_CODE = COUPON_DICT

/**
 * @param {string} string 
 * @returns {string}
 */
function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Find all the coupons that have an item with the target name.
 * @param {string[]} names - Names of the CouponItem to search for.
 * @returns {Coupon[]} - The array of coupons that have an item with the target name.
 */
function findCouponsWithNames(names) {
    COUPONS.filter((coupon) => {
        if(!names.every((name) => coupon.items.some((item) => item.name.includes(name)))){
            $(`#coupon-${coupon.coupon_code}`).hide()
        } else {
            $(`#coupon-${coupon.coupon_code}`).show()
        }
    });
}

/**
 * Converts an array of Coupon objects into an object where the keys are the coupon_code property
 * and the values are the Coupon objects themselves.
 * @param {Coupon[]} couponsArray - Array of Coupon objects.
 * @returns {Object.<number, Coupon>} Object with coupon_code keys and Coupon object values.
 */
function couponsArrayToObject(couponsArray) {
    return couponsArray.reduce((result, coupon) => {
        result[coupon.coupon_code] = coupon;
        return result;
    }, {});
}

function addTagEvent(event) {
    $("#myTags").tagit("createTag", event.currentTarget.textContent);
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
    const exceptCase = new RegExp('可樂|七喜|玉米濃湯|綠茶|紅茶')
    const siteCase = new RegExp(/\([大中小辣]\)|[0-9]塊/)
    const names = new Set();
    COUPONS.forEach(({items}) => {
        items.forEach(({name}) => {
            if(exceptCase.exec(name)) return;
            names.add(name.replace(siteCase, ''))
        })
    })

    let btn_html = "";
    names.forEach(name => {
        btn_html += `<button type="button" class="btn btn-info item-btn">${name}</button>`
    })
    $('#buttons').html(btn_html);
}

$(document).ready(function() {
    $("#myTags").tagit({
        allowDuplicates: true,
        placeholderText: "你想找...",
        afterTagAdded: function(event, ui) {
            const names = $("#myTags").tagit("assignedTags");
            findCouponsWithNames(names)
        },
        afterTagRemoved:  function(event, ui) {
            const names = $("#myTags").tagit("assignedTags");
            findCouponsWithNames(names)
        },
    });
    prepareInitData();
    prepareButtons();
    $(".btn").click(addTagEvent);
})
