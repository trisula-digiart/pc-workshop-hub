Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")

' Set Working Directory ke folder proyek agar path relatif berfungsi normal
WshShell.CurrentDirectory = currentDir

' Angka 0 di akhir membuat jendela CMD berjalan di background (tersembunyi/silent)
WshShell.Run Chr(34) & currentDir & "\start-server.bat" & Chr(34), 0, False

Set WshShell = Nothing
