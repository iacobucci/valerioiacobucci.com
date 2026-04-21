#!/usr/bin/env bash

UPDATE_SERVICE=update-valerioiacobucci.com.service

function --publish {
	if [[ -n $(command -v push) ]];
	then
		push
	fi

	ssh valerio@valerioiacobucci.com "bash /home/valerio/source/web/valerioiacobucci.com/scripts/update.sh --setup --full"
}

function --setup {
	systemctl --user stop $UPDATE_SERVICE
	systemd-run --user --no-block --unit=$UPDATE_SERVICE bash -c "/home/valerio/source/web/valerioiacobucci.com/scripts/update.sh --job $1"
}

function --job {
	export NODE_OPTIONS=--max-old-space-size=1536

	cd /home/valerio/source/web/valerioiacobucci.com
	git pull

	git submodule update --remote --recursive

	pnpm install
	pnpm run build

	systemctl --user restart valerioiacobucci.com
}

function --watch {
	ssh valerio@valerioiacobucci.com "journalctl --user -f -u $UPDATE_SERVICE"
}

$@