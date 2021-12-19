# Write-S3Object -BucketName ec2gaming-031971146660 -KeyPrefix steamapps -Folder Z:\SteamLibrary\steamapps -Recurse
aws s3 sync Z:\SteamLibrary\steamapps s3://ec2gaming-031971146660/