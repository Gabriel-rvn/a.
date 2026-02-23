Query Params
    São parâmetros passados na URL após o símbolo de interrogação ?. Eles são usados principalmente para filtrar, ordenar ou paginar dados.
        Ref: https://expressjs.com/en/api.html#req.query

Path Params
    São parâmetros variáveis que fazem parte do caminho da URL. Eles servem para identificar um recurso específico.
        Ref: https://expressjs.com/en/guide/routing.html#route-parameters

Header
    São metadados enviados tanto na requisição quanto na resposta.
        Ref: https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Headers

Endpoint
    É a URL específica onde o seu servidor recebe requisições para realizar uma tarefa (como buscar dados ou salvar um usuário). Cada endpoint é a combinação de um caminho (ex: /salvar-dados) e um método HTTP (GET, POST, etc).

SQL = Structured Query Language
    Linguagem de consulta universal de banco de dados. 
        Ref: https://www.sqlite.org/cli.html   

SQLiteStudio
    É um mecanismo de banco de dados relacional embutido, de código aberto e sem servidor.
    
Mapa de dados necessários:
    Tabela: Invocador
        puuid
        gameName
        tagLine 

    Tabela: Partidas
        matchId
        gameMode
    
    Tabela: Participantes
        id 
        matchId
        puuid 
        championName
        win
        kills / deaths / assists
        items
        spells
        wardsPlaced
        runes
