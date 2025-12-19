# Opens a new PowerShell window and runs npm run dev
# The -NoExit flag keeps the terminal open after the command completes or if it fails
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

