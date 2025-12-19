# Scripts for managing RASP runs in the Google Cloud

## Start a run

An SSH key is used by the compute instance to transfer the results of the run back to the webserver.
For this, the script expects a secret key with the filename `<project>_key` in your `~/.ssh` directory, where `<project>` is the name of the Google Cloud project.
Additionally, the corresponding public key `<project>_key.pub` needs to be added to `~/.ssh/authorized_keys`.

```shell
$ ./start_compute.sh <region> <day> <results directory>
```

## Stop compute instances

This kills all running compute instances.

```shell
$ ./kill_all_compute.sh
```
