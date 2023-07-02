#!/bin/zsh

HOSTNAME=$(hostname)

if [[ $HOSTNAME == "vultr" ]];
then
	cd /home/valerio/valerioiacobucci.com
	git pull github $(git rev-parse --abbrev-ref HEAD 2>/dev/null)
	./build.sh
	docker-compose up -d
else
	ssh valerio@valerioiacobucci.com sh -c '/home/valerio/valerioiacobucci.com/sync.sh'
fi

