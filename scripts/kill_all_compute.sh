#!/usr/bin/env bash

# This script can be used in a cron job to clean up long-running instances which are identified by a certain tag

instances=$(gcloud compute instances list | grep rasp-compute | awk '{print $1}')

project=$(gcloud config list --format 'value(core.project)' 2>/dev/null)
zone=$(hostname -A | cut -d. -f2)

if [[ -z "$instances" ]]
then
    echo "No running compute instances"
else
    echo "The following compute instances are still running and will be killed"
    echo $instances
    gcloud compute --project=$project instances delete $instances --zone=$zone --quiet
fi
