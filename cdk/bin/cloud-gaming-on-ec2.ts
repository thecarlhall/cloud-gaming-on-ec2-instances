/* tslint:disable:no-import-side-effect no-submodule-imports no-unused-expression */
import * as ec2 from "@aws-cdk/aws-ec2";
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { G4DNStack } from "../lib/g4dn";
import { G4ADStack } from "../lib/g4ad";

const app = new cdk.App();

const GRID_SW_CERT_URL = "https://nvidia-gaming.s3.amazonaws.com/GridSwCert-Archive/GridSwCertWindows_2021_10_2.cert";
const STEAM_URL = "https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe";
const PARSEC_URL = "https://builds.parsecgaming.com/package/parsec-windows.exe";
const NVFBC_URL = "https://lg.io/assets/NvFBCEnable.zip";
const VB_AUDIO_URL = "https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack43.zip"
const SSH_KEY_NAME = process.env.KEY_NAME || "GamingOnEc2";
const VOLUME_SIZE_GIB = 35;
const OPEN_PORTS = [3389];
const ALLOW_INBOUND_CIDR = process.env.ALLOW_CIDR || "0.0.0.0/0";
const ACCOUNT_ID = process.env.ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT;
const REGION = process.env.REGION || process.env.CDK_DEFAULT_REGION;
const ASSOCIATE_EIP = (process.env.ASSOCIATE_EIP === 'true') || (process.env.ASSOCIATE_EIP === '1');

new G4DNStack(app, "CloudGamingOnG4DN", {
    gridSwCertUrl: GRID_SW_CERT_URL,
    steamUrl: STEAM_URL,
    parsecUrl: PARSEC_URL,
    nvfbcUrl: NVFBC_URL,
    vbaudioUrl: VB_AUDIO_URL,
    instanceSize: ec2.InstanceSize.XLARGE,
    sshKeyName: SSH_KEY_NAME,
    volumeSizeGiB: VOLUME_SIZE_GIB,
    openPorts: OPEN_PORTS,
    associateElasticIp: ASSOCIATE_EIP,
    allowInboundCidr: ALLOW_INBOUND_CIDR,
    env: {
        account: ACCOUNT_ID,
        region: REGION
    },
    tags: {
        "project": "CloudGamingG4DN"
    },
    useDefaultVpc: true
});

new G4ADStack(app, "CloudGamingOnG4AD", {
    steamUrl: STEAM_URL,
    parsecUrl: PARSEC_URL,
    nvfbcUrl: NVFBC_URL,
    vbaudioUrl: VB_AUDIO_URL,
    instanceSize: ec2.InstanceSize.XLARGE4,
    sshKeyName: SSH_KEY_NAME,
    volumeSizeGiB: VOLUME_SIZE_GIB,
    openPorts: OPEN_PORTS,
    associateElasticIp: ASSOCIATE_EIP,
    allowInboundCidr: ALLOW_INBOUND_CIDR,
    env: {
        account: ACCOUNT_ID,
        region: REGION
    },
    tags: {
        "project": "CloudGamingG4AD"
    },
    useDefaultVpc: true
});
