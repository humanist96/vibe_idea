import type { StrategyTemplate } from "./types"

export const STRATEGY_TEMPLATES: readonly StrategyTemplate[] = [
  {
    name: "Golden Cross",
    nameKr: "골든 크로스",
    description: "MA50이 MA200을 상향 돌파 시 매수, 하향 돌파 시 매도",
    definition: {
      buyConditions: [
        {
          indicator: "MA",
          params: { period: 50 },
          operator: "crossAbove",
          value: 0,
        },
      ],
      sellConditions: [
        {
          indicator: "MA",
          params: { period: 50 },
          operator: "crossBelow",
          value: 0,
        },
      ],
      stopLoss: -10,
    },
  },
  {
    name: "RSI Oversold Bounce",
    nameKr: "RSI 과매도 반등",
    description: "RSI가 30 이하로 과매도 진입 후 반등 시 매수, 70 이상 시 매도",
    definition: {
      buyConditions: [
        {
          indicator: "RSI",
          params: { period: 14 },
          operator: "<",
          value: 30,
        },
      ],
      sellConditions: [
        {
          indicator: "RSI",
          params: { period: 14 },
          operator: ">",
          value: 70,
        },
      ],
      stopLoss: -7,
      takeProfit: 15,
    },
  },
  {
    name: "Bollinger Band Breakout",
    nameKr: "볼린저 밴드 돌파",
    description: "가격이 하단 밴드 아래로 이동 시 매수, 상단 밴드 위 시 매도",
    definition: {
      buyConditions: [
        {
          indicator: "PRICE",
          params: {},
          operator: "<",
          value: 0,
        },
      ],
      sellConditions: [
        {
          indicator: "PRICE",
          params: {},
          operator: ">",
          value: 0,
        },
      ],
      stopLoss: -8,
      takeProfit: 20,
    },
  },
  {
    name: "MACD Signal Cross",
    nameKr: "MACD 시그널 교차",
    description: "MACD가 시그널선을 상향 돌파 시 매수, 하향 돌파 시 매도",
    definition: {
      buyConditions: [
        {
          indicator: "MACD",
          params: {},
          operator: "crossAbove",
          value: 0,
        },
      ],
      sellConditions: [
        {
          indicator: "MACD",
          params: {},
          operator: "crossBelow",
          value: 0,
        },
      ],
      stopLoss: -5,
    },
  },
  {
    name: "Dual MA Trend",
    nameKr: "이중 이평선 추세",
    description: "EMA12가 EMA26 위이고 RSI가 50 이상 시 매수, EMA12가 EMA26 아래 시 매도",
    definition: {
      buyConditions: [
        {
          indicator: "EMA",
          params: { period: 12 },
          operator: ">",
          value: 0,
        },
        {
          indicator: "RSI",
          params: { period: 14 },
          operator: ">",
          value: 50,
        },
      ],
      sellConditions: [
        {
          indicator: "EMA",
          params: { period: 12 },
          operator: "<",
          value: 0,
        },
      ],
      stopLoss: -8,
      takeProfit: 25,
    },
  },
] as const
