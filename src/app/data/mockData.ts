export interface Product {
  id: number;
  keyword: string;
  target_price: number | null;
  memo: string | null;
  created_at: string;
  latest_price: number;
  latest_shop: string;
  status: 'goal_reached' | 'monitoring' | 'no_target';
}

export interface PriceHistory {
  date: string;
  min_price: number;
  shop: string;
}

export interface RecentCollection {
  id: number;
  product_name: string;
  shop: string;
  price: number;
  previous_price: number;
  collected_at: string;
}

export const mockProducts: Product[] = [
  {
    id: 1,
    keyword: "빼빼로 오리지널 54g",
    target_price: 1200,
    memo: "편의점보다 싸게 사기",
    created_at: "2026-01-15T09:00:00",
    latest_price: 1180,
    latest_shop: "쿠팡",
    status: "goal_reached"
  },
  {
    id: 2,
    keyword: "신라면 멀티팩 5입",
    target_price: 3500,
    memo: null,
    created_at: "2026-01-20T09:00:00",
    latest_price: 3850,
    latest_shop: "G마켓",
    status: "monitoring"
  },
  {
    id: 3,
    keyword: "오뚜기 진라면 순한맛 5입",
    target_price: null,
    memo: "가격 변동 관찰용",
    created_at: "2026-02-01T09:00:00",
    latest_price: 3200,
    latest_shop: "11번가",
    status: "no_target"
  },
  {
    id: 4,
    keyword: "콘프로스트 575g",
    target_price: 4500,
    memo: "아침 시리얼",
    created_at: "2026-01-25T09:00:00",
    latest_price: 4200,
    latest_shop: "쿠팡",
    status: "goal_reached"
  },
  {
    id: 5,
    keyword: "하기스 매직팬티 특대형 남아",
    target_price: 35000,
    memo: null,
    created_at: "2026-02-05T09:00:00",
    latest_price: 38900,
    latest_shop: "네이버쇼핑",
    status: "monitoring"
  },
  {
    id: 6,
    keyword: "참이슬 후레쉬 360ml 20입",
    target_price: 18000,
    memo: "집들이 준비",
    created_at: "2026-02-10T09:00:00",
    latest_price: 17500,
    latest_shop: "이마트몰",
    status: "goal_reached"
  }
];

export const mockPriceHistory: { [key: number]: PriceHistory[] } = {
  1: [
    { date: "2026-02-14", min_price: 1350, shop: "G마켓" },
    { date: "2026-02-15", min_price: 1280, shop: "쿠팡" },
    { date: "2026-02-16", min_price: 1280, shop: "쿠팡" },
    { date: "2026-02-17", min_price: 1250, shop: "11번가" },
    { date: "2026-02-18", min_price: 1200, shop: "쿠팡" },
    { date: "2026-02-19", min_price: 1180, shop: "쿠팡" },
    { date: "2026-02-20", min_price: 1180, shop: "쿠팡" }
  ],
  2: [
    { date: "2026-02-14", min_price: 4100, shop: "네이버쇼핑" },
    { date: "2026-02-15", min_price: 4050, shop: "G마켓" },
    { date: "2026-02-16", min_price: 3900, shop: "11번가" },
    { date: "2026-02-17", min_price: 3900, shop: "11번가" },
    { date: "2026-02-18", min_price: 3850, shop: "G마켓" },
    { date: "2026-02-19", min_price: 3850, shop: "G마켓" },
    { date: "2026-02-20", min_price: 3850, shop: "G마켓" }
  ],
  3: [
    { date: "2026-02-14", min_price: 3400, shop: "쿠팡" },
    { date: "2026-02-15", min_price: 3350, shop: "11번가" },
    { date: "2026-02-16", min_price: 3300, shop: "11번가" },
    { date: "2026-02-17", min_price: 3250, shop: "쿠팡" },
    { date: "2026-02-18", min_price: 3200, shop: "11번가" },
    { date: "2026-02-19", min_price: 3200, shop: "11번가" },
    { date: "2026-02-20", min_price: 3200, shop: "11번가" }
  ],
  4: [
    { date: "2026-02-14", min_price: 4800, shop: "G마켓" },
    { date: "2026-02-15", min_price: 4650, shop: "쿠팡" },
    { date: "2026-02-16", min_price: 4500, shop: "네이버쇼핑" },
    { date: "2026-02-17", min_price: 4400, shop: "쿠팡" },
    { date: "2026-02-18", min_price: 4300, shop: "쿠팡" },
    { date: "2026-02-19", min_price: 4200, shop: "쿠팡" },
    { date: "2026-02-20", min_price: 4200, shop: "쿠팡" }
  ],
  5: [
    { date: "2026-02-14", min_price: 42000, shop: "이마트몰" },
    { date: "2026-02-15", min_price: 41500, shop: "11번가" },
    { date: "2026-02-16", min_price: 40800, shop: "G마켓" },
    { date: "2026-02-17", min_price: 39900, shop: "네이버쇼핑" },
    { date: "2026-02-18", min_price: 39500, shop: "쿠팡" },
    { date: "2026-02-19", min_price: 38900, shop: "네이버쇼핑" },
    { date: "2026-02-20", min_price: 38900, shop: "네이버쇼핑" }
  ],
  6: [
    { date: "2026-02-14", min_price: 19500, shop: "쿠팡" },
    { date: "2026-02-15", min_price: 19000, shop: "G마켓" },
    { date: "2026-02-16", min_price: 18500, shop: "이마트몰" },
    { date: "2026-02-17", min_price: 18200, shop: "이마트몰" },
    { date: "2026-02-18", min_price: 17800, shop: "이마트몰" },
    { date: "2026-02-19", min_price: 17500, shop: "이마트몰" },
    { date: "2026-02-20", min_price: 17500, shop: "이마트몰" }
  ]
};

export const mockRecentCollections: RecentCollection[] = [
  {
    id: 1,
    product_name: "빼빼로 오리지널 54g",
    shop: "쿠팡",
    price: 1180,
    previous_price: 1180,
    collected_at: "2026-02-20T14:30:00"
  },
  {
    id: 2,
    product_name: "참이슬 후레쉬 360ml 20입",
    shop: "이마트몰",
    price: 17500,
    previous_price: 17800,
    collected_at: "2026-02-20T14:15:00"
  },
  {
    id: 3,
    product_name: "콘프로스트 575g",
    shop: "쿠팡",
    price: 4200,
    previous_price: 4200,
    collected_at: "2026-02-20T14:00:00"
  },
  {
    id: 4,
    product_name: "신라면 멀티팩 5입",
    shop: "G마켓",
    price: 3850,
    previous_price: 3850,
    collected_at: "2026-02-20T13:45:00"
  },
  {
    id: 5,
    product_name: "하기스 매직팬티 특대형 남아",
    shop: "네이버쇼핑",
    price: 38900,
    previous_price: 39500,
    collected_at: "2026-02-20T13:30:00"
  },
  {
    id: 6,
    product_name: "오뚜기 진라면 순한맛 5입",
    shop: "11번가",
    price: 3200,
    previous_price: 3200,
    collected_at: "2026-02-20T13:15:00"
  },
  {
    id: 7,
    product_name: "빼빼로 오리지널 54g",
    shop: "11번가",
    price: 1250,
    previous_price: 1250,
    collected_at: "2026-02-20T13:00:00"
  },
  {
    id: 8,
    product_name: "신라면 멀티팩 5입",
    shop: "11번가",
    price: 3900,
    previous_price: 3900,
    collected_at: "2026-02-20T12:45:00"
  },
  {
    id: 9,
    product_name: "콘프로스트 575g",
    shop: "G마켓",
    price: 4350,
    previous_price: 4350,
    collected_at: "2026-02-20T12:30:00"
  },
  {
    id: 10,
    product_name: "참이슬 후레쉬 360ml 20입",
    shop: "쿠팡",
    price: 18200,
    previous_price: 18200,
    collected_at: "2026-02-20T12:15:00"
  }
];
