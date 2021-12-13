import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import { BaseConfig, BaseEc2Stack } from "./base";

// tslint:disable-next-line:no-empty-interface
export interface G4ADConfig extends BaseConfig {

}

export class G4ADStack extends BaseEc2Stack {
    protected props: G4ADConfig;

    constructor(scope: cdk.Construct, id: string, props: G4ADConfig) {
        super(scope, id, props);
    }

    protected getUserdata() {
        const userData = ec2.UserData.forWindows();
        userData.addCommands(
            `$Parsec = "${this.props.parsecUrl}"`,
            `$Steam = "${this.props.steamUrl}"`,
            `$VbAudio = "${this.props.vbaudioUrl}"`,
            `$InstallationFilesFolder = "$home\\Desktop\\InstallationFiles"`,
            `$StartupFolder = "$home\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"`,
            `$LocalTempPath = "$home\\Desktop\\temp"`,
            `$Bucket = "ec2-amd-windows-drivers"`,
            `$KeyPrefix = "latest"`,
            '',
            `$Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1`,
            `foreach ($Object in $Objects) {
                $LocalFileName = $Object.Key
                if ($LocalFileName -ne '' -and $Object.Size -ne 0) {
                    $LocalFilePath = Join-Path $InstallationFilesFolder $LocalFileName
                    Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1
                    Expand-Archive $LocalFilePath -DestinationPath $InstallationFilesFolder\\1_AMD_driver
                }
            }`,
            'Expand-Archive $LocalFilePath -DestinationPath $InstallationFilesFolder\\1_NVIDIA_drivers',
            `Invoke-WebRequest -Uri "$VbAudio" -OutFile $LocalTempPath\\VbAudio.zip`,
            `Expand-Archive "$LocalTempPath\\VbAudio.zip" -DestinationPath $InstallationFilesFolder\\2_VbAudio`,
            `Invoke-WebRequest -Uri "$Parsec" -OutFile $InstallationFilesFolder\\3_parsec-windows.exe`,
            `Invoke-WebRequest -Uri "$Steam" -OutFile $InstallationFilesFolder\\4_SteamSetup.exe`,
            `Invoke-WebRequest -Uri "$NvFBC" -OutFile $LocalTempPath\\NvFBCEnable.zip`,
            `Expand-Archive "$LocalTempPath\\NvFBCEnable.zip" -DestinationPath $InstallationFilesFolder\\5_NvFBCEnable`,
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

    protected getInstanceType() {
        return new ec2.InstanceType(`g4ad.${this.props.instanceSize}`);
    }
}
