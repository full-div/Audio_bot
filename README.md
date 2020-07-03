# Audio_Bot
Un bot che capisce cosa viene detto nella chat di discord in cui è inserito. Se quello che hai detto contiene "Audio" diventerai sordo da un momento all'altro. L'antidoto è "Stop mute".

## Disclamer:
- Questo si basa su questa reposity: https://github.com/healzer/DiscordEarsBot
- Il codice aggiunto è in beta e creato principalmente per il mio server discord.
- Il codice non è ottimizatto e potrebbe contenere alcuni errori poichè non sono molto pratico con javascript.

## Installazione
Hai bisogno di NodeJs con versione > 12
```
sudo apt-get install -y sox screen
git clone https://github.com/healzer/DiscordEarsBot.git
cd DiscordEarsBot
npm install
```

## Impostazioni
Crea un account gratis di discord e ottieni le credenziali API (Bot Token). Qui c'è un tutorial: https://www.writebots.com/discord-bot-token/.
Nota: Dai al tuo bot abbastanza permessi oppure semplicemente dagli il permesso Amministatore.

Crea un account (gratis) di WitAI e ottieni le credenziali API: https://wit.ai/

Rinomina il file `settings-sample.json` to `settings.json` e scrivi le credenziali ottenute.
```
{
    "discord_token": "your_token",
    "wit_ai_token": "your_token"
}
```

## Come funziona?

Modalità sviluppatore (log in console):
```
node index.js
```

## Usa
Crea un server discord, fai entrare il tuo bot, mettilo in esecuzione sulla tua macchina.

1. Entra in un canale vocale a cui il bot ha accesso.
2. Scrivi `*join` in uno dei tuoi canali testuali e il bot entrerà nella tua chat.
3. Ogni cosa detta nella chat vocale verrà analizzato e se corrisponde a "Audio", la persona che l'ha detto diventerà sordo. Dicendo "stop mute" sentirai nuovamente.
4. Scrivi `*leave` per farlo uscire.

## Contact
Per domande, feedback o errori, contattatemi (jonathan-caputo@hotmail.com)!
