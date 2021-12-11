#!/usr/bin/env bash

export ACCOUNT_ID=$1
export REGION=$2
export ALLOW_CIDR="$(curl --silent http://checkip.amazonaws.com)/32"

npm run build
cdk synth
cdk deploy --require-approval never CloudGamingOnG4DN