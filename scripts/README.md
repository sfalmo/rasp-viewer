# Scripts for managing RASP runs in the Google Cloud

## Start a run

First, make sure that a secret key with the filename `<project>_key` exists in your `.ssh` directory, where `<project>` is the name of the Google Cloud project.
This key is used by the compute instance to transfer the results of the run back to the webserver.

```shell
$ ./start_compute.sh <region> <day> <results directory>
```

## Stop compute instances

This kills all running compute instances.

```shell
$ ./kill_all_compute.sh
```
