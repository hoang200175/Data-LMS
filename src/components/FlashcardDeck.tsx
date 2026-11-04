import { useEffect, useState } from 'react';
import { loadProgress, update } from '../lib/progress';

// Bộ thẻ ghi nhớ: xem mặt trước, tự nhớ lại, lật thẻ, rồi đánh dấu Đã nhớ / Chưa nhớ.
// Thẻ "chưa nhớ" được đưa lại vào cuối lượt ôn.
type Card = { front: string; back: string };
type Props = { id: string; cards: Card[] };

export default function FlashcardDeck({ id, cards }: Props) {
  const [queue, setQueue] = useState<number[]>(cards.map((_, i) => i));
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const raw = loadProgress().code[`cards:${id}`];
    if (raw) {
      const k = JSON.parse(raw) as Record<number, boolean>;
      setKnown(k);
      setQueue(cards.map((_, i) => i).filter((i) => !k[i]));
    }
  }, []);

  function mark(ok: boolean) {
    const cur = queue[0];
    const k = { ...known, [cur]: ok };
    setKnown(k);
    setQueue(ok ? queue.slice(1) : [...queue.slice(1), cur]);
    setFlipped(false);
    update((p) => {
      p.code[`cards:${id}`] = JSON.stringify(k);
      p.done[id] = cards.every((_, i) => k[i]);
    });
  }

  function restart() {
    setKnown({});
    setQueue(cards.map((_, i) => i));
    setFlipped(false);
    update((p) => { delete p.code[`cards:${id}`]; p.done[id] = false; });
  }

  const nKnown = Object.values(known).filter(Boolean).length;
  const cur = queue[0];

  return (
    <div className="deck">
      <div className="deck-head">
        <strong>Thẻ ghi nhớ</strong>
        <span className={nKnown === cards.length ? 'badge good' : 'badge'}>Đã nhớ {nKnown}/{cards.length}</span>
      </div>
      {cur === undefined ? (
        <div className="deck-done">
          <p>Bạn đã nhớ hết {cards.length} thẻ. Quay lại ôn sau vài ngày để nhớ lâu hơn.</p>
          <button onClick={restart}>Ôn lại từ đầu</button>
        </div>
      ) : (
        <>
          <button className={`card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label="Lật thẻ">
            <span className="card-side">{flipped ? 'Đáp án' : 'Câu hỏi'}</span>
            <span className="card-text">{flipped ? cards[cur].back : cards[cur].front}</span>
            {!flipped && <span className="card-hint">Tự trả lời trong đầu, rồi bấm để lật thẻ</span>}
          </button>
          {flipped && (
            <div className="deck-actions">
              <button onClick={() => mark(false)}>Chưa nhớ</button>
              <button className="primary" onClick={() => mark(true)}>Đã nhớ</button>
            </div>
          )}
          <p className="muted deck-left">Còn {queue.length} thẻ trong lượt này</p>
        </>
      )}
    </div>
  );
}
