#!/usr/bin/env bash

if [[ $# -ne 4 ]]
then
    echo "USAGE: delete_old_results.sh <resultsdir> <REGION> <folderdays> <wrfoutdays>"
    exit 1;
fi

resultsdir=$1
REGION=$2
folderdays=$3
wrfoutdays=$4

find "$resultsdir/OUT/$REGION" -mindepth 1 -maxdepth 1 -type d -daystart -mtime "+$folderdays" -exec rm -r {} +
find "$resultsdir/LOG/$REGION" -mindepth 1 -maxdepth 1 -type d -daystart -mtime "+$folderdays" -exec rm -r {} +

find "$resultsdir/OUT/$REGION" -name "wrfout_d*" -type f -daystart -mtime "+$wrfoutdays" -delete
