/**
 * @typedef {'basic' | 'search' | 'favorite' | 'other'} FaqCategory
 */

/**
 * @typedef {Object} FaqItem
 * @property {string} id - Unique identifier
 * @property {string} question - The question text
 * @property {string} answer - The answer text
 * @property {FaqCategory} category - Category grouping
 */
export type FaqCategory = "basic" | "search" | "favorite" | "other";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
};

/** Category display labels */
export const FAQ_CATEGORY_LABELS: Record<FaqCategory, string> = {
  basic: "基本使用",
  search: "搜尋與篩選",
  favorite: "收藏與比較",
  other: "其他",
};

/** Ordered category keys */
export const FAQ_CATEGORY_ORDER: FaqCategory[] = [
  "basic",
  "search",
  "favorite",
  "other",
];

/**
 * @type {FaqItem[]}
 */
export const FAQ_ITEMS: FaqItem[] = [
  // ── 基本使用 ──
  {
    id: "what-is-kcouper",
    question: "什麼是 KCouper？",
    answer:
      "KCouper 是一個肯德基優惠券瀏覽工具，整理了目前可用的所有優惠券資訊，讓你快速找到最划算的組合。所有資料皆來自肯德基官方，僅供查詢參考。",
    category: "basic",
  },
  {
    id: "update-frequency",
    question: "優惠券多久更新一次？",
    answer:
      "優惠券資料每天更新一次，頁面頂部會顯示最後更新時間供參考。",
    category: "basic",
  },
  {
    id: "how-to-use",
    question: "如何使用優惠券？",
    answer:
      "找到想使用的優惠券後，記下優惠碼（顯示在卡片上方），到肯德基門市點餐時告知店員優惠碼即可享有優惠價格。部分優惠券也可透過分享功能傳送給朋友。",
    category: "basic",
  },

  // ── 搜尋與篩選 ──
  {
    id: "search-items",
    question: "如何搜尋特定品項？",
    answer:
      "你可以使用頂部的搜尋框輸入品項名稱（如「蛋撻」、「炸雞」）來篩選。也可以點擊品項篩選按鈕，直接選擇常見品項來快速篩選。",
    category: "search",
  },
  {
    id: "quantity-filter",
    question: "品項篩選的數量功能是什麼？",
    answer:
      "點擊品項篩選按鈕後，會出現 +/- 控制按鈕，讓你指定需要的最低數量。例如設定「蛋撻 x2」，就只會顯示包含 2 個以上蛋撻的優惠券。這個功能可以幫你快速找到符合人數需求的組合。",
    category: "search",
  },
  {
    id: "search-all-options",
    question: "「搜尋口味」開關是做什麼的？",
    answer:
      "開啟「搜尋口味」後，搜尋範圍會擴展到品項的口味選項。例如搜尋「辣味」時，會連帶顯示口味中包含辣味的優惠券，讓搜尋結果更完整。",
    category: "search",
  },
  {
    id: "sort-options",
    question: "如何排序優惠券？",
    answer:
      "使用排序下拉選單，你可以按照價格（低到高／高到低）、折扣幅度或優惠碼來排列優惠券，方便快速找到最划算的選擇。",
    category: "search",
  },

  // ── 收藏與比較 ──
  {
    id: "how-to-favorite",
    question: "如何收藏優惠券？",
    answer:
      "點擊優惠券卡片上的愛心圖示即可收藏。收藏的優惠券會儲存在你的瀏覽器中（localStorage），下次造訪時仍然保留。你也可以透過篩選功能只顯示已收藏的優惠券。",
    category: "favorite",
  },
  {
    id: "favorite-expiry",
    question: "收藏的優惠券會保留多久？",
    answer:
      "收藏紀錄會一直保留在你的瀏覽器中，直到你手動取消收藏。如果優惠券已過期被移除，對應的收藏紀錄也會自動清除。清除瀏覽器資料會導致收藏紀錄遺失。",
    category: "favorite",
  },
  {
    id: "how-to-compare",
    question: "如何比較優惠券？",
    answer:
      "長按或點擊優惠券卡片上的比較按鈕，將想比較的優惠券加入比較列。加入後，頁面底部會出現比較工具列，點擊即可並排檢視所選優惠券的內容與價格差異。",
    category: "favorite",
  },

  // ── 其他 ──
  {
    id: "share-coupon",
    question: "如何分享優惠券給朋友？",
    answer:
      "點擊優惠券卡片上的分享按鈕，會產生一個包含該優惠券資訊的連結。你可以將連結傳送給朋友，對方開啟後即可看到對應的優惠券。",
    category: "other",
  },
  {
    id: "theme-toggle",
    question: "如何切換深色/淺色主題？",
    answer:
      "點擊頁面右上角（桌面版）或選單中（手機版）的主題切換按鈕，即可在深色與淺色模式之間切換。系統會記住你的選擇。",
    category: "other",
  },
  {
    id: "legacy-version",
    question: "舊版網站還能用嗎？",
    answer:
      "可以。點擊導航列中的「舊版」連結即可切換到 v1 版本。舊版仍然可用，但不會再加入新功能，建議使用新版以獲得最佳體驗。",
    category: "other",
  },
];
