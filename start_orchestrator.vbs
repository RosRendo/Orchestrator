Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\FOR RENDO (ONLY )\Personal Project\Orchestrator\backend"
WshShell.Run "cmd.exe /c npm run start:dev", 0, False
