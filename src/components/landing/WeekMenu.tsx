import { motion } from 'framer-motion'

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
}

export default function WeekMenu({ menu, isActive }: Props) {
  const hasDishes = menu.some(d => d.standard || d.standard_plus || d.premium)

  if (!hasDishes) {
    return (
      <motion.p
        className="text-neutral-500 text-lg"
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : {}}
      >
        Меню на эту неделю ещё не составлено
      </motion.p>
    )
  }

  return (
    <div className="w-full max-w-4xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-neutral-400 text-left border-b border-neutral-800">
            <th className="pb-3 pr-6 font-medium">День</th>
            <th className="pb-3 pr-6 font-medium text-white">Стандарт <span className="text-[#FF4D00]">350₽</span></th>
            <th className="pb-3 pr-6 font-medium text-white">Стандарт+ <span className="text-[#FF4D00]">450₽</span></th>
            <th className="pb-3 font-medium text-white">Премиум <span className="text-[#FF4D00]">650₽</span></th>
          </tr>
        </thead>
        <tbody>
          {menu.map((day, i) => (
            <motion.tr
              key={day.date}
              initial={{ opacity: 0, x: -20 }}
              animate={isActive ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.08 * i }}
              className="border-b border-neutral-800/50"
            >
              <td className="py-3 pr-6 text-neutral-400 font-medium whitespace-nowrap">{day.day}</td>
              <td className="py-3 pr-6 text-neutral-300">{day.standard || <span className="text-neutral-600">—</span>}</td>
              <td className="py-3 pr-6 text-neutral-300">{day.standard_plus || <span className="text-neutral-600">—</span>}</td>
              <td className="py-3 text-neutral-300">{day.premium || <span className="text-neutral-600">—</span>}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
