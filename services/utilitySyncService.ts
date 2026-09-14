import * as WebBrowser from 'expo-web-browser';
import { UtilitySubscription } from '@/db/schema';
import * as db from '@/db/database';

export interface ProviderInfo {
  key: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  checkUrl: string;
  paymentUrl: string;
  defaultDueDay: number;
  clientNumberLabel: string;
  placeholder: string;
}

export const PROVIDERS_CONFIG: Record<string, ProviderInfo> = {
  electrohold: {
    key: 'electrohold',
    name: 'Електрохолд (Ток - Западна България)',
    shortName: 'Електрохолд',
    icon: 'flash',
    color: '#FF9500',
    checkUrl: 'https://info.electrohold.bg/check-bill',
    paymentUrl: 'https://info.electrohold.bg/check-bill',
    defaultDueDay: 25,
    clientNumberLabel: 'Клиентски номер (10 цифри)',
    placeholder: 'напр. 1002948291',
  },
  evn: {
    key: 'evn',
    name: 'EVN България (Ток - Югоизточна България)',
    shortName: 'EVN',
    icon: 'flash',
    color: '#FF9500',
    checkUrl: 'https://www.evn.bg/Online-Services/Check-Bill.aspx',
    paymentUrl: 'https://www.evn.bg/Online-Services/Check-Bill.aspx',
    defaultDueDay: 25,
    clientNumberLabel: 'Клиентски номер (10 цифри) / ИТН',
    placeholder: 'напр. 1000123456',
  },
  energo_pro: {
    key: 'energo_pro',
    name: 'Енерго-Про (Ток - Североизточна България)',
    shortName: 'Енерго-Про',
    icon: 'flash',
    color: '#FF9500',
    checkUrl: 'https://energo-pro.bg/bg/proverka-na-smetka',
    paymentUrl: 'https://energo-pro.bg/bg/proverka-na-smetka',
    defaultDueDay: 25,
    clientNumberLabel: 'Клиентски номер',
    placeholder: 'напр. 1200345678',
  },
  sofiyska_voda: {
    key: 'sofiyska_voda',
    name: 'Софийска вода',
    shortName: 'Софийска вода',
    icon: 'water',
    color: '#007AFF',
    checkUrl: 'https://www.sofiyskavoda.bg/online-uslugi/proverka-na-smetka',
    paymentUrl: 'https://www.sofiyskavoda.bg/online-uslugi/plashtane-na-smetka',
    defaultDueDay: 22,
    clientNumberLabel: 'Абонатен номер (7-8 цифри)',
    placeholder: 'напр. 8492015',
  },
  toplofikacia: {
    key: 'toplofikacia',
    name: 'Топлофикация София',
    shortName: 'Топлофикация',
    icon: 'flame',
    color: '#AF52DE',
    checkUrl: 'https://toplo.bg',
    paymentUrl: 'https://toplo.bg',
    defaultDueDay: 30,
    clientNumberLabel: 'Абонатен номер',
    placeholder: 'напр. 1049281',
  },
  a1: {
    key: 'a1',
    name: 'А1 (Интернет, ТВ, Мобилен)',
    shortName: 'А1',
    icon: 'tv',
    color: '#FF3B30',
    checkUrl: 'https://www.a1.bg/platane-na-smetka',
    paymentUrl: 'https://www.a1.bg/platane-na-smetka',
    defaultDueDay: 15,
    clientNumberLabel: 'Клиентски номер или ЕГН',
    placeholder: 'напр. 4820195',
  },
  vivacom: {
    key: 'vivacom',
    name: 'Vivacom (Интернет, ТВ, Мобилен)',
    shortName: 'Vivacom',
    icon: 'tv',
    color: '#FF9500',
    checkUrl: 'https://www.vivacom.bg/online-payment',
    paymentUrl: 'https://www.vivacom.bg/online-payment',
    defaultDueDay: 18,
    clientNumberLabel: 'Клиентски номер',
    placeholder: 'напр. 8201948',
  },
  yettel: {
    key: 'yettel',
    name: 'Yettel (Мобилен план)',
    shortName: 'Yettel',
    icon: 'phone-portrait',
    color: '#34C759',
    checkUrl: 'https://www.yettel.bg/pay-bill',
    paymentUrl: 'https://www.yettel.bg/pay-bill',
    defaultDueDay: 20,
    clientNumberLabel: 'Клиентски номер или телефон',
    placeholder: 'напр. 0899123456',
  },
};

/**
 * Opens official online provider bill check page directly inside the app
 */
export async function openProviderBillCheck(providerKey: string): Promise<void> {
  const provider = PROVIDERS_CONFIG[providerKey];
  const targetUrl = provider ? provider.checkUrl : 'https://www.epay.bg';
  await WebBrowser.openBrowserAsync(targetUrl);
}

/**
 * Opens official online payment portal (Apple Pay / Card) inside the app
 */
export async function openProviderPayPortal(providerKey: string): Promise<void> {
  const provider = PROVIDERS_CONFIG[providerKey];
  const targetUrl = provider?.paymentUrl || provider?.checkUrl || 'https://www.epay.bg';
  await WebBrowser.openBrowserAsync(targetUrl);
}

/**
 * Checks and updates latest bill for a saved subscriber number
 */
export async function syncSubscriptionBill(sub: UtilitySubscription): Promise<UtilitySubscription> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const dueDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${sub.due_day.toString().padStart(2, '0')}`;

  const currentAmount = sub.current_amount || 0;

  // Update in database
  await db.updateUtilitySubscriptionBill(sub.id, currentAmount, dueDate, sub.due_day, sub.is_paid);

  // Check if a corresponding bill entry exists in 'bills'
  const allBills = await db.getBills();
  const existingBill = allBills.find(
    (b) => b.id === `bill_auto_${sub.id}` || (sub.client_number && b.notes?.includes(sub.client_number))
  );

  if (currentAmount > 0) {
    if (!existingBill) {
      await db.createBill({
        id: `bill_auto_${sub.id}`,
        title: `${sub.provider_name} (${sub.alias})`,
        category_id: sub.category_id,
        amount: currentAmount,
        currency: 'BGN',
        due_day: sub.due_day,
        frequency: 'monthly',
        is_paid: sub.is_paid,
        reminder_enabled: 1,
        notes: `Клиентски № ${sub.client_number}`,
      });
    } else {
      await db.updateBillAmount(existingBill.id, currentAmount);
      await db.toggleBillPaid(existingBill.id, sub.is_paid === 1);
    }
  } else if (existingBill) {
    // If invoice is 0.00 лв (not issued yet or no dues), remove any pending bill debt
    await db.deleteBill(existingBill.id);
  }

  return {
    ...sub,
    current_amount: currentAmount,
    due_date: dueDate,
    last_checked: new Date().toISOString(),
  };
}
