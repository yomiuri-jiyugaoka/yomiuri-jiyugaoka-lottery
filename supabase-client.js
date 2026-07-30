// Supabase接続情報（公開して問題ない publishable key です）
const SUPABASE_URL = 'https://xxtqlxfknmbbfjdidjjl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T-W8_Mpp-bY32HrQ7Ap8bw_u_byDRHD';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- 読み込み ----------
async function fetchPrizes(){
  const { data, error } = await supabaseClient
    .from('lottery_prizes')
    .select('*')
    .order('rank_tier', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if(error){ console.error('景品の取得に失敗', error); return []; }
  return data;
}

async function fetchSettings(){
  const { data, error } = await supabaseClient
    .from('lottery_settings')
    .select('center_name')
    .eq('id', 1)
    .single();
  if(error){ console.error('設定の取得に失敗', error); return { center_name: 'ガラガラ抽選会' }; }
  return data;
}

async function fetchHistory(limit){
  const { data, error } = await supabaseClient
    .from('lottery_history')
    .select('*')
    .order('drawn_at', { ascending: false })
    .limit(limit);
  if(error){ console.error('履歴の取得に失敗', error); return []; }
  return data;
}

// ---------- 抽選を1回引く（サーバー側で在庫を安全に1減らす） ----------
async function drawPrizeRemote(){
  const { data, error } = await supabaseClient.rpc('draw_prize');
  if(error){ console.error('抽選の実行に失敗', error); return null; }
  if(!data || data.length === 0) return { soldOut: true };
  const winner = data[0];
  return { soldOut: false, emoji: winner.out_emoji, name: winner.out_name, rankTier: winner.out_rank_tier };
}

// ---------- リアルタイム購読（他の端末での変更を受け取る） ----------
function subscribeLotteryRealtime({ onPrizesChange, onHistoryChange }){
  const channel = supabaseClient
    .channel('lottery-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_prizes' }, () => {
      if(onPrizesChange) onPrizesChange();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_history' }, () => {
      if(onHistoryChange) onHistoryChange();
    })
    .subscribe();
  return channel;
}

// ---------- ミュート設定（端末ごとに保存でOK） ----------
function loadMuted(){
  try{ return localStorage.getItem('lottery-muted') === '1'; }catch(e){ return false; }
}
function saveMuted(muted){
  try{ localStorage.setItem('lottery-muted', muted ? '1' : '0'); }catch(e){}
}
