'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';
import type { GraduateWallet } from '@/lib/types';

export default function EarningsPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get<GraduateWallet>('/wallet'),
  });

  const cashOut = useMutation({
    mutationFn: () =>
      api.post<{ balance: number }>('/wallet/withdrawals', { amount: Number(amount) }),
    onSuccess: () => {
      setError(null);
      setNotice(`Cashed out ${formatMoney(Number(amount), data?.currency)}.`);
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : 'Could not cash out.'),
  });

  if (isLoading) return <Skeleton className="h-96 max-w-3xl" />;
  if (isError || !data)
    return <ErrorState message="Could not load your earnings." onRetry={() => refetch()} />;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Earnings"
        description="Prize money you've won lands here. Cash out any time."
      />

      {notice && (
        <div className="mb-4 rounded-[10px] bg-success-50 p-3 text-[14px] text-success">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-[10px] bg-danger-50 p-3 text-[14px] text-danger">
          {error}
        </div>
      )}

      <Card className="mb-6 flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-n500">
          <WalletIcon className="h-3.5 w-3.5" /> Available balance
        </span>
        <span className="text-[32px] font-semibold text-n900">
          {formatMoney(data.balance, data.currency)}
        </span>
      </Card>

      <Card className="mb-6 flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-n900">Cash out</h2>
        <form
          className="flex items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (Number(amount) > 0) cashOut.mutate();
          }}
        >
          <div className="flex-1">
            <Field label={`Amount (${data.currency.toUpperCase()})`} htmlFor="amount">
              <Input
                id="amount"
                type="number"
                min={1}
                max={data.balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
              />
            </Field>
          </div>
          <Button
            type="submit"
            disabled={!(Number(amount) > 0) || Number(amount) > data.balance || cashOut.isPending}
          >
            {cashOut.isPending ? 'Processing…' : 'Cash out'}
          </Button>
        </form>
        <p className="text-[12px] text-n500">
          Withdrawals are recorded against your balance and paid out off-platform.
        </p>
      </Card>

      <h2 className="mb-3 text-[16px] font-semibold text-n900">Transactions</h2>
      {data.transactions.length === 0 ? (
        <Card className="text-[14px] text-n500">
          Nothing yet — win a prize to start earning.
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {data.transactions.map((t) => (
            <Card key={t.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    t.amount >= 0 ? 'bg-success-50 text-success' : 'bg-n100 text-n500'
                  }`}
                >
                  {t.amount >= 0 ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <p className="text-[14px] text-n900">{t.description}</p>
                  <p className="text-[12px] text-n500">
                    {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <span
                className={`text-[14px] font-semibold ${
                  t.amount >= 0 ? 'text-success' : 'text-n700'
                }`}
              >
                {t.amount >= 0 ? '+' : '−'}
                {formatMoney(Math.abs(t.amount), data.currency)}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
