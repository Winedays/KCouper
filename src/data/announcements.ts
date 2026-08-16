/**
 * @typedef {Object} Announcement
 * @property {number} id - Unique identifier (incrementing)
 * @property {string} title - Announcement title
 * @property {string} content - Announcement content
 * @property {string} date - Date string (YYYY-MM-DD)
 */
export type Announcement = {
  id: number;
  title: string;
  content: string;
  date: string;
};

/**
 * List of announcements. Add new items at the top with incrementing id.
 * @type {Announcement[]}
 */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 5,
    title: "新增使用時段篩選",
    content: "現在支援依照用餐時段（早餐 08:00~10:30、午餐 10:30~17:00、晚餐 17:00~23:00）篩選優惠券囉！系統亦會根據當前時間自動套用預設時段，並於優惠券卡片上顯示適用時段標籤。",
    date: "2026-08-17",
  },
  {
    id: 4,
    title: "新增多條件排序功能",
    content: "排序區現在支援「主要排序」與「次要排序」雙重設定囉！當優惠券的主排序欄位相同時，系統會自動套用次要排序（例如價格相同時依折扣排序）。",
    date: "2026-08-16",
  },
  {
    id: 3,
    title: "新增反向品項排除功能",
    content: "品項篩選器現在支援排除功能囉！點擊品項按鈕可三段切換（包含/排除/取消），幫你快速濾除不要的餐點（例如：不要蛋撻）。",
    date: "2026-08-02",
  },
  {
    id: 2,
    title: "新增多項功能",
    content: "新增優惠券分享，優惠券比較，價格搜尋，品項數量篩選功能及 FAQ 資訊，讓你更輕鬆找到適合的優惠券！",
    date: "2026-06-08",
  },
  {
    id: 1,
    title: "歡迎使用 KCouper v2",
    content: "全新改版上線！介面更直覺、搜尋更快速🎉",
    date: "2026-04-13",
  },
];
