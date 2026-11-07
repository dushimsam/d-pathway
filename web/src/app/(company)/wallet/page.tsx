'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet as WalletIcon, Lock, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';
import type { CompanyWallet } from '@/lib/types';

export default function CompanyWalletPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 max-w-3xl" />}>
      <WalletInner />
    </Suspense>
  );
}

function WalletInner() {
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get<CompanyWallet>('/wallet'),
  });

  // After returning from Stripe, verify the session and credit the balance once.
  const sessionId = params.get('session_id');
  const topup = params.get('topup');
  useEffect(() => {
    if (topup === 'success' && sessionId) {
      api
        .get<{ credited: boolean; amount?: number }>(
          `/wallet/topup/confirm?session_id=${sessionId}`,
        )
        .then((r) => {
          setNotice(
            r.credited
              ? `Top-up successful — ${formatMoney(r.amount ?? 0, data?.currency)} added.`
              : 'This top-up was already applied.',
          );
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
        })
        .catch(() => setError('We could not confirm that payment.'))
        .finally(() => router.replace('/wallet'));
    } else if (topup === 'cancelled') {
      setNotice('Top-up cancelled.');
      router.replace('/wallet');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topup, sessionId]);

  const topUp = useMutation({
    mutationFn: () => api.post<{ url: string }>('/wallet/topup', { amount: Number(amount) }),
    onSuccess: (r) => {
      window.location.href = r.url; // redirect to Stripe Checkout
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : 'Could not start the top-up.'),
  });

  if (isLoading) return <Skeleton className="h-96 max-w-3xl" />;
  if (isError || !data)
    return <ErrorState message="Could not load your wallet." onRetry={() => refetch()} />;

  const total = data.balance + data.reserved;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Wallet"
        description="Top up to fund prizes. Prize money is held until you award a winner."
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-n500">
            <WalletIcon className="h-3.5 w-3.5" /> Available
          </span>
          <span className="text-[24px] font-semibold text-n900">
            {formatMoney(data.balance, data.currency)}
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-n500">
            <Lock className="h-3.5 w-3.5" /> Reserved for prizes
          </span>
          <span className="text-[24px] font-semibold text-n900">
            {formatMoney(data.reserved, data.currency)}
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-[12px] uppercase tracking-wide text-n500">Total funded</span>
          <span className="text-[24px] font-semibold text-n900">
            {formatMoney(total, data.currency)}
          </span>
        </Card>
      </div>

      <Card className="mb-6 flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-n900">Top up your balance</h2>
        <form
          className="flex items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (Number(amount) > 0) topUp.mutate();
          }}
        >
          <div className="flex-1">
            <Field label={`Amount (${data.currency.toUpperCase()})`} htmlFor="amount">
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 200000"
              />
            </Field>
          </div>
          <Button type="submit" disabled={!(Number(amount) > 0) || topUp.isPending}>
            <Plus className="h-4 w-4" />
            {topUp.isPending ? 'Redirecting…' : 'Top up with card'}
          </Button>
        </form>
        <p className="text-[12px] text-n500">
          Secured by Stripe (test mode). Use card 4242 4242 4242 4242, any future
          expiry and CVC.
        </p>
      </Card>

      <h2 className="mb-3 text-[16px] font-semibold text-n900">Transactions</h2>
      {data.transactions.length === 0 ? (
        <Card className="text-[14px] text-n500">No transactions yet.</Card>
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
