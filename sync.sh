#!/bin/zsh

HOSTNAME=$(hostname)

if [[ $HOSTNAME == "vultr" ]];
then
	git -C "/home/valerio/valerioiacobucci.com" pull
	echo ciao > ~/cane
else
	ssh valerio@valerioiacobucci.com sh -c '/home/valerio/valerioiacobucci.com/sync.sh'
fi

