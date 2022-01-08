$AccountID = (curl http://169.254.169.254/latest/dynamic/instance-identity/document | grep accountId | awk '{print $3}' | sed  's/"//g' | sed 's/,//g')
$Bucket = "ec2gaming-${AccountID}"

aws s3 sync "s3://${Bucket}/My Games" 'C:\Users\Administrator\Documents\My Games'
aws s3 sync "s3://${Bucket}/" Z:\SteamLibrary `
    --exclude '*/*' `
    --include 'steamapps/appmanifest_*'

$Games = (aws s3 ls "s3://${Bucket}/steamapps/common/") -replace '^.*PRE ([^/]+).*$', "`$1"

# convert list to array
for ($i = 0; $i -lt $Games.count; $i++) {
    $Count = $i + 1
    "$Count " + $Games[$i]
}
[uint16]$GameID = Read-Host "Choose which title # to sync"

# reset index to 0-base
$GameID = $GameID - 1

$Title = $Games[$GameID]
if ( $Title -eq "" -or $Title -eq $null ) {
    echo "Try again using a number on the left of the title you want."
    exit 1
}

echo "Syncing '${Title}' to 'Z:\SteamLibrary\steamapps\common\${Title}'"
aws s3 sync "s3://${Bucket}/steamapps/common/${Title}" "Z:\SteamLibrary\steamapps\common\${Title}"