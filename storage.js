// 抽選アプリの共通データ管理
// index.html（抽選画面）と admin.html（設定画面）の両方から読み込みます。
// GitHub Pagesのような静的サイトでは window.storage は使えないため、
// ブラウザ標準の localStorage を使ってこの端末・このブラウザに保存します。

const LOTTERY_STORAGE_KEY = 'yomiuri-lottery-state-v1';

function defaultLotteryState(){
  return {
    centerName: 'よみうりカルチャー自由が丘',
    muted: false,
    prizes: [
      { id: 1, emoji:'🧸', name:'ぬいぐるみ', total:3, remaining:3 },
      { id: 2, emoji:'🖊️', name:'すてきな文房具', total:10, remaining:10 },
      { id: 3, emoji:'🍬', name:'おかしセット', total:20, remaining:20 },
      { id: 4, emoji:'🎫', name:'また挑戦してね', total:9999, remaining:9999 },
    ],
    history: []
  };
}

function loadLotteryState(){
  const fallback = defaultLotteryState();
  try{
    const raw = localStorage.getItem(LOTTERY_STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      return Object.assign(fallback, parsed);
    }
  }catch(e){
    console.error('保存データの読み込みに失敗しました。初期データを使用します。', e);
  }
  return fallback;
}

function saveLotteryState(state){
  try{
    localStorage.setItem(LOTTERY_STORAGE_KEY, JSON.stringify(state));
    return true;
  }catch(e){
    console.error('保存に失敗しました', e);
    return false;
  }
}

function nextPrizeId(state){
  return 1 + state.prizes.reduce((m,p)=>Math.max(m,p.id),0);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
