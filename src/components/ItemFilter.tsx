/**
 * Filter matching rules - key is filter name, value is array of strings to match
 * @type {Object<string, string[]>}
 */
export const filterMatchRules: Record<string, string[]> = {
  '蛋撻': ['原味蛋撻', '蛋撻', '原味蛋撻超極酥'],
  '炸雞': ['咔啦脆雞', '卡啦脆雞'],
  '椒麻雞': ['青花椒香麻脆雞'],
  '紙包雞': ['義式香草紙包雞', '紙包雞'],
  '咔啦雞堡': ['咔啦雞腿堡', '卡啦雞腿堡'],
  '花生熔岩雞腿堡': ['花生熔岩卡啦雞腿堡', '花生熔岩咔啦雞腿堡'],
  '椒麻雞腿堡': ['青花椒香麻咔啦雞腿堡', '青花椒香麻卡啦雞腿堡', '青花椒咔啦雞腿堡'],
  '烤雞腿堡': ['紐奧良烙烤雞腿堡', '紐奧良烤腿堡', '紐澳良烤雞腿堡', '紐奧良烤雞腿堡'],
  '雞塊': ['上校雞塊'],
  '脆薯': ['香酥脆薯', '20:00後供應香酥脆薯', '小薯', '薯條'],
  'QQ球': ['雙色轉轉QQ球'],
  '點心盒': ['點心盒-上校雞塊+香酥脆薯', '點心盒'],
  '雞汁飯': ['20:00前供應雞汁風味飯', '雞汁風味飯'],
  '大福': ['草苺起司冰淇淋大福'],
};

export const itemFilters = [
  { id: "蛋撻", label: "蛋撻", emoji: "🥧" },
  { id: "炸雞", label: "炸雞", emoji: "🍗" },
  { id: "椒麻雞", label: "椒麻雞", emoji: "🌶️" },
  { id: "紙包雞", label: "紙包雞", emoji: "🍗" },
  { id: "咔啦雞堡", label: "咔啦雞堡", emoji: "🍔" },
  { id: "花生熔岩雞腿堡", label: "花生熔岩雞腿堡", emoji: "🍔" },
  { id: "椒麻雞腿堡", label: "椒麻雞腿堡", emoji: "🍔" },
  { id: "烤雞腿堡", label: "烤雞腿堡", emoji: "🍔" },
  { id: "雞塊", label: "雞塊", emoji: "🍖" },
  { id: "脆薯", label: "脆薯", emoji: "🍟" },
  { id: "QQ球", label: "QQ球", emoji: "🟡" },
  { id: "點心盒", label: "點心盒", emoji: "📦" },
  { id: "雞汁飯", label: "雞汁飯", emoji: "🍚" },
  { id: "大福", label: "大福", emoji: "🍡" },
] as const;

export type ItemFilterId = (typeof itemFilters)[number]["id"];
