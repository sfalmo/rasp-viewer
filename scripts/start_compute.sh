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

serviceaccount="$(gcloud config list --format 'value(core.account)' 2>/dev/null)"
project="$(gcloud config list --format 'value(core.project)' 2>/dev/null)"
zone="$(gcloud config list --format 'value(compute.zone)' 2>/dev/null)"

sshkeyfilename="$HOME/.ssh/${project}_key"
if [[ -f "$sshkeyfilename" ]]
then
    sshkey="$(cat "$sshkeyfilename")"
else
    echo "ERROR: SSH key cound not be found at $sshkeyfilename. Make sure you are logged in with the correct username and have generated a key pair saved in ~/.ssh with the expected name."
    exit 1
fi

webserverhost="$(hostname -f)"
webserveruser="$LOGNAME"

computeinstance="rasp-compute-$region-$day"

dockerregistry="europe-west3-docker.pkg.dev"

read -r -d '' startupscript << EOF
#!/bin/bash

export HOME=/home/appuser
docker-credential-gcr configure-docker --registries="$dockerregistry"

docker run \
	--privileged \
	--restart=always \
	--log-driver=gcplogs \
	--hostname="$computeinstance" \
	--env START_DAY="$day" \
	--env OFFSET_HOUR=0 \
	--env WEBSERVER_SEND=1 \
	--env SEND_WRFOUT=1 \
	--env SSH_KEY="$sshkey" \
	--env WEBSERVER_HOST="$webserverhost" \
	--env WEBSERVER_USER="$webserveruser" \
	--env WEBSERVER_RESULTSDIR="$resultsdir" \
	--env REQUEST_DELETE=1 \
	$dockerregistry/$project/rasp/rasp:fedora42_WRFv4.7.1-znver5_$REGION
EOF

echo "Starting VM for ${REGION} ${day} and expecting data in ${resultsdir} ..."
gcloud compute --project="$project" instances create "$computeinstance" \
       --tags=rasp-compute \
       --zone="$zone" \
       --machine-type=c4d-highcpu-8 \
       --subnet=default \
       --network-tier=PREMIUM \
       --maintenance-policy=MIGRATE \
       --service-account="$serviceaccount" \
       --scopes=https://www.googleapis.com/auth/cloud-platform \
       --image-family=cos-stable \
       --image-project=cos-cloud \
       --boot-disk-type=hyperdisk-balanced \
       --boot-disk-size=20 \
       --boot-disk-device-name="$computeinstance" \
       --no-shielded-secure-boot \
       --shielded-vtpm \
       --shielded-integrity-monitoring \
       --metadata=startup-script="$startupscript"
echo "Done"
