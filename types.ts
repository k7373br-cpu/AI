
export enum AppScreen {
  MAIN = 'MAIN',
  ASSET_SELECTION = 'ASSET_SELECTION',
  TIMEFRAME_SELECTION = 'TIMEFRAME_SELECTION',
  ANALYSIS = 'ANALYSIS',
  RESULT = 'RESULT'
}

export enum AssetType {
  FOREX = 'Forex',
  CRYPTO = 'Crypto',
  METALS = 'Metals'
}

export enum UserStatus {
  STANDARD = 'STANDARD',
  VERIFIED = 'VERIFIED',
  VIP = 'VIP'
}

export type Language = 'RU' | 'EN';

export interface Asset {
  id: string;
  name: string;
  price: string;
  change: string;
  type: AssetType;
  lastTick?: 'up' | 'down' | null;
}

export interface EconomicNews {
  time: string;
  event: string;
  importance: 1 | 2 | 3;
  impact: 'High' | 'Medium' | 'Low';
}

export type SignalStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Signal {
  id: string;
  asset: Asset;
  timeframe: string;
  direction: 'BUY' | 'SELL';
  probability: number;
  timestamp: number;
  status: SignalStatus;
}
