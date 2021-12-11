/* tslint:disable:no-import-side-effect no-submodule-imports no-unused-expression */
import * as ec2 from "@aws-cdk/aws-ec2";
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { G4DNStack } from "../lib/g4dn";
import { G4ADStack } from "../lib/g4ad";

const app = new cdk.App();

const NICE_DCV_DISPLAY_DRIVER_URL = "https://d1uj6qtbmh3dt5.cloudfront.net/Drivers/nice-dcv-virtual-display-x64-Release-34.msi";
const NICE_DCV_SERVER_URL = "https://d1uj6qtbmh3dt5.cloudfront.net/2021.0/Servers/nice-dcv-server-x64-Release-2021.0-10242.msi";
const GRID_SW_CERT_URL = "https://nvidia-gaming.s3.amazonaws.com/GridSwCert-Archive/GridSwCertWindows_2021_10_2.cert";
const STEAM_CLIENT_URL = "https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe";
const SSH_KEY_NAME = "GamingOnEc2";
const VOLUME_SIZE_GIB = 35;
// rdp = 3389; nice dcv = 8443
const OPEN_PORTS = [3389, 8443];
const ALLOW_INBOUND_CIDR = process.env.ALLOW_CIDR || "0.0.0.0/0";
const ACCOUNT_ID = process.env.ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT;
const REGION = process.env.REGION || process.env.CDK_DEFAULT_REGION;
const ASSOCIATE_EIP = (process.env.ASSOCIATE_EIP === 'true') || (process.env.ASSOCIATE_EIP === '1');

new G4DNStack(app, "CloudGamingOnG4DN", {
    niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
    niceDCVServerUrl: NICE_DCV_SERVER_URL,
    gridSwCertUrl: GRID_SW_CERT_URL,
    steamClientUrl: STEAM_CLIENT_URL,
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
    niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
    niceDCVServerUrl: NICE_DCV_SERVER_URL,
    steamClientUrl: STEAM_CLIENT_URL,
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
    }
});
