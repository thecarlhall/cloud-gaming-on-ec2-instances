$AccountID = (curl http://169.254.169.254/latest/dynamic/instance-identity/document | grep accountId | awk '{print $3}' | sed  's/"//g' | sed 's/,//g')
$Bucket = "ec2gaming-${AccountID}"

aws s3 sync 'C:\Users\Administrator\Documents\My Games' "s3://${Bucket}/My Games" `
    --storage-class ONEZONE_IA

aws s3 sync Z:\SteamLibrary "s3://${Bucket}/" `
    --exclude '*/*' `
    --include 'steamapps/appmanifest_*' `
    --include 'steamapps/common/*' `
    --storage-class ONEZONE_IA