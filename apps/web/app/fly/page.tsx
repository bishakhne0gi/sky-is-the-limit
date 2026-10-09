import type { Metadata } from 'next';
import FlyClient from './FlyClient';

export const metadata: Metadata = { title: 'Fly · Sky is the limit' };

export default function FlyPage() {
  return <FlyClient />;
}
