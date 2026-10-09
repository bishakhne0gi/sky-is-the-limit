'use client';
import dynamic from 'next/dynamic';

const Experience = dynamic(() => import('@/world/Experience'), {
  ssr: false,
  loading: () => <div style={{ position: 'fixed', inset: 0, background: '#0b1020' }} />,
});

export default function FlyClient() {
  return <Experience />;
}
