import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import { BaseConfig, BaseEc2Stack } from "./base";

export interface G4DNConfig extends BaseConfig {
    gridSwCertUrl: string;
}

export class G4DNStack extends BaseEc2Stack {
    protected props: G4DNConfig;

    constructor(scope: cdk.Construct, id: string, props: G4DNConfig) {
        super(scope, id, props);
        this.props = props;
    }

    protected getInstanceType() {
        return ec2.InstanceType.of(ec2.InstanceClass.G4DN, this.props.instanceSize);
    }

    protected getUserdata() {
        const userData = ec2.UserData.forWindows();
        userData.addCommands(
            `$NiceDCVDisplayDrivers = "${this.props.niceDCVDisplayDriverUrl}"`,
            `$NiceDCVServer = "${this.props.niceDCVServerUrl}"`,
            `$InstallationFilesFolder = "$home\\Desktop\\InstallationFiles"`,
            `$Bucket = "nvidia-gaming"`,
            `$KeyPrefix = "windows/latest"`,
            `$LocalTempPath = "$home\\Desktop\\temp"`,
            `$StartupFolder = "$home\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"`,
            `$Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1`,
            `foreach ($Object in $Objects) {
                $LocalFileName = $Object.Key
                if ($LocalFileName -ne '' -and $Object.Size -ne 0) {
                    $LocalFilePath = Join-Path $LocalTempPath $LocalFileName
                    Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1
                }
            }`,
            'Expand-Archive $LocalFilePath -DestinationPath $InstallationFilesFolder\\1_NVIDIA_drivers',
            'Invoke-WebRequest -Uri $NiceDCVServer -OutFile $InstallationFilesFolder\\2_NICEDCV-Server.msi',
            'Invoke-WebRequest -Uri $NiceDCVDisplayDrivers -OutFile $InstallationFilesFolder\\3_NICEDCV-DisplayDriver.msi',
            `'reg add "HKLM\\SOFTWARE\\NVIDIA Corporation\\Global" /v vGamingMarketplace /t REG_DWORD /d 2' >> $InstallationFilesFolder\\4_update_registry.ps1`,
            'Remove-Item $LocalTempPath -Recurse',
            `Invoke-WebRequest -Uri "${this.props.gridSwCertUrl}" -OutFile "$Env:PUBLIC\\Documents\\GridSwCert.txt"`,
            `Invoke-WebRequest -Uri "${this.props.steamClientUrl}" -OutFile $InstallationFilesFolder\\5_SteamSetup.exe`,
            `Invoke-WebRequest -Uri "https://lg.io/assets/NvFBCEnable.zip" -OutFile $InstallationFilesFolder\\6_NvFBCEnable.zip`,
            '',
            `'Initialize-Disk 1' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            `'New-Partition -DiskNumber 1 -DriveLetter Z -UseMaximumSize' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            `'Format-Volume -DriveLetter Z -FileSystem NTFS' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            `'md Z:\\SteamLibrary\\steamapps' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            '',
            `'PowerShell -Command "Set-ExecutionPolicy Unrestricted" >> "%TEMP%\\StartupLog.txt" 2>&1' >> C:\\Users\\Administrator\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\InitLocalStorage.cmd`,
            `'PowerShell -windowstyle hidden $InstallationFilesFolder\\init-local-storage.ps1 >> "%TEMP%\\StartupLog.txt" 2>&1' >> C:\\Users\\Administrator\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\InitLocalStorage.cmd`,
            '',
            `'' >> $InstallationFilesFolder\\OK`
        );

        return userData;
    }
}
