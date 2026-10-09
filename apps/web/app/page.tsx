import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Sky is the limit</h1>
      <p className={styles.lede}>Fold what you carry into a paper plane. Breathe it upward with strangers. There is no top — only higher.</p>
      <Link href="/fly" className={styles.begin}>Begin</Link>
    </main>
  );
}
