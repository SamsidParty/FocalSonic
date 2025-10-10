# FocalSonic 

Free and open source Apple Music client for Windows 11

![FocalSonic Screenshots](./Docs/Images/Hero.webp)

# Features ✨

- 🎨 **Customization** - Easily customize the colors and fonts of the UI
- 🔉 **Background Audio Playback** - Save resources by closing the player window
- ⏩ **Speed Control** - Slow down or speed up your music with smooth time stretching
- 🎤 **Lyrics** - Support for syllable-synced lyrics, including pronunciations for foreign languages
- 💬 **Discord RPC** - Show off what you're listening to on your Discord profile
- 📻 **Apple Music Radio** - (EXPERIMENTAL) Radio playback from personal radio stations 

## Future Plans 🚀

 - 🐧 Linux support
 - 🖼️ Animated cover art

## Not Planned / Won't Implement 🥀

 - ❌ Lossless audio / Dolby Atmos  
 Reason: Apple doesn't provide any legal method of playing DRM protected lossless files on Windows.

 - ❌ AutoMix / Sing / Apple Intelligence features  
 Reason: Windows PCs don't support Apple Intelligence

 - ❌ macOS support  
 Reason: A lot of work to put in with little demand, the official client for macOS is quite good already.
 

Please do not open issues regarding these features.

## Motivation

I decided to build FocalSonic because there is a clear lack of Apple Music clients for Windows. The official Apple Music app is very slow and buggy (at least for me) and the only real alternative, Cider, is also no longer free and open source.

FocalSonic is a side project I work on in my free time for 0 profit, please be patient when opening issues.

## Contributing
Pull requests are accepted, we would be glad to incorporate your contributions.

Ensure to install the following dependencies:
- .NET 9
- NodeJS / NPM

After that, running from source is simple:  
1. `git clone https://github.com/SamsidParty/FocalSonic.git`
2. `cd ./FocalSonic/FocalSonic`
3. `dotnet run`