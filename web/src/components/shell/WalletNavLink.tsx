'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Wallet as WalletIcon } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';
import type { Wallet } from '@/lib/types';

/** Balance pill in the top navbar; links to the wallet (company) or earnings (student). */
export function WalletNavLink() {
  const { data } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get<Wallet>('/wallet'),
  });

  const href = data?.role === 'GRADUATE' ? '/earnings' : '/wallet';

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-n300 bg-n0 px-3.5 py-1.5 text-[14px] font-semibold text-n900 transition-colors hover:border-primary hover:text-primary"
    >
      <WalletIcon className="h-4 w-4 text-primary" />
      {data ? formatMoney(data.balance, data.currency) : 'Wallet'}
    </Link>
  );
}
