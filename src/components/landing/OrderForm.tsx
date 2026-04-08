import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const ORDERS_URL = 'https://functions.poehali.dev/9bfc9070-3a77-4016-90ab-464e822401d4'

const plans = [
  { id: 'standard', label: 'Стандарт', price: 350, desc: 'Суп + второе блюдо + салат' },
  { id: 'standard_plus', label: 'Стандарт+', price: 450, desc: 'Суп + второе + салат' },
  { id: 'premium', label: 'Премиум', price: 650, desc: 'Суп + второе + салат + напиток + десерт' },
]

interface MenuDay {
  date: string
  day: string
  standard: string
  standard_plus: string
  premium: string
}

interface Props {
  menu: MenuDay[]
  isActive: boolean
  onSuccess: () => void
}

export default function OrderForm({ menu, isActive, onSuccess }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const today = new Date().toISOString().split('T')[0]
  const todayMenu = menu.find(m => m.date === today)

  const handleOrder = async () => {
    if (!selectedPlan) {
      toast({ title: 'Выберите тариф', variant: 'destructive' })
      return
    }
    if (!fullName.trim()) {
      toast({ title: 'Введите ваше ФИО', variant: 'destructive' })
      return
    }

    setLoading(true)
    const res = await fetch(ORDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName.trim(), plan: selectedPlan })
    })
    const data = await res.json()
    setLoading(false)

    if (data.success) {
      toast({ title: 'Заказ оформлен! Ждём вас к обеду.' })
      setFullName('')
      setSelectedPlan(null)
      onSuccess()
    } else {
      toast({ title: 'Ошибка при оформлении заказа', variant: 'destructive' })
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {plans.map((plan, i) => {
          const dish = todayMenu ? todayMenu[plan.id as keyof MenuDay] : ''
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isActive ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                selectedPlan === plan.id
                  ? 'border-[#FF4D00] bg-[#FF4D00]/10'
                  : 'border-neutral-700 bg-neutral-900/50 hover:border-neutral-500'
              }`}
            >
              <div className="text-xl font-bold text-white mb-1">{plan.label}</div>
              <div className="text-3xl font-black text-[#FF4D00] mb-3">{plan.price} ₽</div>
              <div className="text-sm text-neutral-400 mb-3">{plan.desc}</div>
              {dish && (
                <div className="text-sm text-neutral-300 border-t border-neutral-700 pt-3">
                  <span className="text-neutral-500 text-xs uppercase tracking-wide">Сегодня:</span>
                  <div className="mt-1">{dish}</div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isActive ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Input
          placeholder="Введите ваше ФИО"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="bg-neutral-900/70 border-neutral-700 text-white placeholder:text-neutral-500 flex-1"
          onKeyDown={e => e.key === 'Enter' && handleOrder()}
        />
        <Button
          onClick={handleOrder}
          disabled={loading}
          className="bg-[#FF4D00] hover:bg-[#e03d00] text-white font-semibold px-8 whitespace-nowrap"
        >
          {loading ? 'Оформляем...' : 'Заказать обед'}
        </Button>
      </motion.div>
    </div>
  )
}