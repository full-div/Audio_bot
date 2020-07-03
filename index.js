//////////////////////////////////////////
//////////////// LOGGING /////////////////
//////////////////////////////////////////
function getCurrentDateString() {
    return (new Date()).toISOString() + ' ::';
};
__originalLog = console.log;
console.log = function () {
    var args = [].slice.call(arguments);
    __originalLog.apply(console.log, [getCurrentDateString()].concat(args));
};
//////////////////////////////////////////
//////////////////////////////////////////

const fs = require('fs');
const util = require('util');
const path = require('path');

//////////////////////////////////////////
///////////////// VARIA //////////////////
//////////////////////////////////////////

function necessary_dirs() {
    if (!fs.existsSync('./temp/')){
        fs.mkdirSync('./temp/');
    }
    if (!fs.existsSync('./data/')){
        fs.mkdirSync('./data/');
    }
}
necessary_dirs()


function clean_temp() {
    const dd = './temp/';
    fs.readdir(dd, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(dd, file), err => {
                if (err) throw err;
            });
        }
    });
}
clean_temp(); // clean files at startup

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


async function convert_audio(infile, outfile, cb) {
    try {
        let SoxCommand = require('sox-audio');
        let command = SoxCommand();
        streamin = fs.createReadStream(infile);
        streamout = fs.createWriteStream(outfile);
        command.input(streamin)
            .inputSampleRate(48000)
            .inputEncoding('signed')
            .inputBits(16)
            .inputChannels(2)
            .inputFileType('raw')
            .output(streamout)
            .outputSampleRate(16000)
            .outputEncoding('signed')
            .outputBits(16)
            .outputChannels(1)
            .outputFileType('wav');

        command.on('end', function() {
            streamout.close();
            streamin.close();
            cb();
        });
        command.on('error', function(err, stdout, stderr) {
            console.log('Cannot process audio: ' + err.message);
            console.log('Sox Command Stdout: ', stdout);
            console.log('Sox Command Stderr: ', stderr)
        });

        command.run();
    } catch (e) {
        console.log('convert_audio: ' + e)
    }
}
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


//////////////////////////////////////////
//////////////// CONFIG //////////////////
//////////////////////////////////////////

const SETTINGS_FILE = 'settings.json';

let DISCORD_TOK = null;
let witAPIKEY = null;
let SOUND = null;
let SPOTIFY_TOKEN_ID = null;
let SPOTIFY_TOKEN_SECRET = null;

function loadConfig() {
    const CFG_DATA = JSON.parse( fs.readFileSync(SETTINGS_FILE, 'utf8') );

    DISCORD_TOK = CFG_DATA.discord_token;
    witAPIKEY = CFG_DATA.wit_ai_token;
    SOUND = "'" + CFG_DATA.sound + "'";
}
loadConfig()
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


const Discord = require('discord.js')
const DISCORD_MSG_LIMIT = 2000;
const discordClient = new Discord.Client()
discordClient.on('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`)
})
discordClient.login(DISCORD_TOK)

const PREFIX = '*';
const _CMD_HELP        = PREFIX + 'help';
const _CMD_JOIN        = PREFIX + 'join';
const _CMD_LEAVE       = PREFIX + 'leave';
const _CMD_AUDIO       = PREFIX + 'audio';
const _CMD_STOPAUDIO   = PREFIX + 'stop-audio';
const _CMD_DEBUG       = PREFIX + 'debug';
const _CMD_TEST        = PREFIX + 'hello';

const guildMap = new Map();


discordClient.on('message', async (msg) => {
    try {
        if (!('guild' in msg) || !msg.guild) return; // prevent private messages to bot
        const mapKey = msg.guild.id;
        if (msg.content.trim().toLowerCase() == _CMD_JOIN) {
            if (!msg.member.voice.channelID) {
                msg.reply('Errore: prima entra in un canale vocale!')
            } else {
                if (!guildMap.has(mapKey))
                    await connect(msg, mapKey)
                else
                    msg.reply('Sono già connesso!')
            }
        } else if (msg.content.trim().toLowerCase() == _CMD_LEAVE) {
            if (guildMap.has(mapKey)) {
                let val = guildMap.get(mapKey);
                if (val.voice_Channel) val.voice_Channel.leave()
                if (val.voice_Connection) val.voice_Connection.disconnect()
                if (val.musicYTStream) val.musicYTStream.destroy()
                    guildMap.delete(mapKey)
                msg.reply("Disconnesso")
            } else {
                msg.reply("Come faccio ad uscire se non sono ancora connesso?")
            }
        } else if (msg.content.trim().toLowerCase() == _CMD_HELP) {
            msg.reply(getHelpString());
        } else if (msg.content.trim().toLowerCase() == _CMD_AUDIO) {
            msg.member.voice.setDeaf(true);
        }
        else if (msg.content.trim().toLowerCase() == _CMD_DEBUG) {
            console.log('toggling debug mode')
            let val = guildMap.get(mapKey);
            if (val.debug)
                val.debug = false;
            else
                val.debug = true;
        }
        else if (msg.content.trim().toLowerCase() == _CMD_TEST) {
            msg.reply('Ciao! ;)')
        }
    } catch (e) {
        console.log('discordClient message: ' + e)
        msg.reply('Errore#180: Qualcosa è andato storto, prova ancora o contatta gli sviluppatori @Jonathan e @Forkio se questo continua a succedere.');
    }
})

function getHelpString() {
    let out = '**COMANDI:**\n'
        out += '```'
        out += PREFIX + 'join\n';
        out += PREFIX + 'audio [member.id]\n';
        out += PREFIX + 'stop-audio [member.id]\n';
        out += PREFIX + 'leave\n';
        out = '**COMANDI VOCALI:**\n'
        out += 'se la stringa contiene audio\n';
        out += 'se la stringa contiene stop-audio\n';
        out += '```'
    return out;
}

const { Readable } = require('stream');

const SILENCE_FRAME = Buffer.from([0xF8, 0xFF, 0xFE]);

class Silence extends Readable {
  _read() {
    this.push(SILENCE_FRAME);
    this.destroy();
  }
}

async function connect(msg, mapKey) {
    try {
        let voice_Channel = await discordClient.channels.fetch(msg.member.voice.channelID);
        if (!voice_Channel) return msg.reply("Errore: Il canale vocale non esiste!");
        let text_Channel = await discordClient.channels.fetch(msg.channel.id);
        if (!text_Channel) return msg.reply("Errore: Il canale testuale non esiste!");
        let voice_Connection = await voice_Channel.join();
        voice_Connection.play('ts-sound.mp3', { volume: 2 });
        guildMap.set(mapKey, {
            'text_Channel': text_Channel,
            'voice_Channel': voice_Channel,
            'voice_Connection': voice_Connection,
            'musicQueue': [],
            'musicDispatcher': null,
            'musicYTStream': null,
            'currentPlayingTitle': null,
            'currentPlayingQuery': null,
            'debug': false,
        });
        speak_impl(voice_Connection, mapKey)
        voice_Connection.on('disconnect', async(e) => {
            if (e) console.log(e);
            guildMap.delete(mapKey);
        })
        msg.reply('faccio parte della vostra gang di 2008!')
    } catch (e) {
        console.log('connect: ' + e)
        msg.reply('Errore: non riesco ad entrare nel tuo canale vocale');
        throw e;
    }
}


function speak_impl(voice_Connection, mapKey) {
    voice_Connection.on('speaking', async (user, speaking) => {
        if (speaking.bitfield == 0 /*|| user.bot*/) {
            return
        }
        console.log(`I'm listening to ${user.username}`);
        //guild = new Discord.Guild(discordClient, user)
        //var guildMembro = guild.members.fetch(user.id);

        const filename = './temp/audio_' + mapKey + '_' + user.username.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_' + Date.now() + '.tmp';
        let ws = fs.createWriteStream(filename);

        // this creates a 16-bit signed PCM, stereo 48KHz stream
        const audioStream = voice_Connection.receiver.createStream(user, { mode: 'pcm' })
        audioStream.pipe(ws)

        audioStream.on('error',  (e) => {
            console.log('audioStream: ' + e)
        });
        ws.on('error',  (e) => {
            console.log('ws error: ' + e)
        });
        audioStream.on('end', async () => {
            const stats = fs.statSync(filename);
            const fileSizeInBytes = stats.size;
            const duration = fileSizeInBytes / 48000 / 4;
            console.log("duration: " + duration)

            if (duration < 0.5 || duration > 19) {
                console.log("TOO SHORT / TOO LONG; SKPPING")
                fs.unlinkSync(filename)
                return;
            }

            const newfilename = filename.replace('.tmp', '.raw');
            fs.rename(filename, newfilename, (err) => {
                if (err) {
                    console.log('ERROR270:' + err)
                    fs.unlinkSync(filename)
                } else {
                    let val = guildMap.get(mapKey)
                    const infile = newfilename;
                    const outfile = newfilename + '.wav';
                    try {
                        convert_audio(infile, outfile, async () => {
                            let out = await transcribe_witai(outfile);
                            if (out != null){
                                process_commands_query(out, mapKey, user);
                            if (!val.debug) {
                                fs.unlinkSync(infile)
                                fs.unlinkSync(outfile)
                            }}
                        })
                    } catch (e) {
                        console.log('tmpraw rename: ' + e)
                        if (!val.debug) {
                            fs.unlinkSync(infile)
                            fs.unlinkSync(outfile)
                        }
                    }
                }

            });


        })
    })
}


function process_commands_query(txt, mapKey, user) {
    if (txt && txt.length) {
        let val = guildMap.get(mapKey);
        //val.text_Channel.send(user.username + ': ' + txt);
    if (txt.includes("audio")){
        console.log("________________________AUDIO_________________________")
        val.text_Channel.send(PREFIX + "audio " + user.id);
      } else if (txt.includes("stop muto")){
        console.log("________________________ STOP  AUDIO_________________________")
        val.text_Channel.send(PREFIX + "stop-audio " + user.id);
      }
    }
}

discordClient.on('message', async message => {
          if (message.content.includes(_CMD_AUDIO)) {
                let memberIddi = message.content.substring(message.content.indexOf(' ')+1);
                let member = message.guild.members.cache.get(memberIddi);
                if (member) {
                    console.log("Good!");
                    member.voice.setDeaf(true);
                }
                else {
                        message.channel.send("Persona non trovata...");
                }
            }else if (message.content.includes(_CMD_STOPAUDIO))  {
              let memberId = message.content.substring(message.content.indexOf(' ')+1);
              let member = message.guild.members.cache.get(memberId);
              if (member) {
                  console.log("Good stop-audio!");
                  member.voice.setDeaf(false);
              }
              else {
                      message.channel.send("Persona non trovata...");
              }
            }
        })

//////////////////////////////////////////
//////////////// SPEECH //////////////////
//////////////////////////////////////////
let witAI_lastcallTS = null;
const witClient = require('node-witai-speech');
async function transcribe_witai(file) {
    try {
        // ensure we do not send more than one request per second
        if (witAI_lastcallTS != null) {
            let now = Math.floor(new Date());
            while (now - witAI_lastcallTS < 1000) {
                console.log('sleep')
                await sleep(100);
                now = Math.floor(new Date());
            }
        }
    } catch (e) {
        console.log('transcribe_witai 837:' + e)
    }

    try {
        console.log('transcribe_witai')
        const extractSpeechIntent = util.promisify(witClient.extractSpeechIntent);
        var stream = fs.createReadStream(file);
        const output = await extractSpeechIntent(witAPIKEY, stream, "audio/wav")
        witAI_lastcallTS = Math.floor(new Date());
        console.log(output)
        stream.destroy()
        if (output && '_text' in output && output._text.length)
            return output._text
        if (output && 'text' in output && output.text.length)
            return output.text
        return output;
    } catch (e) { console.log('transcribe_witai 851:' + e) }
}
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////
