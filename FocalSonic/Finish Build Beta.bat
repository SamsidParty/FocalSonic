
cd .\bin\production\x64
signtool sign /f "%USERPROFILE%\Documents\Certificates\SamsidParty Private.pfx" /p %SP_KEY% /fd SHA256 .\FocalSonic.exe

cd ..\..\..\

SET F=".\BUILD"
 
IF EXIST %F% RMDIR /S /Q %F%

c:\windows\system32\xcopy.exe ".\MSIX Beta" .\BUILD /E /H /C /I
c:\windows\system32\xcopy.exe /s .\bin\production\x64 .\BUILD

cd .\BUILD

MakeAppx pack /d .\ /p .\FocalSonic.msix
signtool sign /f "%USERPROFILE%\Documents\Certificates\SamsidParty Private.pfx" /p %SP_KEY% /fd SHA256 .\FocalSonic.msix