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
