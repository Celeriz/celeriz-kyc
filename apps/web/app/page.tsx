import styles from './page.module.css';
import App from './components/App';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <App />
      </main>
    </div>
  );
}
