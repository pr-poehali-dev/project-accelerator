import { useState, useEffect } from 'react'
import Layout from '@/components/landing/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import Icon from '@/components/ui/icon'

const ORDERS_URL = 'https://functions.poehali.dev/9bfc9070-3a77-4016-90ab-464e822401d4'
const MENU_URL = 'https://functions.poehali.dev/c6021c97-ab9d-46c8-add5-7ad3db5f218e'

interface Order {
  id: number
  full_name: string
  plan: string
  plan_label: string
  price: number
  order_date: string
  created_at: string
}

interface Counts {
  standard: number
  standard_plus: number
  premium: number
}

interface MenuDay {
  date: string
  day: string
  standard: string
  standard_plus: string
  premium: string
}

const PIN = '1234'
const PLAN_OPTIONS = [
  { value: 'standard', label: 'Стандарт (350₽)' },
  { value: 'standard_plus', label: 'Стандарт+ (450₽)' },
  { value: 'premium', label: 'Премиум (650₽)' },
]

export default function Admin() {
  const [auth, setAuth] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [counts, setCounts] = useState<Counts>({ standard: 0, standard_plus: 0, premium: 0 })
  const [menu, setMenu] = useState<MenuDay[]>([])
  const [tab, setTab] = useState<'orders' | 'menu'>('orders')
  const [saving, setSaving] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editName, setEditName] = useState('')
  const [editPlan, setEditPlan] = useState('')
  const [filterDate, setFilterDate] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    if (auth) {
      fetchOrders()
      fetchMenu()
    }
  }, [auth])

  const fetchOrders = async () => {
    const res = await fetch(ORDERS_URL)
    const data = await res.json()
    setOrders(data.orders || [])
    setCounts(data.counts || { standard: 0, standard_plus: 0, premium: 0 })
  }

  const fetchMenu = async () => {
    const res = await fetch(MENU_URL)
    const data = await res.json()
    setMenu(data.menu || [])
  }

  const handlePin = () => {
    if (pinInput === PIN) {
      setAuth(true)
    } else {
      toast({ title: 'Неверный пин-код', variant: 'destructive' })
      setPinInput('')
    }
  }

  const handleMenuChange = (index: number, field: keyof MenuDay, value: string) => {
    setMenu(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  const handleSaveMenu = async () => {
    setSaving(true)
    const res = await fetch(MENU_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu })
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      toast({ title: 'Меню сохранено!' })
    } else {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' })
    }
  }

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Удалить этот заказ?')) return
    const res = await fetch(`${ORDERS_URL}?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      toast({ title: 'Заказ удалён' })
      fetchOrders()
    } else {
      toast({ title: 'Ошибка удаления', variant: 'destructive' })
    }
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    setEditName(order.full_name)
    setEditPlan(order.plan)
  }

  const handleSaveOrder = async () => {
    if (!editingOrder) return
    const res = await fetch(ORDERS_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingOrder.id, full_name: editName, plan: editPlan })
    })
    const data = await res.json()
    if (data.success) {
      toast({ title: 'Заказ обновлён' })
      setEditingOrder(null)
      fetchOrders()
    } else {
      toast({ title: 'Ошибка обновления', variant: 'destructive' })
    }
  }

  const handlePrint = () => {
    const filtered = filterDate ? orders.filter(o => o.order_date === filterDate) : orders
    const dateLabel = filterDate || 'все даты'

    const countByPlan = { standard: 0, standard_plus: 0, premium: 0 }
    filtered.forEach(o => {
      if (o.plan in countByPlan) countByPlan[o.plan as keyof typeof countByPlan]++
    })
    const revenue = countByPlan.standard * 350 + countByPlan.standard_plus * 450 + countByPlan.premium * 650

    const rows = filtered.map(o =>
      `<tr><td>${o.full_name}</td><td>${o.plan_label}</td><td>${o.price} ₽</td><td>${o.order_date}</td></tr>`
    ).join('')

    const html = `
      <html><head><meta charset="utf-8"><title>Заказы обедов</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 13px; margin-bottom: 20px; }
        .stats { display: flex; gap: 24px; margin-bottom: 20px; }
        .stat { background: #f5f5f5; border-radius: 8px; padding: 10px 16px; }
        .stat-label { font-size: 11px; color: #888; text-transform: uppercase; }
        .stat-val { font-size: 22px; font-weight: 900; }
        .revenue { color: #e03d00; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; border-bottom: 2px solid #ddd; padding: 8px 12px; color: #555; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        @media print { button { display: none; } }
      </style></head>
      <body>
        <h1>Список заказов обедов</h1>
        <div class="sub">Дата: ${dateLabel} · Распечатано: ${new Date().toLocaleString('ru')}</div>
        <div class="stats">
          <div class="stat"><div class="stat-label">Всего</div><div class="stat-val">${filtered.length}</div></div>
          <div class="stat"><div class="stat-label">Стандарт</div><div class="stat-val">${countByPlan.standard}</div></div>
          <div class="stat"><div class="stat-label">Стандарт+</div><div class="stat-val">${countByPlan.standard_plus}</div></div>
          <div class="stat"><div class="stat-label">Премиум</div><div class="stat-val">${countByPlan.premium}</div></div>
          <div class="stat"><div class="stat-label">Выручка</div><div class="stat-val revenue">${revenue.toLocaleString()} ₽</div></div>
        </div>
        <table>
          <thead><tr><th>ФИО</th><th>Тариф</th><th>Сумма</th><th>Дата заказа</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      w.print()
    }
  }

  if (!auth) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-8 w-full max-w-sm">
            <h1 className="text-2xl font-bold text-white mb-2">Панель владельца</h1>
            <p className="text-neutral-400 text-sm mb-6">Введите пин-код для входа</p>
            <Input
              type="password"
              placeholder="Пин-код"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePin()}
              className="bg-neutral-800 border-neutral-700 text-white mb-4"
            />
            <Button onClick={handlePin} className="w-full bg-[#FF4D00] hover:bg-[#e03d00] text-white font-semibold">
              Войти
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const totalOrders = counts.standard + counts.standard_plus + counts.premium
  const totalRevenue = counts.standard * 350 + counts.standard_plus * 450 + counts.premium * 650

  const filteredOrders = filterDate ? orders.filter(o => o.order_date === filterDate) : orders

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Панель владельца</h1>
          <p className="text-neutral-400 mb-8">Управление заказами и меню</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
              <div className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Всего заказов</div>
              <div className="text-3xl font-black text-white">{totalOrders}</div>
            </div>
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
              <div className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Стандарт</div>
              <div className="text-3xl font-black text-white">{counts.standard}</div>
            </div>
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
              <div className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Стандарт+</div>
              <div className="text-3xl font-black text-white">{counts.standard_plus}</div>
            </div>
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
              <div className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Премиум</div>
              <div className="text-3xl font-black text-white">{counts.premium}</div>
            </div>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 mb-8 inline-block">
            <span className="text-neutral-400 text-sm">Выручка: </span>
            <span className="text-[#FF4D00] font-bold text-xl">{totalRevenue.toLocaleString()} ₽</span>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('orders')}
              className={`px-5 py-2 rounded-lg font-medium transition-all ${tab === 'orders' ? 'bg-[#FF4D00] text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
            >
              Заказы
            </button>
            <button
              onClick={() => setTab('menu')}
              className={`px-5 py-2 rounded-lg font-medium transition-all ${tab === 'menu' ? 'bg-[#FF4D00] text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
            >
              Меню на неделю
            </button>
          </div>

          {tab === 'orders' && (
            <>
              {/* Фильтр и печать */}
              <div className="flex flex-wrap gap-3 items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-sm">Дата:</span>
                  <select
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2"
                  >
                    <option value="">Все дни</option>
                    {Array.from(new Set(orders.map(o => o.order_date))).sort().map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="border-neutral-600 text-neutral-300 hover:text-white hover:border-white gap-2"
                >
                  <Icon name="Printer" size={15} />
                  Распечатать
                </Button>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl overflow-hidden">
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">Заказов пока нет</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400">
                        <th className="text-left p-4 font-medium">ФИО</th>
                        <th className="text-left p-4 font-medium">Тариф</th>
                        <th className="text-left p-4 font-medium">Сумма</th>
                        <th className="text-left p-4 font-medium">Дата</th>
                        <th className="text-left p-4 font-medium">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                          {editingOrder?.id === order.id ? (
                            <>
                              <td className="p-3">
                                <Input
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  className="bg-neutral-700 border-neutral-600 text-white text-sm h-8"
                                />
                              </td>
                              <td className="p-3">
                                <select
                                  value={editPlan}
                                  onChange={e => setEditPlan(e.target.value)}
                                  className="bg-neutral-700 border border-neutral-600 text-white text-sm rounded-md px-2 h-8 w-full"
                                >
                                  {PLAN_OPTIONS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3 text-[#FF4D00] font-semibold">
                                {editPlan === 'standard' ? 350 : editPlan === 'standard_plus' ? 450 : 650} ₽
                              </td>
                              <td className="p-4 text-neutral-400">{order.order_date}</td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <button onClick={handleSaveOrder} className="text-green-400 hover:text-green-300 transition-colors" title="Сохранить">
                                    <Icon name="Check" size={16} />
                                  </button>
                                  <button onClick={() => setEditingOrder(null)} className="text-neutral-400 hover:text-white transition-colors" title="Отмена">
                                    <Icon name="X" size={16} />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-4 text-white">{order.full_name}</td>
                              <td className="p-4 text-neutral-300">{order.plan_label}</td>
                              <td className="p-4 text-[#FF4D00] font-semibold">{order.price} ₽</td>
                              <td className="p-4 text-neutral-400">{order.order_date}</td>
                              <td className="p-4">
                                <div className="flex gap-3">
                                  <button onClick={() => handleEditOrder(order)} className="text-neutral-400 hover:text-white transition-colors" title="Редактировать">
                                    <Icon name="Pencil" size={15} />
                                  </button>
                                  <button onClick={() => handleDeleteOrder(order.id)} className="text-neutral-400 hover:text-red-400 transition-colors" title="Удалить">
                                    <Icon name="Trash2" size={15} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {tab === 'menu' && (
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-6">
              <div className="space-y-6">
                {menu.map((day, i) => (
                  <div key={day.date} className="border-b border-neutral-800 pb-6 last:border-0 last:pb-0">
                    <div className="text-white font-semibold mb-3">{day.day}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="text-neutral-400 text-xs mb-1">Стандарт (350₽)</div>
                        <Input value={day.standard} onChange={e => handleMenuChange(i, 'standard', e.target.value)} placeholder="Блюдо..." className="bg-neutral-800 border-neutral-700 text-white text-sm" />
                      </div>
                      <div>
                        <div className="text-neutral-400 text-xs mb-1">Стандарт+ (450₽)</div>
                        <Input value={day.standard_plus} onChange={e => handleMenuChange(i, 'standard_plus', e.target.value)} placeholder="Блюдо..." className="bg-neutral-800 border-neutral-700 text-white text-sm" />
                      </div>
                      <div>
                        <div className="text-neutral-400 text-xs mb-1">Премиум (650₽)</div>
                        <Input value={day.premium} onChange={e => handleMenuChange(i, 'premium', e.target.value)} placeholder="Блюдо..." className="bg-neutral-800 border-neutral-700 text-white text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveMenu} disabled={saving} className="mt-6 bg-[#FF4D00] hover:bg-[#e03d00] text-white font-semibold">
                {saving ? 'Сохраняем...' : 'Сохранить меню'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
