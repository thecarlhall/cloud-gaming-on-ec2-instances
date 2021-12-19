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
            `$GridSwCert = "${this.props.gridSwCertUrl}"`,
            `$Parsec = "${this.props.parsecUrl}"`,
            `$Steam = "${this.props.steamUrl}"`,
            `$NvFBC = "${this.props.nvfbcUrl}"`,
            `$VbAudio = "${this.props.vbaudioUrl}"`,
            `$InstallationFilesFolder = "$home\\Desktop\\InstallationFiles"`,
            `$StartupFolder = "$home\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"`,
            `$LocalTempPath = "$home\\Desktop\\temp"`,
            `$Bucket = "nvidia-gaming"`,
            `$KeyPrefix = "windows/latest"`,
            '',
            `msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi`,
            '',
            `$Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1`,
            `foreach ($Object in $Objects) {
                $LocalFileName = $Object.Key
                if ($LocalFileName -ne '' -and $Object.Size -ne 0) {
                    $LocalFilePath = Join-Path $LocalTempPath $LocalFileName
                    Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1
                }
            }`,
            'Expand-Archive $LocalFilePath -DestinationPath $InstallationFilesFolder\\1_NVIDIA_drivers',
            `Invoke-WebRequest -Uri "$VbAudio" -OutFile $LocalTempPath\\VbAudio.zip`,
            `Expand-Archive "$LocalTempPath\\VbAudio.zip" -DestinationPath $InstallationFilesFolder\\2_VbAudio`,
            `Invoke-WebRequest -Uri "$NvFBC" -OutFile $LocalTempPath\\NvFBCEnable.zip`,
            `Expand-Archive "$LocalTempPath\\NvFBCEnable.zip" -DestinationPath $InstallationFilesFolder\\3_NvFBCEnable`,
            `Invoke-WebRequest -Uri "$Parsec" -OutFile $InstallationFilesFolder\\4_parsec-windows.exe`,
            `'reg add "HKLM\\SOFTWARE\\NVIDIA Corporation\\Global" /v vGamingMarketplace /t REG_DWORD /d 2' >> $InstallationFilesFolder\\5_update_registry.ps1`,
            `Invoke-WebRequest -Uri "$GridSwCert" -OutFile "$Env:PUBLIC\\Documents\\GridSwCert.txt"`,
            `Invoke-WebRequest -Uri "$Steam" -OutFile $InstallationFilesFolder\\6_SteamSetup.exe`,
            'Remove-Item $LocalTempPath -Recurse',
            '',
            `'if (!(Test-Path Z:)) {' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            `'    Initialize-Disk 1' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            `'    New-Partition -DiskNumber 1 -DriveLetter Z -UseMaximumSize' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            `'    Format-Volume -DriveLetter Z -FileSystem NTFS' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            `'    md Z:\\SteamLibrary\\steamapps' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            `'}' >> $InstallationFilesFolder\\init-local-storage.ps1`,
            '',
            `'PowerShell -Command "Set-ExecutionPolicy Unrestricted" >> $InstallationFilesFolder\\StartupLog.txt" 2>&1' >> $StartupFolder\\InitLocalStorage.cmd`,
            `'PowerShell -windowstyle hidden $InstallationFilesFolder\\init-local-storage.ps1 >> $InstallationFilesFolder\\StartupLog.txt" 2>&1' >> $StartupFolder\\InitLocalStorage.cmd`,
            '',
            `'' >> $InstallationFilesFolder\\OK`
        );

        return userData;
    }
}
