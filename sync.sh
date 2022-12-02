#!/bin/zsh

HOSTNAME=$(hostname)

if [[ $HOSTNAME == "vultr" ]];
then
	git -C "/home/valerio/valerioiacobucci.com" pull
	systemctl --user restart server
	systemctl --user status server
else
	git push
	ssh valerio@valerioiacobucci.com git -C "/home/valerio/valerioiacobucci.com" pull
	ssh valerio@valerioiacobucci.com systemctl --user restart server
	ssh valerio@valerioiacobucci.com systemctl --user status server
fi

