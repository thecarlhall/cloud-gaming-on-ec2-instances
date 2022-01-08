# Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Amazon Software License (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
#
# http://aws.amazon.com/asl/
#
# or in the "license" file accompanying this file. This file is distributed
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
# express or implied. See the License for the specific language governing
# permissions and limitations under the License.

<#
.SYNOPSIS
        
    Initializes EC2 instance by configuring all required settings.

.DESCRIPTION
        
    During EC2 instance launch, it configures all required settings and displays information to console.

    0. Wait for sysprep: to ensure that sysprep process is finished.
    1. Add routes: to connect to instance metadata service and KMS service.
    2. Wait for metadata: to ensure that metadata is available to retrieve.

    * By default, it always checks serial port setup.
    * If any task requires reboot, it re-regsiters the script as scheduledTask.
    * Userdata is executed after windows is ready because it is not required by default and can be a long running process.

.PARAMETER Schedule
        
    Provide this parameter to register script as scheduledtask and trigger it at startup. If you want to run script immediately, run it without this parameter.
        
.EXAMPLE

    ./InitializeInstance.ps1 -Schedule

#>

# Required for powershell to determine what parameter set to use when running with zero args (us a non existent set name)
[CmdletBinding(DefaultParameterSetName = 'Default')]
param (
    # Schedules the script to run on the next boot.
    # If this argument is not provided, script is executed immediately.
    [parameter(Mandatory = $false, ParameterSetName = "Schedule")]
    [switch] $Schedule = $false,
    # Schedules the script to run at every boot.
    # If this argument is not provided, script is executed immediately.
    [parameter(Mandatory = $false, ParameterSetName = "SchedulePerBoot")]
    [switch] $SchedulePerBoot = $false,
    # After the script executes, keeps the schedule instead of disabling it.
    [parameter(Mandatory = $false, ParameterSetName = "KeepSchedule")]
    [switch] $KeepSchedule = $false
)

Set-Variable rootPath -Option Constant -Scope Local -Value (Join-Path $env:ProgramData -ChildPath "Amazon\EC2-Windows\Launch")
Set-Variable modulePath -Option Constant -Scope Local -Value (Join-Path $rootPath -ChildPath "Module\Ec2Launch.psd1")
Set-Variable scriptPath -Option Constant -Scope Local -Value (Join-Path $PSScriptRoot -ChildPath $MyInvocation.MyCommand.Name)
Set-Variable scheduleName -Option Constant -Scope Local -Value "Instance Initialization"

Set-Variable amazonSSMagent -Option Constant -Scope Local -Value "AmazonSSMAgent"
Set-Variable ssmAgentTimeoutSeconds -Option Constant -Scope Local -Value 25
Set-Variable ssmAgentSleepSeconds -Option Constant -Scope Local -Value 5

# Import Ec2Launch module to prepare to use helper functions.
Import-Module $modulePath

try {
    # Serial Port must be available in your instance to send logs to console. 
    # If serial port is not available, it sets the serial port and requests reboot. 
    # If serial port is already available, it continues without reboot.
    if ((Test-NanoServer) -and (Set-SerialPort)) {
        # Now Computer can restart.
        Write-Log "Message: Windows is restarting..." 
        Register-ScriptScheduler -ScriptPath $scriptPath -ScheduleName $scheduleName
        Restart-Computer
        Exit 0
    }

    # Serial port COM1 must be opened before executing any task.
    Open-SerialPort

    # Task must be executed after sysprep is complete.
    # WMI object seems to be missing during sysprep.
    Wait-Sysprep

    # Routes need to be added to connect to instance metadata service and KMS service.
    Add-Routes 
            
    # Once routes are added, we need to wait for metadata to be available 
    # becuase there are several tasks that need information from metadata.
    Wait-Metadata

    # Create wallpaper setup cmd file in windows startup directory, which
    # renders instance information on wallpaper as user logs in.
    New-WallpaperSetup

    # Serial port COM1 must be closed before ending.
    Close-SerialPort

    Exit 0
}
catch {
    Write-Log ("Failed to continue initializing the instance: {0}" -f $_.Exception.Message)

    # Serial port COM1 must be closed before ending.
    Close-SerialPort
    Exit 1
}