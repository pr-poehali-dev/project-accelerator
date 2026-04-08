import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import Layout from './Layout'
import OrderForm from './OrderForm'
import WeekMenu from './WeekMenu'
import type { MenuDay } from '@/types'

const MENU_URL = 'https://functions.poehali.dev/c6021c97-ab9d-46c8-add5-7ad3db5f218e'

const navSections = [
  { id: 'hero', label: 'Главная' },
  { id: 'order', label: 'Заказ' },
  { id: 'menu', label: 'Меню' },
]

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState(0)
  const [menu, setMenu] = useState<MenuDay[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: containerRef })
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    fetch(MENU_URL).then(r => r.json()).then(d => setMenu(d.menu || []))
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollPosition = containerRef.current.scrollTop
        const windowHeight = window.innerHeight
        const newActiveSection = Math.floor(scrollPosition / windowHeight)
        setActiveSection(newActiveSection)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const handleNavClick = (index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * window.innerHeight,
        behavior: 'smooth'
      })
    }
  }

  const scrollToOrder = () => {
    handleNavClick(1)
  }

  return (
    <Layout>
      <nav className="fixed top-0 right-0 h-screen flex flex-col justify-center z-30 p-4">
        {navSections.map((section, index) => (
          <button
            key={section.id}
            className={`w-3 h-3 rounded-full my-2 transition-all ${
              index === activeSection ? 'bg-white scale-150' : 'bg-gray-600'
            }`}
            onClick={() => handleNavClick(index)}
            title={section.label}
          />
        ))}
      </nav>
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-[#FF4D00] origin-left z-30"
        style={{ scaleX }}
      />

      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory"
      >
        {/* Hero */}
        <section id="hero" className="relative h-screen w-full snap-start flex flex-col justify-center p-8 md:p-16 lg:p-24">
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={activeSection === 0 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[#FF4D00] text-sm uppercase tracking-widest font-semibold">Обеды в офис</span>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-6xl lg:text-[5rem] font-black leading-[1.1] tracking-tight max-w-3xl text-white"
            initial={{ opacity: 0, y: 50 }}
            animate={activeSection === 0 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            Вкусные обеды — каждый день.
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl max-w-xl mt-6 text-neutral-400"
            initial={{ opacity: 0, y: 30 }}
            animate={activeSection === 0 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Три типа обеда на любой вкус и бюджет. Выбираете тип, указываете имя — мы всё остальное.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={activeSection === 0 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10"
          >
            <button
              onClick={scrollToOrder}
              className="px-8 py-3 rounded-xl border-2 border-[#FF4D00] text-[#FF4D00] font-semibold text-lg hover:bg-[#FF4D00] hover:text-white transition-all"
            >
              Заказать обед
            </button>
          </motion.div>
        </section>

        {/* Order */}
        <section id="order" className="relative h-screen w-full snap-start flex flex-col justify-center p-8 md:p-16 lg:p-24">
          <motion.h2
            className="text-3xl md:text-5xl font-black text-white mb-2"
            initial={{ opacity: 0, y: 30 }}
            animate={activeSection === 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            Выберите тип
          </motion.h2>
          <motion.p
            className="text-neutral-400 mb-8"
            initial={{ opacity: 0 }}
            animate={activeSection === 1 ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Нажмите на карточку, введите ФИО и оформите заказ
          </motion.p>
          <OrderForm menu={menu} isActive={activeSection === 1} onSuccess={() => {}} />
        </section>

        {/* Menu */}
        <section id="menu" className="relative h-screen w-full snap-start flex flex-col justify-center p-8 md:p-16 lg:p-24">
          <motion.h2
            className="text-3xl md:text-5xl font-black text-white mb-2"
            initial={{ opacity: 0, y: 30 }}
            animate={activeSection === 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            Меню на неделю
          </motion.h2>
          <motion.p
            className="text-neutral-400 mb-8"
            initial={{ opacity: 0 }}
            animate={activeSection === 2 ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Знайте заранее, что вас ждёт каждый день
          </motion.p>
          <WeekMenu menu={menu} isActive={activeSection === 2} />
        </section>
      </div>
    </Layout>
  )
}