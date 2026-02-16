// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://itmhwyamdcdcompixnrk.supabase.co';
const supabaseKey = 'sb_publishableKEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// export functies zodat main.js ze kan importeren
export function uploadScore(playerName, bestLap, currentTable) {
    if (!playerName || bestLap == null) return;
    supabase.from(currentTable).insert([{ player_name: playerName, lap_time: bestLap }])
    .then(({ data, error }) => {
        if (error) console.error('Supabase error:', error);
        else console.log(`Score uploaded to ${currentTable}:`, data);
    });
}

export function uploadEndScores(players, currentTable) {
    if (players.P1.lap > 0) uploadScore(players.P1.name, players.P1.bestLap, currentTable);
    if (players.P2.lap > 0) uploadScore(players.P2.name, players.P2.bestLap, currentTable);
}
