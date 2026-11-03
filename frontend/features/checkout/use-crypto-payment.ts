'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTonConnectUI } from '@tonconnect/ui-react'
import api from '@/lib/api'
import type { PaymentMethods } from '@/types'

export type PayMethod = 'hosted' | 'ton' | 'usdt'

const TON_CHECK_INTERVAL_MS = 5000
const TON_CHECK_ATTEMPTS = 24 // ~2 minutes; the server keeps watching after that

let cachedMethods: PaymentMethods | null = null

/** Which payment methods the server offers (cached per page load). */
export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethods | null>(cachedMethods)
  useEffect(() => {
    if (cachedMethods) return
    api.payments
      .methods()
      .then((loaded) => setMethods((cachedMethods = loaded)))
      .catch(() => setMethods({ hosted: true, ton: false, usdt: false, hostedProvider: 'nowpayments', tonNetwork: 'mainnet' }))
  }, [])
  return methods
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Pays an order:
 * - `hosted`: redirects to the hosted crypto checkout (NOWPayments / dev mock).
 * - `ton`: asks the connected wallet (TON Connect) to send the quoted amount with the order's
 *   comment, then checks the chain until the server sees it.
 * - `usdt`: same, as a USDT jetton transfer. The server needs the wallet address first to find
 *   the buyer's USDT wallet, so the wallet is connected before the payment is started.
 */
export function useCryptoPayment() {
  const router = useRouter()
  const [tonConnectUI] = useTonConnectUI()
  const [stage, setStage] = useState<'idle' | 'starting' | 'wallet' | 'confirming'>('idle')

  const waitForWallet = useCallback(async () => {
    if (tonConnectUI.connected) return
    await new Promise<void>((resolve, reject) => {
      const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
        if (wallet) {
          unsubscribe()
          unsubscribeModal()
          resolve()
        }
      })
      const unsubscribeModal = tonConnectUI.onModalStateChange((state) => {
        if (state.status === 'closed' && !tonConnectUI.connected) {
          unsubscribe()
          unsubscribeModal()
          reject(new Error('Wallet connection cancelled'))
        }
      })
      tonConnectUI.openModal()
    })
  }, [tonConnectUI])

  const pay = useCallback(
    async (orderId: string, method: PayMethod) => {
      setStage('starting')
      try {
        if (method === 'usdt') await waitForWallet()
        const payment = await api.orders.pay(orderId, method, tonConnectUI.account?.address)
        if (payment.method === 'hosted') {
          window.location.href = payment.paymentUrl
          return
        }

        await waitForWallet()
        setStage('wallet')
        await tonConnectUI.sendTransaction({
          validUntil: payment.validUntil,
          // TON Connect network ids: -239 mainnet, -3 testnet.
          network: payment.network === 'testnet' ? '-3' : '-239',
          messages: [{ address: payment.address, amount: payment.amount, payload: payment.payload }],
        })

        setStage('confirming')
        for (let attempt = 0; attempt < TON_CHECK_ATTEMPTS; attempt++) {
          await sleep(TON_CHECK_INTERVAL_MS)
          const order = await api.orders.checkTon(orderId).catch(() => null)
          if (order && order.paymentStatus !== 'WAITING') break
        }
        router.push(`/checkout/complete?order=${orderId}`)
      } finally {
        setStage('idle')
      }
    },
    [router, tonConnectUI, waitForWallet]
  )

  return { pay, stage, busy: stage !== 'idle' }
}
