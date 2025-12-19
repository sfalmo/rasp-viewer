#!/usr/bin/env bash

# This script is intended to be used in a cronjob to start compute instances which run RASP forecasts.
# Use crontab -e and add an entry similar to the following:
# 0 4 * * * /path/to/start_compute.sh REGION 0 /var/www/html/results 2>&1
# schedule
#                                     region folder
#                                            day (0 -> today, 1 -> tomorrow,...)
#                                              results directory (i.e. where OUT and LOG is), must exist!

if [[ $# -ne 3 ]]
then
    echo "USAGE: start_compute.sh <REGION> <day> <resultsdir>"
    exit 1
fi

if ! command -v rsync >/dev/null 2>&1
then
    echo "ERROR: rsync needs to be installed"
    exit 1
fi

REGION=$1
region="$(echo "$REGION" | tr '[:upper:]' '[:lower:]')"
day=$2
resultsdir=$3

project="$(gcloud config list --format 'value(core.project)' 2>/dev/null)"
zone="$(hostname -A | cut -d. -f2)"
serviceaccount="$(gcloud config list --format 'value(core.account)' 2>/dev/null)"
sshkeyfilename="$HOME/.ssh/${project}_key"
if [[ -f "$sshkeyfilename" ]]
then
    sshkey="$(cat "$sshkeyfilename")"
else
    echo "ERROR: SSH key cound not be found at $sshkeyfilename. Make sure you are logged in with the correct username and have generated a key pair saved in ~/.ssh with the expected name."
    exit 1
fi
hostname="$(hostname -A | cut -d' ' -f1)"

echo "Starting VM for ${REGION} ${day} and expecting data in ${resultsdir} ..."
gcloud compute --project="$project" instances create-with-container "rasp-compute-$region-$day" \
       --zone="$zone" \
       --machine-type=c4d-highcpu-8 \
       --subnet=default \
       --network-tier=PREMIUM \
       --metadata=google-logging-enabled=true \
       --maintenance-policy=MIGRATE \
       --service-account="$serviceaccount" \
       --scopes=https://www.googleapis.com/auth/cloud-platform \
       --image-family=cos-stable \
       --image-project=cos-cloud \
       --boot-disk-type=hyperdisk-balanced \
       --boot-disk-size=20 \
       --boot-disk-device-name="rasp-compute-$region-$day" \
       --no-shielded-secure-boot \
       --shielded-vtpm \
       --shielded-integrity-monitoring \
       --container-image="europe-west3-docker.pkg.dev/$project/rasp/rasp:fedora42_WRFv4.7.1-znver5_$REGION" \
       --container-restart-policy=always \
       --container-privileged --container-stdin --container-tty \
       --container-env=START_DAY="$day",OFFSET_HOUR=0,WEBSERVER_SEND=1,SEND_WRFOUT=1,SSH_KEY="$sshkey",WEBSERVER_HOST="$hostname",WEBSERVER_USER="$LOGNAME",WEBSERVER_RESULTSDIR="$resultsdir",REQUEST_DELETE=1 \
       --tags=rasp-compute
echo "Done"
