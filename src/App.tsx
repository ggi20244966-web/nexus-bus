import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuroraCanvas } from '@/components/background/AuroraCanvas';
import { Header, TABS, type View } from '@/components/layout/Header';
import { HomePage } from '@/components/home/HomePage';
import { IntroSplash, markIntroSeen, shouldPlayIntro } from '@/components/intro/IntroSplash';
import { ChannelList } from '@/components/rooms/ChannelList';
import { RoomSwiper } from '@/components/rooms/RoomSwiper';
import { EventBusPanel } from '@/components/metrics/EventBusPanel';
import { MetricInspector } from '@/components/metrics/MetricInspector';
import { HistoryArchive } from '@/components/archive/HistoryArchive';
import { TransportProvider } from '@/services/TransportProvider';
import { pageSwap } from '@/config/motion';

function LiveView() {
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_340px] lg:grid-cols-[260px_1fr_370px]">
      <div className="md:col-span-2 lg:col-span-1"><ChannelList /></div>
      <RoomSwiper />
      <EventBusPanel />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [intro, setIntro] = useState(shouldPlayIntro);
  const prev = useRef(0);
  const idx = TABS.findIndex((t) => t.id === view);
  const dir = idx >= prev.current ? 1 : -1;

  const finishIntro = useCallback(() => {
    markIntroSeen();
    setIntro(false);
  }, []);

  const change = (v: View) => {
    prev.current = idx;
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <TransportProvider>
      <AuroraCanvas />
      <Header view={view} onChange={change} />
      <main className="mx-auto w-full max-w-[1640px] overflow-x-clip px-5 pb-8 pt-5 md:px-8">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div key={view} custom={dir} variants={pageSwap} initial="enter" animate="center" exit="exit">
            {view === 'home' && <HomePage onNavigate={change} />}
            {view === 'live' && <LiveView />}
            {view === 'archive' && <HistoryArchive />}
            {view === 'inspector' && <MetricInspector />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>{intro && <IntroSplash key="intro" onDone={finishIntro} />}</AnimatePresence>
    </TransportProvider>
  );
}