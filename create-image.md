# Create a Gaming Image

## References

* https://aws.amazon.com/blogs/compute/use-amazon-ec2-for-cost-efficient-cloud-gaming-with-pay-as-you-go-pricing/
* https://github.com/aws-samples/cloud-gaming-on-ec2-instances
* https://github.com/DanielThomas/ec2gaming/wiki/First-time-configuration


## Setup the environment

1. Create S3 bucket for game syncing
2. Setup tooling
3. Get source for instance control and cdk constructs
4. Generate AWS key pair
5. Configure and bootstrap CDK

These steps only need to be done once for a development environment.

1. **Setup Tooling**

awscli is used for calling AWS APIs.  
coreutils provides...  
jq is for getting data from json.  
tunnelblick is used to create a VPN connection to the gaming instance to connect to the "local network" for Steam  
steam is for the gamez.  

```bash
brew install awscli coreutils jq tunnelblick steam
npm install -g aws-cdk@latest
```

2. **Get source for instance control and cdk constructs**

```bash
[[ -d ecgaming ]] || git clone git@github.com:DanielThomas/ec2gaming.git
[[ -d cloud-gaming-on-ec2-instances ]] || git clone git@github.com:aws-samples/cloud-gaming-on-ec2-instances
```
and create a config file from template,
```bash
# workdir ec2gaming
cp ec2gaming.cfg.template ec2gaming.cfg
```

3. **Generate AWS key pair**

Set `KEY_NAME` in `ec2gaming.cfg` and run,
```bash
# workdir ec2gaming
./ec2gaming pem
```

4. **Install dependencies and boostrap CDK**

```bash
# workdir ec2gaming
./ec2gaming cdk-bootstrap

# cd ../cloud-gaming-on-ec2-instances/cdk
npm install
```

## Building

**1. Transpile, Synthesize, Deploy**

*TypeScript to JavaScript, Synthesize to CloudFormation, Deploy to AWS*

The command pattern and environment variables are captured in `deploy.sh`. It runs `npm run build; cdk synth; cdk deploy CloudGamingOnG4DN` and sets the environment variables, `ACCOUNT_ID`, `REGION`, `ALLOW_CIDR`. By default, `ALLOW_CIDR` is set to your public IP but querying checkip.amazonaws.com.
```bash
# workdir cloud-gaming-on-ec2-instance/cdk
./deploy.sh 123412341234 us-east-1
```

**2. Create RDP session**

```bash
./ec2gaming rdp
```

**3. Usability Adjustments**

1. [Disable the IE Enhanced Security Configuration, so you can use IE](https://docs.microsoft.com/en-us/troubleshoot/browsers/enhanced-security-configuration-faq#how-to-turn-off-internet-explorer-esc-on-windows-servers)
2. Setup automatic login - Run `netplwiz.exe` and make it so `Adminstrator` doesn't need to give a password.
3. [Disable the windows firewall](https://www.dell.com/support/kbdoc/en-us/000135271/windows-server-how-to-properly-turn-off-the-windows-firewall-in-windows-server-2008-and-above)
```PowerShell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```
4. Enable showing filename extensions

**4. Install software**

Install things in Desktop\InstallationFiles.

1. Nvidia drivers
2. DCV server
3. DCV driver
4. update registy
5. Steam

Run `init-local-storage.ps1` to initialize the instance storage on drive `Z:`. This is also installed to run on startup for subsequent starts.

Setup Steam with the following settings

1. Make it remember your username/password so it can auto-login every time
2. In the Steam preferences, add `Z:\` to `Downloads > Steam Library Folders`.
3. Turn off Automatic Sign-in of Friends in Friends, and turn off the promo dialog in Interface (at the bottom).
4. Enable hardware encoding at In-Home Streaming > Advanced Host Options > Enable Hardware Encoding

**5. Enable Nvidia NvFBC encoder**

The GRID cards have an optimization Steam can use which can offload the H.264 video encoding to the GPU. We need to enable this though. Download NvFBCEnable from here and run the following (using a Command Prompt): `NvFBCEnable.exe -enable -noreset`.

**6. Create Logout Command**

Once all is set up, run the following to log out of the Remote Desktop session and not lock the screen (so games can start): `C:\Windows\System32\tscon.exe %sessionname% /dest:console`. I suggest creating a shortcut on the desktop for this. 


## VPN?

If that sounds interesting, check out [step 8](https://lg.io/2015/07/05/revised-and-much-faster-run-your-own-highend-cloud-gaming-service-on-ec2.html#creating-your-own-ami-with-the-right-config).


## Create Image

**1. Cleanup before creating image**

```DOS
Dism.exe /online /Cleanup-Image /StartComponentCleanup
Dism.exe /online /Cleanup-Image /StartComponentCleanup /ResetBase
Dism.exe /online /Cleanup-Image /SPSuperseded
```
**2. Create an image**

```bash
ec2gaming snapshot
ec2gaming terminate
```

## Todo

[ ] Install DCV client on Windows to test USB controller  
[X] use .cfg to load vars instead of modding .ts file  
[X] discover local IP when setting up SG using checkip.amazonaws.com  
[X] Create S3 bucket for transfer and sync. Leave in script for now to treat as immutable infra.  
[X] Write install.ps1 to ec2 instance to save from clicking individual steps.  
[X] add 'stopped' instance state to ec2gaming  
[X] setup instance profile in CDK. copy from ecgaming-start.sh  