export interface PaymentEntry {
  description: string;
  amount: number;
}

export interface SalesData {
  id: string;
  date: string;
  imageUri: string;
  cashPayments: PaymentEntry[];
  cardPayments: PaymentEntry[];
  cashTotal: number;
  cardTotal: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  emailSent: boolean;
}

export interface AppSettings {
  recipientEmail: string;
  senderName: string;
  autoSendEmail: boolean;
  serverUrl: string;
}

export type RootStackParamList = {
  Main: undefined;
  Camera: undefined;
  Review: { salesData: SalesData; autoSend?: boolean };
};

export type BottomTabParamList = {
  Home: undefined;
  Camera: undefined;
  History: undefined;
  Settings: undefined;
};
