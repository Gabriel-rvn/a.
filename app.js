const express = require('express');
const axios = require('axios');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('./testSQL/test1.db'); 
const RIOT_API_KEY = "RGAPI-3f9e1ab0-aa83-4257-bd74-eaaecca883a1"; 

app.use(express.json());

app.get('/riot/buscar', async (req, res) => {
    const { gameName, tagLine } = req.query;

    if (!gameName || !tagLine) {
        return res.status(400).json({ error: "Informe gameName e tagLine na URL." });
    }

    try {
        const accUrl = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
        const accRes = await axios.get(accUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } });
        const puuid = accRes.data.puuid;

        db.prepare(`INSERT OR IGNORE INTO invocadores (puuid, gameName, tagLine) VALUES (?, ?, ?)`).run(puuid, accRes.data.gameName, accRes.data.tagLine);

        const matchIdsUrl = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`;
        const matchIdsRes = await axios.get(matchIdsUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } });
        const matchId = matchIdsRes.data[0];

        if (!matchId) return res.json({ message: "Nenhuma partida encontrada para este jogador." });

        const matchUrl = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const matchRes = await axios.get(matchUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } });
        const matchData = matchRes.data.info;

        db.prepare(`INSERT OR IGNORE INTO partidas (matchId, gameMode) VALUES (?, ?)`).run(matchId, matchData.gameMode);

        const partidaJaExiste = db.prepare('SELECT count(*) as count FROM participantes WHERE matchId = ?').get(matchId);
        
        if (partidaJaExiste.count === 0) {
            const insertParticipante = db.prepare(`
                INSERT INTO participantes (matchId, puuid, championName, win, kills, deaths, assists, items, spells, wardsPlaced, runes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const salvarJogadores = db.transaction((participantes) => {
                for (const p of participantes) {
                    const items = JSON.stringify([p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6]);
                    const spells = JSON.stringify([p.summoner1Id, p.summoner2Id]);
                    const runes = JSON.stringify(p.perks.styles[0].selections.map(r => r.perk)); 

                    insertParticipante.run(
                        matchId, p.puuid, p.championName, p.win ? 1 : 0, 
                        p.kills, p.deaths, p.assists, items, spells, p.wardsPlaced, runes
                    );
                }
            });
            salvarJogadores(matchData.participants);
        }

        res.json({ message: "Dados da Riot processados e salvos com sucesso!", matchId: matchId });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "Erro ao consultar a API da Riot." });
    }
});


app.get('/local/buscar', (req, res) => {
    const { gameName, tagLine } = req.query;

    if (!gameName || !tagLine) {
        return res.status(400).json({ error: "Informe gameName e tagLine." });
    }

    const invocador = db.prepare('SELECT * FROM invocadores WHERE gameName = ? AND tagLine = ?').get(gameName, tagLine);
    
    if (!invocador) {
        return res.status(404).json({ message: "Jogador não encontrado no banco de dados local." });
    }

    const historico = db.prepare(`
        SELECT p.matchId, p.gameMode, part.championName, part.win, part.kills, part.deaths, part.assists, part.items
        FROM partidas p
        JOIN participantes part ON p.matchId = part.matchId
        WHERE part.puuid = ?
    `).all(invocador.puuid);

    res.json({
        invocador: invocador,
        historico: historico
    });
});

app.get('/local/todos', (req, res) => {
    const todosInvocadores = db.prepare('SELECT * FROM participantes').all();
    const todasPartidas = db.prepare('SELECT * FROM partidas').all();

    res.json({
        total_invocadores: todosInvocadores.length,
        invocadores: todosInvocadores,
        total_partidas: todasPartidas.length,
        partidas: todasPartidas
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});